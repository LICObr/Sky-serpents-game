/**
 * party_camera.js
 * -----------------------------------------------------------------------------
 * CÂMERA da fase.
 *   - 1 jogador: segue o jogador.
 *   - 2 jogadores: segue o ponto entre os dois e ninguém sai da tela — quem
 *     está na frente não avança se o outro ficou para trás (como nos jogos
 *     de 2 jogadores da Nitrome).
 * Nas fases com montanha mais alta que a tela a câmera também sobe junto
 * (e, com 2 jogadores, ninguém passa do alto da tela).
 * -----------------------------------------------------------------------------
 */
class PartyCamera {
  #camera;
  #party;
  #tall;         // a fase sobe além da tela?
  #focus = null; // ponto entre os jogadores (só no modo 2 jogadores)

  /**
   * @param {Phaser.Scene} scene
   * @param {PlayerParty} party
   * @param {LevelMap} levelMap largura e altura do mundo
   */
  constructor(scene, party, levelMap) {
    const { LERP, DEADZONE_WIDTH, DEADZONE_HEIGHT } = GameSettings.CAMERA;
    const { HEIGHT } = GameSettings.SCREEN;
    this.#camera = scene.cameras.main;
    this.#party = party;
    this.#tall = levelMap.isTall;

    this.#camera.setBounds(0, levelMap.worldTop, levelMap.worldWidth, HEIGHT - levelMap.worldTop);
    if (party.isCoop) {
      // segue o meio exato (sem zona morta): a "parede" só aparece quando
      // os dois estão mesmo nas pontas da tela
      this.#focus = scene.add.zone(party.centerX, this.#focusY(), 1, 1);
      this.#camera.startFollow(this.#focus, true, LERP, LERP);
    } else {
      this.#camera.startFollow(party.players[0].sprite, true, LERP, LERP);
      this.#camera.setDeadzone(DEADZONE_WIDTH, this.#tall ? DEADZONE_HEIGHT : HEIGHT);
    }
  }

  /** Chamar a cada frame, depois de mover os jogadores. */
  update() {
    if (!this.#focus) return;
    this.#focus.setPosition(this.#party.centerX, this.#focusY());
    const players = this.#party.inGame;
    if (players.length > 1) this.#keepOnScreen(players);
  }

  /** Altura que a câmera segue: o meio da tela, ou o meio entre os jogadores numa fase alta. */
  #focusY() {
    if (!this.#tall) return GameSettings.SCREEN.HEIGHT / 2;
    const ys = this.#party.inGame.map(player => player.y);
    return ys.length > 0 ? (Math.min(...ys) + Math.max(...ys)) / 2 : this.#party.players[0].y;
  }

  /** Segura na borda da tela quem tentar sair dela. */
  #keepOnScreen(players) {
    const view = this.#camera.worldView;
    const margin = GameSettings.PARTY.SCREEN_MARGIN;
    const left = view.left + margin;
    const right = view.right - margin;
    const top = view.top + margin;

    players.forEach(player => {
      const body = player.sprite.body;
      if (body.left < left) {
        body.x += left - body.left;
        if (body.velocity.x < 0) body.velocity.x = 0;
      } else if (body.right > right) {
        body.x -= body.right - right;
        if (body.velocity.x > 0) body.velocity.x = 0;
      }
      // fase alta: quem está muito acima do outro não sobe mais até ele chegar
      if (this.#tall && body.top < top) {
        body.y += top - body.top;
        if (body.velocity.y < 0) body.velocity.y = 0;
      }
    });
  }
}
