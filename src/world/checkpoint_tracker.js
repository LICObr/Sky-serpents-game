/**
 * checkpoint_tracker.js
 * -----------------------------------------------------------------------------
 * Guarda o último ponto de renascimento alcançado. Ao cair num buraco, o
 * jogador volta para o checkpoint mais avançado por onde já passou.
 * -----------------------------------------------------------------------------
 */
class CheckpointTracker {
  #checkpoints;
  #current;

  /** @param {number[]} checkpoints posições x (em ordem) */
  constructor(checkpoints) {
    this.#checkpoints = [...checkpoints].sort((a, b) => a - b);
    this.#current = this.#checkpoints[0];
  }

  /** Posição x onde o jogador deve renascer. */
  get respawnX() {
    return this.#current;
  }

  /** Avança o checkpoint conforme o jogador anda (chamar a cada frame). */
  update(playerX) {
    for (const checkpoint of this.#checkpoints) {
      if (playerX >= checkpoint && checkpoint > this.#current) this.#current = checkpoint;
    }
  }

  /** Força um checkpoint (ex.: entrada da arena). */
  set(x) {
    this.#current = x;
  }
}
