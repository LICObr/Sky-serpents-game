/**
 * dust_cloud.js
 * -----------------------------------------------------------------------------
 * Nuvem de PÓ que a traça solta ao morrer (e de VENENO, a do sapo
 * venenoso): fica um pouquinho no ar e quem passar por dentro dela fica
 * lento (o mesmo efeito do gelo da serpente).
 * -----------------------------------------------------------------------------
 */
class DustCloud {
  #scene;
  #x;
  #y;
  #radius;
  #endsAt;
  #puff;

  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {{RADIUS: number, MS: number, TINT?: number[]}} config DEATH_DUST do tipo do bicho
   */
  constructor(scene, x, y, { RADIUS, MS, TINT = [0xd8ccb0, 0xb8a888, 0xe8dcc0] }) {
    this.#scene = scene;
    this.#x = x;
    this.#y = y;
    this.#radius = RADIUS;
    this.#endsAt = scene.time.now + MS;
    this.#puff = scene.add.particles(FxTextureKeys.GLOW).setDepth(GameSettings.ENEMY.DEPTH + 0.6)
      .createEmitter({
        x, y,
        lifespan: MS * 0.7,
        speed: { min: 5, max: 30 },
        scale: { start: 0.45, end: 0.9 },
        alpha: { start: 0.45, end: 0 },
        tint: TINT,
        frequency: 60,
        emitZone: { type: 'random', source: new Phaser.Geom.Circle(0, 0, RADIUS * 0.6) }
      });
    scene.time.delayedCall(MS * 0.4, () => this.#puff.stop()); // para de soltar e vai sumindo
  }

  /** A nuvem já se desfez? */
  get isDone() {
    return this.#scene.time.now >= this.#endsAt;
  }

  /** Quem estiver dentro da nuvem fica lento (chamar a cada frame). */
  update(players) {
    players.forEach(player => {
      if (Phaser.Math.Distance.Between(player.x, player.y, this.#x, this.#y) < this.#radius) {
        player.status.apply(ProjectileEffect.SLOW);
      }
    });
  }

  destroy() {
    this.#puff.manager.destroy();
  }
}
