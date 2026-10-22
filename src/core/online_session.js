/**
 * online_session.js
 * -----------------------------------------------------------------------------
 * MODO ONLINE (2 jogadores, cada um no seu computador), do jeito mais simples
 * — igual ao "jogar junto à distância" da Steam:
 *   - o jogo roda só no computador de quem CRIOU a partida (o anfitrião), nos
 *     modos de 2 jogadores e no 1v1 que já existem;
 *   - a tela (e o som) dele vai como VÍDEO para o computador do outro;
 *   - as teclas do outro voltam pela rede e controlam o JOGADOR 2 (RemoteInput).
 *
 * Conexão navegador com navegador (WebRTC) pela biblioteca PeerJS — carregada
 * só quando alguém abre o modo online. Ela usa um servidor gratuito só para os
 * dois se acharem pelo CÓDIGO de 4 dígitos (o anfitrião vira "skyserpents-1234").
 *
 * As telas acompanham pelos eventos (OnlineSession.events):
 *   code (código)  status (texto)  guest-joined  guest-left  stream (vídeo)  closed
 * -----------------------------------------------------------------------------
 */
const OnlineRole = Object.freeze({ HOST: 'HOST', GUEST: 'GUEST' });

class OnlineSession {
  static events = new Phaser.Events.EventEmitter();
  static #role = null;
  static #peer = null;
  static #connection = null;
  static #call = null;
  static #code = null;
  static #remoteInput = new RemoteInput();
  static #badge = null;      // aviso "ONLINE" no canto de baixo da página
  static #heartbeat = null;  // o convidado reenvia as teclas de tempos em tempos
  static #held = [];

  constructor() {
    throw new TypeError('OnlineSession é estático e não deve ser instanciado.');
  }

  static get role() { return OnlineSession.#role; }
  static get code() { return OnlineSession.#code; }

  /** O anfitrião tem um jogador do outro computador conectado? */
  static get hasGuest() {
    return OnlineSession.#role === OnlineRole.HOST && Boolean(OnlineSession.#connection && OnlineSession.#connection.open);
  }

  /** Controles do jogador 2 que vêm pela rede (null se não há ninguém conectado). */
  static get remoteInput() {
    return OnlineSession.hasGuest ? OnlineSession.#remoteInput : null;
  }

  /**
   * Cria a partida: pega um código livre e espera o outro jogador.
   * @param {Phaser.Game} game o jogo (a tela dele vai como vídeo)
   */
  static async host(game) {
    await OnlineSession.#loadLibrary();
    OnlineSession.leave();
    OnlineSession.#role = OnlineRole.HOST;
    OnlineSession.#openHost(game, 0);
  }

  /**
   * Entra na partida de outro computador pelo código.
   * @param {string} code 4 dígitos
   */
  static async join(code) {
    await OnlineSession.#loadLibrary();
    OnlineSession.leave();
    OnlineSession.#role = OnlineRole.GUEST;
    OnlineSession.#code = code;
    OnlineSession.#status('Conectando...');
    const peer = new Peer({ debug: 0 });
    OnlineSession.#peer = peer;
    peer.on('open', () => {
      const connection = peer.connect(`${GameSettings.ONLINE.ID_PREFIX}${code}`, { reliable: true });
      OnlineSession.#connection = connection;
      connection.on('open', () => {
        OnlineSession.#status('Conectado! Esperando a imagem do jogo...');
        OnlineSession.#showBadge(`ONLINE - você é o JOGADOR 2 (código ${code}) - ESC sai`);
        OnlineSession.#heartbeat = setInterval(() => OnlineSession.#sendKeys(), GameSettings.ONLINE.KEY_HEARTBEAT_MS);
      });
      connection.on('close', () => OnlineSession.#closed('O outro jogador encerrou a partida.'));
    });
    peer.on('call', call => {
      OnlineSession.#call = call;
      call.answer(); // só recebe: o vídeo vem do anfitrião
      call.on('stream', stream => OnlineSession.events.emit('stream', stream));
    });
    peer.on('error', error => OnlineSession.#status(error.type === 'peer-unavailable'
      ? 'Código não encontrado. Confira os 4 números.'
      : `Não deu para conectar (${error.type}).`));
  }

  /**
   * Convidado: o que está apertado agora (ações), enviado para o anfitrião.
   * @param {string[]} held ações (ControlAction)
   */
  static sendKeys(held) {
    OnlineSession.#held = held;
    OnlineSession.#sendKeys();
  }

  /** Encerra (e esquece) a partida online. */
  static leave() {
    clearInterval(OnlineSession.#heartbeat);
    OnlineSession.#heartbeat = null;
    if (OnlineSession.#call) OnlineSession.#call.close();
    if (OnlineSession.#connection) OnlineSession.#connection.close();
    if (OnlineSession.#peer) OnlineSession.#peer.destroy();
    OnlineSession.#call = null;
    OnlineSession.#connection = null;
    OnlineSession.#peer = null;
    OnlineSession.#role = null;
    OnlineSession.#code = null;
    OnlineSession.#remoteInput.reset();
    OnlineSession.#hideBadge();
  }

  // ------------------------------------------------------------- anfitrião

  /** Registra "skyserpents-XXXX"; se o código já estiver em uso, tenta outro. */
  static #openHost(game, attempt) {
    const code = String(Phaser.Math.Between(0, 9999)).padStart(4, '0');
    const peer = new Peer(`${GameSettings.ONLINE.ID_PREFIX}${code}`, { debug: 0 });
    OnlineSession.#peer = peer;
    peer.on('open', () => {
      OnlineSession.#code = code;
      OnlineSession.events.emit('code', code);
      OnlineSession.#status('Mande o código para o outro jogador e espere ele entrar.');
      OnlineSession.#showBadge(`ONLINE - código ${code} - esperando o jogador 2`);
    });
    peer.on('error', error => {
      if (error.type === 'unavailable-id' && attempt < 5) {
        peer.destroy();
        OnlineSession.#openHost(game, attempt + 1);
      } else {
        OnlineSession.#status(`Não deu para criar a partida (${error.type}).`);
      }
    });
    peer.on('connection', connection => OnlineSession.#acceptGuest(game, peer, connection));
  }

  /** O outro jogador entrou: manda o vídeo do jogo e passa a ouvir as teclas dele. */
  static #acceptGuest(game, peer, connection) {
    if (OnlineSession.hasGuest) {
      connection.on('open', () => connection.close()); // só cabe um convidado
      return;
    }
    OnlineSession.#connection = connection;
    connection.on('open', () => {
      OnlineSession.#call = peer.call(connection.peer, OnlineSession.#captureGame(game));
      OnlineSession.#remoteInput.reset();
      OnlineSession.events.emit('guest-joined');
      OnlineSession.#status('O jogador 2 entrou! Escolha o modo.');
      OnlineSession.#showBadge(`ONLINE - código ${OnlineSession.#code} - jogador 2 conectado`);
    });
    connection.on('data', message => {
      if (message && message.t === 'keys') OnlineSession.#remoteInput.receive(message.held);
    });
    connection.on('close', () => {
      if (OnlineSession.#connection !== connection) return;
      OnlineSession.#connection = null;
      if (OnlineSession.#call) OnlineSession.#call.close();
      OnlineSession.#call = null;
      OnlineSession.#remoteInput.reset();
      OnlineSession.events.emit('guest-left');
      OnlineSession.#showBadge(`ONLINE - código ${OnlineSession.#code} - o jogador 2 saiu (esperando)`);
    });
  }

  /** A tela do jogo (e o som, se der) como um vídeo ao vivo. */
  static #captureGame(game) {
    const stream = game.canvas.captureStream(GameSettings.ONLINE.VIDEO_FPS);
    const sound = game.sound;
    if (sound.context && sound.masterVolumeNode) {
      const destination = sound.context.createMediaStreamDestination();
      sound.masterVolumeNode.connect(destination);
      destination.stream.getAudioTracks().forEach(track => stream.addTrack(track));
    }
    return stream;
  }

  // ------------------------------------------------------------- comum

  static #sendKeys() {
    const connection = OnlineSession.#connection;
    if (connection && connection.open) connection.send({ t: 'keys', held: OnlineSession.#held });
  }

  static #status(text) {
    OnlineSession.events.emit('status', text);
  }

  static #closed(text) {
    OnlineSession.leave();
    OnlineSession.events.emit('closed', text);
  }

  /** Carrega o PeerJS só quando precisa (o jogo normal não baixa nada a mais). */
  static #loadLibrary() {
    if (window.Peer) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = GameSettings.ONLINE.PEERJS_URL;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Sem internet: não deu para abrir o modo online.'));
      document.head.appendChild(script);
    });
  }

  /** Aviso fixo no canto da página (vale em qualquer tela). */
  static #showBadge(text) {
    if (!OnlineSession.#badge) {
      const badge = document.createElement('div');
      badge.style.cssText = 'position:fixed;bottom:6px;left:6px;z-index:20;white-space:nowrap;' +
        'padding:4px 10px;border-radius:4px;background:rgba(20,10,40,0.8);color:#8fe28a;' +
        `font:10px ${GameSettings.FONT.FAMILY};pointer-events:none;`;
      document.body.appendChild(badge);
      OnlineSession.#badge = badge;
    }
    OnlineSession.#badge.textContent = `● ${text}`;
  }

  static #hideBadge() {
    if (OnlineSession.#badge) OnlineSession.#badge.remove();
    OnlineSession.#badge = null;
  }
}
