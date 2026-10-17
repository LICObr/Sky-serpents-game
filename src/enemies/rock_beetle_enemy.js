/**
 * rock_beetle_enemy.js
 * -----------------------------------------------------------------------------
 * Besouro-Pedra (caverna): parado, igualzinho a uma pedra — e, como pedra,
 * nada acerta nele e encostar não machuca. Quando o jogador chega perto ele
 * ACORDA (olhos acesos) e dá uma INVESTIDA rápida na direção do jogador;
 * depois anda pelo chão como os outros bichos (WalkerEnemy).
 * -----------------------------------------------------------------------------
 */
class RockBeetleEnemy extends WalkerEnemy {
  #asleep = true;
  #chargeUntil = 0;

  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {object} type
   * @param {MatchConfig} match
   * @param {Phaser.Events.EventEmitter} eventBus
   * @param {LevelMap} levelMap
   */
  constructor(scene, x, y, type, match, eventBus, levelMap) {
    super(scene, x, y, type, match, eventBus, levelMap);
    this.setTextureIfChanged(type.SLEEP_FRAME);
  }

  /** @override Dormindo fica com cara de pedra (não anima). */
  get cyclesFrames() {
    return !this.#asleep;
  }

  /** @override Pedra não apanha (e encostar nela não machuca). */
  get canBeHit() {
    return super.canBeHit && !this.#asleep;
  }

  /** @override Dorme até o jogador chegar perto; acorda investindo. */
  behave(time, player) {
    if (this.#asleep) {
      this.sprite.setVelocityX(0);
      const near = Math.abs(player.x - this.x) < this.type.WAKE_RANGE_X && Math.abs(player.y - this.y) < 120;
      if (near) this.#wake(time, player);
      return;
    }
    if (time < this.#chargeUntil) return; // investida em andamento
    super.behave(time, player);
  }

  /** Acorda com um pulinho de susto e corre para cima do jogador. */
  #wake(time, player) {
    const direction = Math.sign(player.x - this.x) || -1;
    this.#asleep = false;
    this.#chargeUntil = time + this.type.CHARGE_MS;
    this.setTextureIfChanged(this.type.FRAMES[0]);
    this.sprite.setVelocity(direction * this.type.CHARGE_SPEED, -180);
    this.sprite.setFlipX(direction > 0); // a arte olha para a esquerda
  }
}
