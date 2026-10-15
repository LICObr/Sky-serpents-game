/**
 * double_ring_attack.js
 * -----------------------------------------------------------------------------
 * Poder da Serpente Glacial: dois anéis de gelo seguidos, o segundo
 * defasado para fechar os espaços por onde dava para escapar.
 * -----------------------------------------------------------------------------
 */
class DoubleRingAttack extends BossAttack {
  /** @override */
  performSpecial() {
    const s = this.special;
    const halfStep = Math.PI / s.PROJECTILES;
    this.fireRing(s.PROJECTILES, s.SPEED, s.TEXTURE, s.EFFECT);
    this.boss.scene.time.delayedCall(s.SECOND_RING_DELAY_MS, () => {
      this.fireRing(s.PROJECTILES, s.SPEED, s.TEXTURE, s.EFFECT, halfStep);
    });
  }
}
