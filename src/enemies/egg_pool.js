/**
 * egg_pool.js
 * -----------------------------------------------------------------------------
 * Ovos soltos pela águia enquanto voa (pool de projéteis).
 * Caem DEVAGARZINHO (gravidade própria bem fraca e velocidade de queda
 * limitada), mantendo o embalo horizontal do voo dela, e balançam um pouco.
 * Somem ao bater no terreno ou no jogador.
 * -----------------------------------------------------------------------------
 */
class EggPool extends ProjectilePool {
  /** @override */
  configure(egg) {
    const cfg = ENEMY_TYPES[EnemyTypeId.EAGLE].EGG;
    egg.setScale(cfg.SCALE);
    egg.setOrigin(0.5, 0.5);
    egg.setDepth(GameSettings.ENEMY.DEPTH + 0.5);
    egg.setData('seed', Math.random() * 1000);
    egg.body.setSize(egg.frame.realWidth * 0.8, egg.frame.realHeight * 0.8, true);
    egg.body.setAllowGravity(true);
    egg.body.setGravityY(cfg.GRAVITY - GameSettings.PHYSICS.GRAVITY_Y); // queda suave
    egg.body.maxVelocity.y = cfg.MAX_FALL_SPEED;
  }

  /** @override Balança enquanto cai. */
  updateProjectile(egg, time) {
    egg.setRotation(Math.sin(time * 0.008 + egg.getData('seed')) * 0.35);
  }
}
