/**
 * player_shield.js
 * -----------------------------------------------------------------------------
 * ESCUDINHO do agachar: enquanto o jogador está agachado aparece um escudo
 * pequeno e transparente um pouco acima da cabeça. Ele segura UM golpe
 * (bicho, chefão, projétil ou gelo caindo) e quebra.
 *
 * Depois de quebrar, agachar continua funcionando normal, mas sem escudo,
 * até a recarga acabar (DUCK_SHIELD.COOLDOWN_MS).
 * -----------------------------------------------------------------------------
 */
class PlayerShield {
  #player;
  #icon;
  #shards;
  #readyAt = 0; // quando o escudo volta a funcionar

  /** @param {Player} player dono deste componente */
  constructor(player) {
    const cfg = GameSettings.DUCK_SHIELD;
    const scene = player.scene;
    const depth = GameSettings.PLAYER.DEPTH + 0.1;
    this.#player = player;

    this.#icon = scene.add.image(player.x, player.y, FxTextureKeys.SHIELD)
      .setScale(cfg.SCALE)
      .setAlpha(cfg.ALPHA)
      .setDepth(depth)
      .setVisible(false);

    // caquinhos do escudo quebrando
    this.#shards = scene.add.particles(FxTextureKeys.SPARK).setDepth(depth)
      .createEmitter({
        on: false,
        speed: { min: 60, max: 160 },
        angle: { min: 200, max: 340 },
        gravityY: 400,
        lifespan: 400,
        scale: { start: 0.5, end: 0 },
        tint: [0xbfe6ff, 0xffffff]
      });
  }

  /** O escudo está de pé (agachado e com a recarga pronta)? */
  get isUp() {
    return this.#player.isDucking && this.remainingMs === 0;
  }

  /** Quanto falta para o escudo voltar (0 = pronto). */
  get remainingMs() {
    return Math.max(0, this.#readyAt - this.#player.scene.time.now);
  }

  /** Mostra ou esconde o escudo acima da cabeça (chamar a cada frame). */
  update() {
    const up = this.isUp;
    if (up && !this.#icon.visible) this.#popIn();
    this.#icon.setVisible(up);
    if (up) this.#icon.setPosition(...this.#abovePlayerHead());
  }

  /**
   * Tenta segurar um golpe.
   * @returns {boolean} true se o escudo segurou o golpe (e quebrou)
   */
  tryBlock() {
    if (!this.isUp) return false;
    const cfg = GameSettings.DUCK_SHIELD;
    this.#readyAt = this.#player.scene.time.now + cfg.COOLDOWN_MS;
    // o mesmo golpe (ex.: bicho ainda encostado) não machuca logo em seguida
    this.#player.health.grantInvulnerability(cfg.BLOCK_GRACE_MS);
    this.#playBreak();
    this.#icon.setVisible(false);
    SoundFx.play(this.#player.scene, SoundKeys.SHIELD);
    return true;
  }

  /** Esconde o escudo (ex.: jogador fora da partida). */
  hide() {
    this.#icon.setVisible(false);
  }

  /** Um pouquinho acima da cabeça (a hitbox não desce ao agachar). */
  #abovePlayerHead() {
    const body = this.#player.sprite.body;
    return [body.center.x, body.top - GameSettings.DUCK_SHIELD.ABOVE_HEAD];
  }

  /** Aparece crescendo rapidinho. */
  #popIn() {
    const cfg = GameSettings.DUCK_SHIELD;
    this.#icon.setScale(0);
    this.#player.scene.tweens.add({ targets: this.#icon, scale: cfg.SCALE, duration: cfg.POP_MS, ease: 'Back.easeOut' });
  }

  /** Quebrou: um "fantasma" do escudo cresce e some, soltando caquinhos. */
  #playBreak() {
    const cfg = GameSettings.DUCK_SHIELD;
    const [x, y] = this.#abovePlayerHead();
    const ghost = this.#player.scene.add.image(x, y, FxTextureKeys.SHIELD)
      .setScale(cfg.SCALE).setAlpha(0.9).setDepth(this.#icon.depth).setTintFill(0xffffff);
    this.#player.scene.tweens.add({
      targets: ghost, scale: cfg.SCALE * 1.8, alpha: 0, duration: cfg.BREAK_MS,
      onComplete: () => ghost.destroy()
    });
    this.#shards.explode(10, x, y);
  }
}
