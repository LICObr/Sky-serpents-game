/**
 * star_rating.js
 * -----------------------------------------------------------------------------
 * ESTRELAS pelo tempo da fase. Cada fase define STAR_TIMES (em segundos):
 *   até THREE → 3 estrelas | até TWO → 2 | até ONE → 1 | mais que isso → 0
 * -----------------------------------------------------------------------------
 */
class StarRating {
  constructor() {
    throw new TypeError('StarRating é estático e não deve ser instanciado.');
  }

  /**
   * Estrelas (0 a 3) ganhas terminando a fase neste tempo.
   * @param {object} level entrada de LEVELS
   * @param {number} elapsedMs
   */
  static count(level, elapsedMs) {
    const seconds = elapsedMs / 1000;
    const { THREE, TWO, ONE } = level.STAR_TIMES;
    if (seconds <= THREE) return 3;
    if (seconds <= TWO) return 2;
    if (seconds <= ONE) return 1;
    return 0;
  }

  /** As metas da fase em texto (ex.: "3 estrelas até 2:00, 2 até 3:00, 1 até 5:00"). */
  static goalsText(level) {
    const { THREE, TWO, ONE } = level.STAR_TIMES;
    const time = seconds => LevelTimer.format(seconds * 1000);
    return `3 estrelas até ${time(THREE)}, 2 até ${time(TWO)}, 1 até ${time(ONE)}`;
  }
}
