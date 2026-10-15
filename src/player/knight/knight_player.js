/**
 * knight_player.js
 * -----------------------------------------------------------------------------
 * Guerreiro: o herói original do protótipo, luta com espada.
 * -----------------------------------------------------------------------------
 */
class KnightPlayer extends Player {
  /** @override */
  createAttack(input) {
    return new SwordAttack(this, input);
  }

  /** @override Investida com dano contínuo. */
  createSpecial(input) {
    return new DashSpecial(this, input);
  }
}
