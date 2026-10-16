/**
 * radial_burst_attack.js
 * -----------------------------------------------------------------------------
 * Poder do Dragão Vermelho: um anel de bolas de fogo em todas as
 * direções (o ataque especial do protótipo original).
 * -----------------------------------------------------------------------------
 */
class RadialBurstAttack extends BossAttack {
  /** @override */
  performSpecial() {
    const s = this.special;
    this.fireRing(s.PROJECTILES, s.SPEED, s.TEXTURE, s.EFFECT);
  }
}
