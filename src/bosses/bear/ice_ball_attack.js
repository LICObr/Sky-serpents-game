/**
 * ice_ball_attack.js
 * -----------------------------------------------------------------------------
 * Poder do Urso Polar: BOLAS DE GELO que não tiram coração, mas CONGELAM o
 * jogador por alguns segundos (ProjectileEffect.FREEZE). Quem decide QUANDO
 * arremessar é o cérebro do urso (BearBrain), não o sorteio por frame.
 *
 *   throwBalls(n)     → n bolas em leque, mirando no jogador
 * -----------------------------------------------------------------------------
 */
class IceBallAttack extends BossAttack {
  /** @override O especial é o leque de bolas. */
  performSpecial() {
    this.throwBalls(this.special.PROJECTILES);
  }

  /**
   * Arremessa bolas de gelo em leque na direção do jogador.
   * @param {number} count quantidade de bolas
   */
  throwBalls(count) {
    const special = this.special;
    const { x, y } = this.boss.mouth;
    const target = this.boss.target;
    const aim = Phaser.Math.Angle.Between(x, y, target.x, target.y);
    const spread = Phaser.Math.DegToRad(special.SPREAD_DEG);
    for (let i = 0; i < count; i++) {
      const offset = count === 1 ? 0 : (i / (count - 1) - 0.5) * spread * 2;
      this.fire(aim + offset, special.SPEED, special.TEXTURE, special.EFFECT);
    }
  }
}
