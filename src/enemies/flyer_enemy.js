/**
 * flyer_enemy.js
 * -----------------------------------------------------------------------------
 * Bicho voador (morcego). Patrulha de um lado para o outro ondulando e,
 * quando o jogador chega perto, voa na direção dele.
 * -----------------------------------------------------------------------------
 */
class FlyerEnemy extends Enemy {
  #homeX;
  #homeY;
  #direction = -1;

  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {object} type
   * @param {MatchConfig} match
   * @param {Phaser.Events.EventEmitter} eventBus
   */
  constructor(scene, x, y, type, match, eventBus) {
    super(scene, x, y, type, match, eventBus);
    this.#homeX = x;
    this.#homeY = y;
    this.sprite.body.setAllowGravity(false);
  }

  /** @override */
  behave(time, player) {
    const type = this.type;
    if (this.distanceFrom(player) < type.CHASE_RANGE) this.#chase(player);
    else this.#patrol(time);

    this.sprite.setFlipX(this.sprite.body.velocity.x > 0);
  }

  /** @override Voadores param totalmente fora da câmera. */
  sleep() {
    if (this.isActive) this.sprite.setVelocity(0, 0);
  }

  /** Vai e volta em volta do ponto inicial, ondulando. */
  #patrol(time) {
    const type = this.type;
    if (this.x < this.#homeX - type.PATROL_RANGE) this.#direction = 1;
    if (this.x > this.#homeX + type.PATROL_RANGE) this.#direction = -1;

    const targetY = this.#homeY + Math.sin(time * type.WAVE_SPEED) * type.WAVE_AMPLITUDE;
    this.sprite.setVelocity(this.#direction * this.speed, (targetY - this.y) * 4);
  }

  /** Persegue o jogador. */
  #chase(player) {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    const speed = this.type.CHASE_SPEED * (this.speed / this.type.SPEED);
    this.sprite.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
  }
}
