/**
 * player_health.js
 * -----------------------------------------------------------------------------
 * Vida do jogador (corações), dano, cura e o COOLDOWN DE DANO.
 *
 * Cooldown de dano: depois de perder um coração, o jogador fica
 * invulnerável por alguns instantes (piscando). Nesse tempo nada tira
 * coração — nem bola de fogo, nem bicho, nem chefão. Só cair em buraco
 * ignora o cooldown (senão daria para "cair de graça").
 *
 * Não conhece o HUD nem o fluxo do jogo: apenas emite eventos
 * (PLAYER_HEARTS_CHANGED / PLAYER_DIED) que outras classes escutam.
 * -----------------------------------------------------------------------------
 */
class PlayerHealth {
  #player;
  #eventBus;
  #hearts;
  #maxHearts;
  #invulnerableUntil = 0;
  #blinkTween = null;

  /**
   * @param {Player} player dono deste componente
   * @param {number} maxHearts corações (depende da dificuldade)
   * @param {Phaser.Events.EventEmitter} eventBus
   */
  constructor(player, maxHearts, eventBus) {
    this.#player = player;
    this.#eventBus = eventBus;
    this.#maxHearts = maxHearts;
    this.#hearts = maxHearts;
  }

  get hearts()    { return this.#hearts; }
  get maxHearts() { return this.#maxHearts; }
  get isFull()    { return this.#hearts >= this.#maxHearts; }
  get isDead()    { return this.#hearts <= 0; }

  /** Está no cooldown de dano (piscando, não perde coração)? */
  get isInvulnerable() {
    return this.#player.scene.time.now < this.#invulnerableUntil;
  }

  /**
   * Perde um coração, respeitando o cooldown de dano.
   * @param {{force?: boolean}} [options] force = ignora o cooldown (buraco)
   * @returns {boolean} true se o dano foi aplicado
   */
  takeDamage({ force = false } = {}) {
    if (this.isDead || (!force && this.isInvulnerable)) return false;

    this.#hearts--;
    this.#emitHeartsChanged();

    if (this.isDead) {
      this.#eventBus.emit(GameEvents.PLAYER_DIED, this.#player);
      return true;
    }

    this.#startDamageCooldown();
    this.#player.sprite.setVelocityY(GameSettings.PLAYER.HIT_KNOCKBACK_Y); // "pulinho" de impacto
    return true;
  }

  /** Fica invulnerável por um tempo, sem piscar (ex.: durante a investida). */
  grantInvulnerability(ms) {
    this.#invulnerableUntil = Math.max(this.#invulnerableUntil, this.#player.scene.time.now + ms);
  }

  /** Recupera um coração (até o máximo). */
  heal() {
    if (this.isFull) return;
    this.#hearts++;
    this.#emitHeartsChanged();
  }

  /** Começa o cooldown: invulnerável e piscando até ele acabar. */
  #startDamageCooldown() {
    const { DAMAGE_COOLDOWN_MS, BLINK_INTERVAL_MS, BLINK_ALPHA } = GameSettings.PLAYER;
    const player = this.#player;
    this.#invulnerableUntil = player.scene.time.now + DAMAGE_COOLDOWN_MS;

    if (this.#blinkTween) this.#blinkTween.stop();
    player.sprite.setAlpha(1);
    this.#blinkTween = player.scene.tweens.add({
      targets: player.sprite,
      alpha: BLINK_ALPHA,
      duration: BLINK_INTERVAL_MS,
      yoyo: true,
      repeat: Math.max(0, Math.floor(DAMAGE_COOLDOWN_MS / (BLINK_INTERVAL_MS * 2)) - 1),
      onComplete: () => { if (player.isAlive) player.sprite.setAlpha(1); }
    });
  }

  #emitHeartsChanged() {
    this.#eventBus.emit(GameEvents.PLAYER_HEARTS_CHANGED, this.#hearts, this.#maxHearts, this.#player);
  }
}
