/**
 * sonic_bat_enemy.js
 * -----------------------------------------------------------------------------
 * Morcego-Sônico (caverna): voa como o morcego e, de tempos em tempos, para
 * no ar e solta um GRITO — ondas de som (anéis que crescem) que empurram o
 * jogador para longe se ele estiver perto. Não tira coração, mas pode
 * jogar o jogador num buraco!
 * -----------------------------------------------------------------------------
 */
class SonicBatEnemy extends FlyerEnemy {
  #nextScreamAt;
  #screamUntil = 0;

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
    this.#nextScreamAt = scene.time.now + Phaser.Math.Between(0, type.SONIC.EVERY_MS);
  }

  /** @override Grita quando o jogador chega perto (e fica parado no ar gritando). */
  behave(time, player) {
    const cfg = this.type.SONIC;
    if (time < this.#screamUntil) {
      this.sprite.setVelocity(0, 0);
      return;
    }
    if (time >= this.#nextScreamAt && this.distanceFrom(player) < cfg.RADIUS * 1.4) {
      this.#scream(time, player);
      return;
    }
    super.behave(time, player);
  }

  /** Dois anéis de som crescendo; quem está dentro é empurrado para longe. */
  #scream(time, player) {
    const cfg = this.type.SONIC;
    this.#screamUntil = time + cfg.SCREAM_MS;
    this.#nextScreamAt = time + cfg.EVERY_MS;
    this.sprite.setVelocity(0, 0);

    [0, cfg.SCREAM_MS / 3].forEach(delay => {
      const ring = this.scene.add.circle(this.x, this.y, 10)
        .setStrokeStyle(4, 0xc8a8ff, 0.9)
        .setDepth(GameSettings.ENEMY.DEPTH + 0.5);
      this.scene.tweens.add({
        targets: ring, scale: cfg.RADIUS / 10, alpha: 0, delay, duration: cfg.SCREAM_MS,
        onComplete: () => ring.destroy()
      });
    });
    if (this.distanceFrom(player) < cfg.RADIUS) player.pushBack(Math.sign(player.x - this.x) || 1, cfg.FORCE);
  }
}
