/**
 * boss_arena.js
 * -----------------------------------------------------------------------------
 * A tela final de cada fase. Quando o jogador entra, a arena "fecha":
 * a câmera para de seguir e o jogador não consegue mais sair até derrotar
 * o chefão.
 * -----------------------------------------------------------------------------
 */
class BossArena {
  #scene;
  #left;
  #started = false;

  /**
   * @param {Phaser.Scene} scene
   * @param {number} left início da arena no mundo (x)
   */
  constructor(scene, left) {
    this.#scene = scene;
    this.#left = left;
  }

  get left()      { return this.#left; }
  get right()     { return this.#left + GameSettings.LEVEL.ARENA_WIDTH; }
  get isStarted() { return this.#started; }

  /** Ponto de renascimento dentro da arena. */
  get respawnX() {
    return this.#left + 100;
  }

  /** Converte uma posição relativa à arena em posição do mundo. */
  toWorldX(relativeX) {
    return this.#left + relativeX;
  }

  /**
   * Todos os jogadores em jogo entraram o bastante para a luta começar?
   * (com 2 jogadores a arena só fecha com os dois dentro)
   * @param {Player[]} players
   */
  shouldStart(players) {
    const trigger = this.#left + GameSettings.LEVEL.ARENA_TRIGGER_OFFSET;
    return !this.#started && players.length > 0 && players.every(player => player.x > trigger);
  }

  /** Fecha a arena (câmera e limites do mundo). */
  lock() {
    const { ARENA_WIDTH } = GameSettings.LEVEL;
    const { HEIGHT } = GameSettings.SCREEN;

    this.#started = true;
    this.#scene.cameras.main.setBounds(this.#left, 0, ARENA_WIDTH, HEIGHT);
    // Colide só nas laterais: em cima e embaixo ficam abertos
    this.#scene.physics.world.setBounds(this.#left, 0, ARENA_WIDTH, HEIGHT, true, true, false, false);
  }
}
