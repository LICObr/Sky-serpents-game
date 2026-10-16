/**
 * archer_player.js
 * -----------------------------------------------------------------------------
 * Arqueira: ataca de longe com arco e flecha.
 * -----------------------------------------------------------------------------
 */
class ArcherPlayer extends Player {
  /** @override */
  createAttack(input) {
    return new BowAttack(this, input);
  }

  /** @override Tempestade de flechas (usa o próprio arco). */
  createSpecial(input, bow) {
    return new ArrowStormSpecial(this, input, bow);
  }
}
