/**
 * online_scene.js
 * -----------------------------------------------------------------------------
 * Tela do MODO ONLINE (OnlineSession), cada jogador no seu computador:
 *   CRIAR PARTIDA → aparece um código de 4 números para mandar ao amigo.
 *                   Quando ele entra, escolha FASES (2 jogadores) ou 1v1: o
 *                   jogo roda aqui e o amigo controla o JOGADOR 2 de lá;
 *   ENTRAR        → digite o código do amigo: a tela do jogo dele aparece aqui
 *                   (com o som) e as suas teclas controlam o JOGADOR 2.
 * ESC volta (e, para quem entrou, sai da partida).
 * -----------------------------------------------------------------------------
 */
const OnlineStep = Object.freeze({ MENU: 'MENU', HOST: 'HOST', JOIN: 'JOIN', WATCH: 'WATCH' });

class OnlineScene extends Phaser.Scene {
  #step;
  #parts = [];      // objetos da etapa atual (trocados a cada etapa)
  #rows = [];       // botões da etapa (teclado: ↑ ↓ e ENTER)
  #focusIndex = 0;
  #status;
  #typed = '';
  #codeText = null;
  #video = null;
  #held = new Set(); // convidado: ações apertadas agora
  #actionsByKey;     // convidado: tecla → ações

  constructor() {
    super({ key: SceneKeys.ONLINE });
  }

  create() {
    const { WIDTH, HEIGHT } = GameSettings.SCREEN;
    MusicPlayer.ensurePlaying(this);
    new SoundToggles(this);
    this.add.tileSprite(0, 0, WIDTH, HEIGHT, LEVEL_VERSUS.BACKGROUND_TEXTURE).setOrigin(0)
      .setTileScale(HEIGHT / this.textures.get(LEVEL_VERSUS.BACKGROUND_TEXTURE).getSourceImage().height);
    this.add.rectangle(0, 0, WIDTH, HEIGHT, 0x05081a, 0.6).setOrigin(0);
    this.add.text(WIDTH / 2, 56, 'ONLINE', UiStyle.text(30, '#ffe066')).setOrigin(0.5);
    this.add.text(WIDTH / 2, 92, 'cada jogador no seu computador', UiStyle.text(9, '#c8c0e0')).setOrigin(0.5);
    this.#status = this.add.text(WIDTH / 2, 470, '', { ...UiStyle.text(9, '#8fe28a'), wordWrap: { width: 640 } }).setOrigin(0.5);
    this.add.text(WIDTH / 2, HEIGHT - 22, 'SETAS escolher    ENTER confirmar    ESC voltar', UiStyle.text(7, '#c8c0e0')).setOrigin(0.5);
    this.#actionsByKey = OnlineScene.#keyMap();

    // o que acontece na conexão aparece aqui (e para de aparecer quando a tela fecha)
    const listeners = {
      status: text => this.#status.setText(text),
      code: code => this.#codeText && this.#codeText.setText(code.split('').join(' ')),
      'guest-joined': () => this.#showStep(OnlineStep.HOST),
      'guest-left': () => this.#showStep(OnlineStep.HOST),
      stream: stream => this.#watch(stream),
      closed: text => {
        this.#removeVideo();
        this.#showStep(OnlineStep.MENU);
        this.#status.setText(text);
      }
    };
    Object.entries(listeners).forEach(([name, listener]) => OnlineSession.events.on(name, listener));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      Object.entries(listeners).forEach(([name, listener]) => OnlineSession.events.off(name, listener));
      this.#removeVideo();
    });

    this.input.keyboard.on('keydown', event => this.#onKeyDown(event));
    this.input.keyboard.on('keyup', event => this.#onKeyUp(event));
    this.#showStep(OnlineSession.role === OnlineRole.HOST ? OnlineStep.HOST : OnlineStep.MENU);
  }

  // ------------------------------------------------------------- etapas

  #showStep(step) {
    this.#step = step;
    this.#parts.forEach(part => part.destroy());
    this.#rows.forEach(row => row.destroy());
    this.#parts = [];
    this.#rows = [];
    this.#codeText = null;
    const { WIDTH } = GameSettings.SCREEN;
    const add = part => {
      this.#parts.push(part);
      return part;
    };
    const button = (y, label, action) => {
      const row = new MenuButton(this, y, label, action);
      this.#rows.push(row);
      return row;
    };

    if (step === OnlineStep.MENU) {
      button(210, 'CRIAR PARTIDA', () => this.#createMatch());
      button(270, 'ENTRAR COM CÓDIGO', () => this.#showStep(OnlineStep.JOIN));
      this.#status.setText('Quem cria a partida joga com as teclas do JOGADOR 1; quem entra é o JOGADOR 2.');
    } else if (step === OnlineStep.HOST) {
      add(this.add.text(WIDTH / 2, 160, 'SEU CÓDIGO', UiStyle.text(11, '#c8c0e0')).setOrigin(0.5));
      this.#codeText = add(this.add.text(WIDTH / 2, 210, OnlineSession.code ? OnlineSession.code.split('').join(' ') : '. . . .',
        UiStyle.text(40, '#ffe066')).setOrigin(0.5));
      if (OnlineSession.hasGuest) {
        add(this.add.text(WIDTH / 2, 262, 'JOGADOR 2 CONECTADO!', UiStyle.text(11, '#8fe28a')).setOrigin(0.5));
        button(312, 'JOGAR FASES', () => this.scene.start(SceneKeys.LEVEL_SELECT,
          { characterIds: [CharacterId.KNIGHT, CharacterId.ARCHER], difficultyId: DEFAULT_DIFFICULTY }));
        button(362, 'JOGAR 1v1', () => this.scene.start(SceneKeys.VERSUS_SETUP));
      } else {
        add(this.add.text(WIDTH / 2, 262, 'esperando o jogador 2 entrar...', UiStyle.text(9, '#c8c0e0')).setOrigin(0.5));
      }
      button(420, 'ENCERRAR ONLINE', () => {
        OnlineSession.leave();
        this.#showStep(OnlineStep.MENU);
      });
    } else if (step === OnlineStep.JOIN) {
      this.#typed = '';
      add(this.add.text(WIDTH / 2, 170, 'DIGITE O CÓDIGO DO SEU AMIGO', UiStyle.text(11, '#c8c0e0')).setOrigin(0.5));
      this.#codeText = add(this.add.text(WIDTH / 2, 230, '', UiStyle.text(40, '#ffe066')).setOrigin(0.5));
      add(this.add.text(WIDTH / 2, 290, 'números do teclado    ENTER entrar    ESC voltar', UiStyle.text(8, '#c8c0e0')).setOrigin(0.5));
      this.#renderTyped();
      this.#status.setText('');
    }
    this.#focusIndex = 0;
    this.#rows.forEach((row, i) => row.setFocused(i === 0));
  }

  /** Cria a partida (o código aparece quando o servidor confirmar). */
  async #createMatch() {
    this.#showStep(OnlineStep.HOST);
    this.#status.setText('Criando a partida...');
    try {
      await OnlineSession.host(this.game);
    } catch (error) {
      this.#status.setText(error.message);
    }
  }

  /** Mostra o código digitado: "4 8 _ _". */
  #renderTyped() {
    const digits = this.#typed.padEnd(4, '_').split('');
    this.#codeText.setText(digits.join(' '));
  }

  // ------------------------------------------------------------- teclado

  #onKeyDown(event) {
    if (event.repeat) return;
    const codes = Phaser.Input.Keyboard.KeyCodes;
    if (this.#step === OnlineStep.WATCH) {
      if (event.keyCode === codes.ESC) this.#stopWatching();
      else this.#press(event.keyCode, true);
      return;
    }
    if (this.#step === OnlineStep.JOIN) {
      const digit = OnlineScene.#digit(event.keyCode);
      if (digit !== null && this.#typed.length < 4) this.#typed += digit;
      else if (event.keyCode === codes.BACKSPACE) this.#typed = this.#typed.slice(0, -1);
      else if (event.keyCode === codes.ENTER && this.#typed.length === 4) this.#join();
      else if (event.keyCode === codes.ESC) {
        if (OnlineSession.role === OnlineRole.GUEST) OnlineSession.leave(); // desiste de entrar
        this.#showStep(OnlineStep.MENU);
        return;
      }
      this.#renderTyped();
      return;
    }
    if (event.keyCode === codes.ESC) {
      if (OnlineSession.role === OnlineRole.GUEST) OnlineSession.leave();
      this.scene.start(SceneKeys.TITLE); // quem criou continua com a partida aberta (o aviso no alto mostra)
    } else if ([codes.UP, codes.W, codes.DOWN, codes.S].includes(event.keyCode) && this.#rows.length) {
      const delta = [codes.UP, codes.W].includes(event.keyCode) ? -1 : 1;
      this.#focusIndex = Phaser.Math.Wrap(this.#focusIndex + delta, 0, this.#rows.length);
      this.#rows.forEach((row, i) => row.setFocused(i === this.#focusIndex));
      SoundFx.play(this, SoundKeys.MENU_MOVE, { volume: 0.5 });
    } else if ([codes.ENTER, codes.SPACE].includes(event.keyCode) && this.#rows.length) {
      SoundFx.play(this, SoundKeys.MENU_OK);
      this.#rows[this.#focusIndex].activate();
    }
  }

  #onKeyUp(event) {
    if (this.#step === OnlineStep.WATCH) this.#press(event.keyCode, false);
  }

  /** Convidado: apertou/soltou uma tecla de jogo — manda para o anfitrião o que está apertado. */
  #press(keyCode, down) {
    const actions = this.#actionsByKey.get(keyCode);
    if (!actions) return;
    actions.forEach(action => (down ? this.#held.add(action) : this.#held.delete(action)));
    OnlineSession.sendKeys([...this.#held]);
  }

  /** Tecla → ações (vale qualquer tecla dos dois jogadores, como jogando sozinho). */
  static #keyMap() {
    const map = new Map();
    Object.entries(KeyBindings.soloInputKeys()).forEach(([action, names]) => names.forEach(name => {
      const code = Phaser.Input.Keyboard.KeyCodes[name];
      if (!map.has(code)) map.set(code, new Set());
      map.get(code).add(action);
    }));
    return map;
  }

  static #digit(keyCode) {
    if (keyCode >= 48 && keyCode <= 57) return String(keyCode - 48);  // números de cima
    if (keyCode >= 96 && keyCode <= 105) return String(keyCode - 96); // teclado numérico
    return null;
  }

  // ------------------------------------------------------------- convidado

  async #join() {
    this.#status.setText('Conectando...');
    try {
      await OnlineSession.join(this.#typed);
    } catch (error) {
      this.#status.setText(error.message);
    }
  }

  /** Chegou a imagem do jogo do amigo: ela cobre a tela e as teclas passam a ir para ele. */
  #watch(stream) {
    if (this.#video) { // o PeerJS avisa de novo para cada trilha (imagem e som): é o mesmo vídeo
      this.#video.srcObject = stream;
      return;
    }
    this.#showStep(OnlineStep.WATCH);
    const video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;
    video.srcObject = stream;
    video.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;object-fit:contain;background:#000;z-index:10;';
    document.body.appendChild(video);
    video.play().catch(() => {
      if (!video.isConnected) return;
      video.muted = true; // o navegador bloqueou o som: pelo menos a imagem
      video.play().catch(() => {});
    });
    this.#video = video;
    this.sound.mute = true; // o som vem do vídeo (do jogo do amigo)
    this.#status.setText('ESC sai da partida');
  }

  #stopWatching() {
    OnlineSession.leave();
    this.#removeVideo();
    this.scene.start(SceneKeys.TITLE);
  }

  #removeVideo() {
    if (!this.#video) return;
    this.#video.srcObject = null;
    this.#video.remove();
    this.#video = null;
    this.#held.clear();
    AudioSettings.apply(this); // volta o som do jogo daqui
  }
}
