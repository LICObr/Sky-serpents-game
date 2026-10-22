/**
 * ninja_player.js
 * -----------------------------------------------------------------------------
 * Ninja: o mais rápido. Katana veloz e furtiva (o primeiro golpe em cada
 * bicho vale o dobro) e PULO DUPLO (AIR_JUMPS no characters.js).
 * Especial: Bomba de Fumaça (some, fica invencível e todo golpe é furtivo).
 * -----------------------------------------------------------------------------
 */
class NinjaPlayer extends Player {
  /** @override */
  createAttack(input) {
    return new KatanaAttack(this, input);
  }

  /** @override Bomba de fumaça (deixa a katana furtiva). */
  createSpecial(input, katana) {
    return new SmokeBombSpecial(this, input, katana);
  }
}
