/**
 * player_status.js
 * -----------------------------------------------------------------------------
 * Efeitos temporários no jogador:
 *   - LENTIDÃO (gelo da serpente): anda mais devagar;
 *   - CONGELADO (bola de gelo do urso): preso num bloco de gelo, sem andar,
 *     pular nem atacar. Depois de descongelar fica um tempinho imune.
 * Para criar novos efeitos (veneno, escudo...) basta adicionar aqui.
 * -----------------------------------------------------------------------------
 */
class PlayerStatus {
  #player;
  #slowUntil = 0;
  #frozenUntil = 0;
  #freezeImmuneUntil = 0;
  #iceBlock = null;
  #wasFrozen = false;

  /** @param {Player} player dono deste componente */
  constructor(player) {
    this.#player = player;
  }

  /** Multiplicador atual de velocidade (1 = normal). */
  get speedMultiplier() {
    if (this.isFrozen) return 0;
    return this.isSlowed ? GameSettings.SLOW_EFFECT.SPEED_MULTIPLIER : 1;
  }

  /** Preso no gelo? */
  get isFrozen() {
    return this.#player.scene.time.now < this.#frozenUntil;
  }

  get isSlowed() {
    return this.#player.scene.time.now < this.#slowUntil;
  }

  /**
   * Aplica um efeito vindo de projétil/contato.
   * @param {string} effect valor de ProjectileEffect
   */
  apply(effect) {
    if (effect === ProjectileEffect.SLOW) this.#applySlow();
    if (effect === ProjectileEffect.FREEZE) this.#applyFreeze();
  }

  /** Atualiza a aparência (chamar a cada frame). */
  update() {
    const sprite = this.#player.sprite;
    const frozen = this.isFrozen;
    if (frozen) {
      sprite.setTint(GameSettings.FREEZE_EFFECT.TINT);
      this.#updateIceBlock();
    } else if (this.isSlowed) sprite.setTint(GameSettings.SLOW_EFFECT.TINT);
    else if (sprite.isTinted) sprite.clearTint();

    if (this.#wasFrozen && !frozen) this.#shatter();
    this.#wasFrozen = frozen;
  }

  #applyFreeze() {
    const now = this.#player.scene.time.now;
    if (this.isFrozen || now < this.#freezeImmuneUntil) return;
    const { DURATION_MS, IMMUNE_AFTER_MS } = GameSettings.FREEZE_EFFECT;
    this.#frozenUntil = now + DURATION_MS;
    this.#freezeImmuneUntil = this.#frozenUntil + IMMUNE_AFTER_MS;
    this.#player.scene.cameras.main.flash(120, 190, 240, 255);
  }

  /** Bloco de gelo em volta da hitbox, tremendo de leve. */
  #updateIceBlock() {
    const scene = this.#player.scene;
    const body = this.#player.sprite.body;
    if (!this.#iceBlock) {
      this.#iceBlock = scene.add.image(0, 0, FxTextureKeys.ICE_BLOCK).setDepth(this.#player.sprite.depth + 0.1);
    }
    const shake = Math.sin(scene.time.now * 0.08) * 1.2;
    this.#iceBlock.setVisible(true)
      .setPosition(body.center.x + shake, body.center.y)
      .setDisplaySize(body.width + 18, body.height + 14);
  }

  /** Descongelou: o bloco estoura em pedacinhos. */
  #shatter() {
    if (!this.#iceBlock) return;
    const scene = this.#player.scene;
    const { x, y } = this.#iceBlock;
    this.#iceBlock.setVisible(false);
    const particles = scene.add.particles(FxTextureKeys.SPARK).setDepth(this.#player.sprite.depth + 0.2);
    particles.createEmitter({
      on: false, speed: { min: 80, max: 240 }, angle: { min: 0, max: 360 }, gravityY: 500,
      scale: { start: 0.8, end: 0 }, lifespan: 500, tint: [0xffffff, 0xbfefff, 0x8fd8ff]
    }).explode(20, x, y);
    scene.time.delayedCall(700, () => particles.destroy());
  }

  #applySlow() {
    this.#slowUntil = this.#player.scene.time.now + GameSettings.SLOW_EFFECT.DURATION_MS;
  }
}
