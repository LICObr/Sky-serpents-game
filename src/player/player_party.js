/**
 * player_party.js
 * -----------------------------------------------------------------------------
 * Os JOGADORES da partida (1 ou 2). Quem precisa "do jogador" pergunta ao
 * grupo:
 *   - nearestTo(x, y) → o jogador mais perto (bichos e chefões miram nele)
 *   - sprites         → colisões valem para todos os jogadores
 *   - frontX          → o mais à frente (checkpoint, chegada, fim do percurso)
 *   - inGame          → quem está jogando agora
 *
 * Modo 2 jogadores: quem fica sem corações fica deitado, fora da partida (o
 * outro continua sozinho) — a não ser que o parceiro AGACHE em cima dele e
 * doe um coração (HeartDonation). Se os dois ficarem fora, é o fim
 * (PARTY_DEFEATED → game over). Com o fogo amigo ligado, um pode acertar o outro.
 * -----------------------------------------------------------------------------
 */
class PlayerParty {
  #players;
  #eventBus;
  #levelMap;
  #donation = null; // doar coração ao parceiro caído (só com 2 jogadores)

  /**
   * @param {Player[]} players
   * @param {Phaser.Events.EventEmitter} eventBus
   * @param {LevelMap} levelMap para achar chão firme ao renascer
   * @param {{donation?: boolean}} [options] donation = dá para doar coração ao parceiro caído
   */
  constructor(players, eventBus, levelMap, { donation = true } = {}) {
    this.#players = players;
    this.#eventBus = eventBus;
    this.#levelMap = levelMap;
    if (this.isCoop && donation) this.#donation = new HeartDonation(players[0].scene, this);
    eventBus.on(GameEvents.PLAYER_DIED, player => this.#onPlayerDied(player));
  }

  get players() { return this.#players; }
  get isCoop()  { return this.#players.length > 1; }
  get sprites() { return this.#players.map(player => player.sprite); }

  /** Quem está jogando agora (no modo 2 jogadores, quem ficou sem corações está fora). */
  get inGame() {
    return this.#players.filter(player => !player.isKnockedOut);
  }

  /** Posição x do jogador mais à frente. */
  get frontX() {
    return Math.max(...this.#xsInGame());
  }

  /** Ponto entre o mais atrás e o mais à frente (a câmera segue ele). */
  get centerX() {
    const xs = this.#xsInGame();
    return (Math.min(...xs) + Math.max(...xs)) / 2;
  }

  /** Jogador mais perto de um ponto (quem está fora da partida não conta). */
  nearestTo(x, y) {
    const candidates = this.inGame.length > 0 ? this.inGame : this.#players;
    const distance = player => Phaser.Math.Distance.Between(x, y, player.x, player.y);
    return candidates.reduce((nearest, player) => (distance(player) < distance(nearest) ? player : nearest));
  }

  /** Movimento de todos (chamar a cada frame). */
  update() {
    this.#players.forEach(player => player.update());
    if (this.#donation) this.#donation.update();
  }

  /** Ataques de quem está jogando. */
  handleAttacks(combat) {
    this.inGame.forEach(player => player.handleAttack(combat));
  }

  /** Fogo amigo (2 jogadores): cada jogador vira alvo dos ataques do outro. */
  registerFriendlyFire(combat) {
    if (!this.isCoop || !GameSettings.PARTY.FRIENDLY_FIRE) return;
    this.#players.forEach(player => combat.register(player, false)); // atingível; encostar não machuca
  }

  /** Bicho derrotado: adianta a recarga do especial de todo mundo. */
  reduceSpecialCooldowns(ms) {
    this.#players.forEach(player => player.special.reduceCooldown(ms));
  }

  /**
   * Chão firme ao lado de um parceiro em jogo (para renascer perto dele).
   * @returns {{x: number, groundY: number}|null} null sem parceiro (ou se ele está sobre um buraco ou lagoa)
   */
  spotNearPartner(player) {
    const partner = this.inGame.find(other => other !== player);
    if (!partner) return null;
    for (const offset of [0, -40, 40, -80, 80, -120, 120, -160, 160]) {
      const x = partner.x + offset;
      const groundY = this.#levelMap.surfaceYAt(x);
      if (groundY !== null && !this.#levelMap.waterAt(x)) return { x, groundY };
    }
    return null;
  }

  #xsInGame() {
    const players = this.inGame.length > 0 ? this.inGame : this.#players;
    return players.map(player => player.x);
  }

  /** Ficou sem corações: deita no chão, como morto, e está fora até o fim da fase. */
  #onPlayerDied(player) {
    player.knockOut(this.#levelMap.surfaceYAt(player.x));
    if (this.inGame.length === 0) this.#eventBus.emit(GameEvents.PARTY_DEFEATED); // ninguém sobrou: game over
  }
}
