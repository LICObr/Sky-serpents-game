/**
 * party_camera.js
 * -----------------------------------------------------------------------------
 * CÂMERA da fase.
 *   - 1 jogador: segue o jogador.
 *   - 2 jogadores: segue o ponto entre os dois e ninguém sai da tela — quem
 *     está na frente não avança se o outro ficou para trás (como nos jogos
 *     de 2 jogadores da Nitrome).
 * -----------------------------------------------------------------------------
 */
class PartyCamera {
  #camera;
  #party;
  #focus = null; // ponto entre os jogadores (só no modo 2 jogadores)

  /**
   * @param {Phaser.Scene} scene
   * @param {PlayerParty} party
   * @param {number} worldWidth largura da fase
   */
  constructor(scene, party, worldWidth) {
    const { LERP, DEADZONE_WIDTH } = GameSettings.CAMERA;
    const { HEIGHT } = GameSettings.SCREEN;
    this.#camera = scene.cameras.main;
    this.#party = party;

    this.#camera.setBounds(0, 0, worldWidth, HEIGHT);
    if (party.isCoop) {
      // segue o meio exato (sem zona morta): a "parede" só aparece quando
      // os dois estão mesmo nas pontas da tela
      this.#focus = scene.add.zone(party.centerX, HEIGHT / 2, 1, 1);
      this.#camera.startFollow(this.#focus, true, LERP, LERP);
    } else {
      this.#camera.startFollow(party.players[0].sprite, true, LERP, LERP);
      this.#camera.setDeadzone(DEADZONE_WIDTH, HEIGHT);
    }
  }

  /** Chamar a cada frame, depois de mover os jogadores. */
  update() {
    if (!this.#focus) return;
    this.#focus.x = this.#party.centerX;
    const players = this.#party.inGame;
    if (players.length > 1) this.#keepOnScreen(players);
  }

  /** Segura na borda da tela quem tentar sair dela. */
  #keepOnScreen(players) {
    const view = this.#camera.worldView;
    const margin = GameSettings.PARTY.SCREEN_MARGIN;
    const left = view.left + margin;
    const right = view.right - margin;

    players.forEach(player => {
      const body = player.sprite.body;
      if (body.left < left) {
        body.x += left - body.left;
        if (body.velocity.x < 0) body.velocity.x = 0;
      } else if (body.right > right) {
        body.x -= body.right - right;
        if (body.velocity.x > 0) body.velocity.x = 0;
      }
    });
  }
}
