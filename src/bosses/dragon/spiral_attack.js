/**
 * spiral_attack.js
 * -----------------------------------------------------------------------------
 * Poder do Dragão Rosa Místico: espiral giratória — uma bola de cada
 * vez, mudando o ângulo, formando um redemoinho de magia.
 * -----------------------------------------------------------------------------
 */
class SpiralAttack extends BossAttack {
  /** @override */
  performSpecial() {
    const s = this.special;
    const step = (Math.PI * 2 * s.SPIRAL_TURNS) / s.PROJECTILES;
    const start = RandomUtils.angleRad();

    for (let i = 0; i < s.PROJECTILES; i++) {
      this.boss.scene.time.delayedCall(i * s.SPIRAL_STEP_MS, () => {
        this.fire(start + step * i, s.SPEED, s.TEXTURE, s.EFFECT);
      });
    }
  }
}
