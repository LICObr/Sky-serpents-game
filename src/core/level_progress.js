/**
 * level_progress.js
 * -----------------------------------------------------------------------------
 * PROGRESSO das fases, guardado no navegador: quais já foram concluídas, o
 * melhor tempo e as estrelas de cada uma (fica sempre o melhor resultado).
 * Vale para 1 e 2 jogadores. Se o navegador não deixar guardar, vale só
 * enquanto o jogo estiver aberto.
 * -----------------------------------------------------------------------------
 */
class LevelProgress {
  static #unsaved = {}; // resultados quando o navegador não deixa guardar

  constructor() {
    throw new TypeError('LevelProgress é estático e não deve ser instanciado.');
  }

  /**
   * Resultado guardado de uma fase.
   * @param {number} levelNumber número da fase (1, 2, 3...)
   * @returns {{done: boolean, stars: number, bestMs: number|null}}
   */
  static of(levelNumber) {
    const saved = LevelProgress.#load()[levelNumber];
    return saved
      ? { done: true, stars: saved.stars, bestMs: saved.bestMs }
      : { done: false, stars: 0, bestMs: null };
  }

  /**
   * Guarda uma fase concluída (o melhor tempo e o maior número de estrelas).
   * @param {number} levelNumber
   * @param {number} elapsedMs tempo desta vez
   * @param {number} stars estrelas desta vez
   * @returns {boolean} true se bateu o recorde anterior
   */
  static record(levelNumber, elapsedMs, stars) {
    const results = LevelProgress.#load();
    const previous = results[levelNumber];
    const beatRecord = Boolean(previous) && elapsedMs < previous.bestMs;
    results[levelNumber] = previous
      ? { stars: Math.max(stars, previous.stars), bestMs: Math.min(Math.round(elapsedMs), previous.bestMs) }
      : { stars, bestMs: Math.round(elapsedMs) };
    LevelProgress.#save(results);
    return beatRecord;
  }

  static #load() {
    try {
      const text = localStorage.getItem(GameSettings.STARS.STORAGE_KEY);
      if (text !== null) return JSON.parse(text) || {};
    } catch {
      // sem armazenamento (ou guardado quebrado): usa o que tiver na memória
    }
    return { ...LevelProgress.#unsaved };
  }

  static #save(results) {
    LevelProgress.#unsaved = results;
    try {
      localStorage.setItem(GameSettings.STARS.STORAGE_KEY, JSON.stringify(results));
    } catch {
      // sem armazenamento: o progresso vale só enquanto o jogo estiver aberto
    }
  }
}
