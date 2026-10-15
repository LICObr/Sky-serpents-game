/**
 * boss_health.js
 * -----------------------------------------------------------------------------
 * Pontos de vida de um chefão. Emite BOSS_HP_CHANGED a cada dano para que a
 * barra de vida (HUD) e o fundo se atualizem sozinhos.
 * -----------------------------------------------------------------------------
 */
class BossHealth {
  #eventBus;
  #current;
  #max;

  /**
   * @param {number} maxHp
   * @param {Phaser.Events.EventEmitter} eventBus
   */
  constructor(maxHp, eventBus) {
    this.#eventBus = eventBus;
    this.#max = maxHp;
    this.#current = maxHp;
  }

  get current() { return this.#current; }
  get max()     { return this.#max; }
  get ratio()   { return Math.max(this.#current, 0) / this.#max; }
  get lostRatio() { return 1 - this.ratio; }
  get isDead()  { return this.#current <= 0; }

  /** Aplica dano e avisa quem estiver escutando. */
  damage(amount) {
    this.#current -= amount;
    this.#eventBus.emit(GameEvents.BOSS_HP_CHANGED, this.#current, this.#max);
  }
}
