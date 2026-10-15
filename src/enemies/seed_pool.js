/**
 * seed_pool.js
 * -----------------------------------------------------------------------------
 * Sementes cuspidas pelas plantas (pool de projéteis, como as bolas de fogo).
 * Giram enquanto voam; somem ao bater no terreno ou no jogador.
 * -----------------------------------------------------------------------------
 */
class SeedPool extends ProjectilePool {
  /** @override */
  configure(seed) {
    seed.setScale(0.1);
    seed.setOrigin(0.5, 0.5);
    seed.setDepth(GameSettings.ENEMY.DEPTH + 0.5);
    seed.body.setSize(seed.frame.realWidth * 0.8, seed.frame.realHeight * 0.8, true);
  }

  /** @override Semente girando. */
  updateProjectile(seed) {
    seed.rotation += 0.25;
  }
}
