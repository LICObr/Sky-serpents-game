/**
 * bard_player.js
 * -----------------------------------------------------------------------------
 * Bardo: luta com o florete (estocada) e, no especial, toca o alaúde — a
 * nota encantada transforma até 2 bichos em aliados (com dano reduzido).
 * -----------------------------------------------------------------------------
 */
class BardPlayer extends Player {
  /** @override */
  createAttack(input) {
    return new RapierAttack(this, input);
  }

  /** @override Nota encantada (aliados). */
  createSpecial(input) {
    return new CharmNoteSpecial(this, input);
  }
}
