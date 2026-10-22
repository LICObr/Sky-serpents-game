/**
 * viking_player.js
 * -----------------------------------------------------------------------------
 * Viking: arremessa o martelo (médio alcance) e precisa passar por cima dele
 * para pegar de volta; sem o martelo, luta no soquinho.
 * -----------------------------------------------------------------------------
 */
class VikingPlayer extends Player {
  /** @override */
  createAttack(input) {
    return new HammerAttack(this, input);
  }

  /** @override Trovão (raios nos bichos e o martelo volta para a mão). */
  createSpecial(input, hammerAttack) {
    return new ThunderSpecial(this, input, hammerAttack.hammer);
  }
}
