/**
 * shooter_enemy.js
 * -----------------------------------------------------------------------------
 * Planta cuspidora: fica plantada no chão. Quando o jogador entra no
 * alcance, abre a boca (aviso) e cospe uma semente na direção dele.
 * As sementes vêm de um pool compartilhado (SeedPool).
 * -----------------------------------------------------------------------------
 */
class ShooterEnemy extends Enemy {
  #seeds;
  #nextShotTime = 0;
  #mouthOpenUntil = 0;

  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {object} type
   * @param {MatchConfig} match
   * @param {Phaser.Events.EventEmitter} eventBus
   * @param {SeedPool} seeds de onde saem as sementes
   */
  constructor(scene, x, y, type, match, eventBus, seeds) {
    super(scene, x, y, type, match, eventBus);
    this.#seeds = seeds;
    this.#nextShotTime = scene.time.now + Phaser.Math.Between(0, type.SHOOT_INTERVAL_MS);
  }

  /** @override A planta escolhe o próprio quadro (fechada/cuspindo). */
  get cyclesFrames() {
    return false;
  }

  /** @override Parada no lugar; cospe quando o jogador está perto. */
  behave(time, player) {
    const type = this.type;
    this.sprite.setVelocityX(0); // plantada: nem o empurrão do golpe a move
    this.setTextureIfChanged(type.FRAMES[time < this.#mouthOpenUntil ? 1 : 0]);

    if (time < this.#nextShotTime || this.distanceFrom(player) > type.SHOOT_RANGE) return;
    this.#nextShotTime = time + type.SHOOT_INTERVAL_MS;
    this.#mouthOpenUntil = time + type.SHOOT_WINDUP_MS + 250;

    // Abre a boca (aviso) e só depois cospe
    this.scene.time.delayedCall(type.SHOOT_WINDUP_MS, () => {
      if (!this.isActive) return;
      const mouthY = this.y - this.sprite.displayHeight * 0.25;
      const angle = Phaser.Math.Angle.Between(this.x, mouthY, player.x, player.y);
      this.#seeds.spawn(this.x, mouthY, 'semente', angle, type.SEED_SPEED, { effect: ProjectileEffect.NONE });
    });
  }
}
