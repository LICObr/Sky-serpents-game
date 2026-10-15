/**
 * game_flow.js
 * -----------------------------------------------------------------------------
 * Controla o FIM da partida: derrota (jogador sem corações) ou vitória
 * (chefão derrotado). Garante que o fim só aconteça uma vez, congela o jogo
 * e mostra a tela final com as opções:
 *   derrota → [R] tentar de novo | [F] escolher fase | [ENTER] menu
 *   vitória → [ENTER] próxima fase | [F] escolher fase | [M] menu
 * -----------------------------------------------------------------------------
 */
class GameFlow {
  #scene;
  #match;
  #hasEnded = false;

  /**
   * @param {Phaser.Scene} scene
   * @param {MatchConfig} match
   * @param {Phaser.Events.EventEmitter} eventBus
   */
  constructor(scene, match, eventBus) {
    this.#scene = scene;
    this.#match = match;
    eventBus.on(GameEvents.PLAYER_DIED, () => this.gameOver());
    eventBus.on(GameEvents.BOSS_DEFEATED, () => this.victory(`${this.#match.boss.NAME} foi derrotado`));
  }

  /** true depois que a partida terminou. */
  get hasEnded() {
    return this.#hasEnded;
  }

  /** Derrota. */
  gameOver() {
    if (!this.#end()) return;
    new EndScreen(this.#scene, {
      title: 'GAME OVER',
      color: '#ff5555',
      options: [
        { label: '[R] Tentar de novo', key: 'R', action: () => this.#restart(this.#match) },
        { label: '[F] Escolher fase', key: 'F', action: () => this.#toLevelSelect() },
        { label: '[ENTER] Menu', key: 'ENTER', action: () => this.#toMenu() }
      ]
    });
  }

  /**
   * Fase concluída (chefão derrotado ou bandeira de chegada alcançada).
   * @param {string} subtitle mensagem embaixo do título
   */
  victory(subtitle) {
    if (!this.#end()) return;

    const options = this.#match.hasNextLevel
      ? [
          { label: '[ENTER] Próxima fase', key: 'ENTER', action: () => this.#restart(this.#match.nextLevel()) },
          { label: '[F] Escolher fase', key: 'F', action: () => this.#toLevelSelect() },
          { label: '[M] Menu', key: 'M', action: () => this.#toMenu() }
        ]
      : [
          { label: '[F] Escolher fase', key: 'F', action: () => this.#toLevelSelect() },
          { label: '[ENTER] Menu', key: 'ENTER', action: () => this.#toMenu() }
        ];

    new EndScreen(this.#scene, {
      title: this.#match.hasNextLevel ? 'FASE CONCLUIDA!' : 'VOCE ZEROU O JOGO!',
      subtitle,
      color: '#ffe066',
      options
    });
  }

  /**
   * Marca a partida como encerrada e pausa a física.
   * @returns {boolean} false se ela já havia terminado antes
   */
  #end() {
    if (this.#hasEnded) return false;
    this.#hasEnded = true;
    this.#scene.physics.pause();
    return true;
  }

  #restart(match) {
    this.#scene.scene.restart(match.toSceneData());
  }

  #toMenu() {
    this.#scene.scene.start(SceneKeys.MENU);
  }

  /** Volta para a tela de fases mantendo personagem e dificuldade. */
  #toLevelSelect() {
    const { characterId, difficultyId } = this.#match.toSceneData();
    this.#scene.scene.start(SceneKeys.LEVEL_SELECT, { characterId, difficultyId });
  }
}
