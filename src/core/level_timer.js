/**
 * level_timer.js
 * -----------------------------------------------------------------------------
 * CRONÔMETRO da fase: soma o tempo de cada frame enquanto a fase roda. Com
 * a fase pausada a cena não atualiza, então a pausa não conta. Para no fim
 * da partida (o tempo vale estrelas — veja StarRating).
 * -----------------------------------------------------------------------------
 */
class LevelTimer {
  #elapsedMs = 0;
  #running = true;

  /** Tempo jogado até agora (ms). */
  get elapsedMs() {
    return this.#elapsedMs;
  }

  /** Soma o tempo do frame (chamar a cada frame). */
  tick(deltaMs) {
    if (this.#running) this.#elapsedMs += deltaMs;
  }

  /** Para de contar (fim da partida). */
  stop() {
    this.#running = false;
  }

  /** Tempo no formato "1:23". */
  static format(ms) {
    const seconds = Math.floor(ms / 1000);
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  }
}
