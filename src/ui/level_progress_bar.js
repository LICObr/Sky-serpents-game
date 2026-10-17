/**
 * level_progress_bar.js
 * -----------------------------------------------------------------------------
 * Barrinha de PROGRESSO da fase, no topo da tela (todas as fases): um
 * pontinho por jogador (amarelo o 1, azul o 2) andando até a bandeirinha de
 * chegada — o começo da arena do chefão, ou a bandeira do fim nas fases
 * sem chefão.
 * Some quando a luta com o chefão começa, para dar lugar à barra de vida dele.
 * -----------------------------------------------------------------------------
 */
class LevelProgressBar {
  #parts;
  #dots;      // { player, dot }
  #finishX;

  /**
   * @param {Phaser.Scene} scene
   * @param {number} finishX onde fica a chegada no mundo (x)
   * @param {Phaser.Events.EventEmitter} eventBus
   * @param {Player[]} players
   */
  constructor(scene, finishX, eventBus, players) {
    const cfg = GameSettings.HUD.PROGRESS;
    const depth = GameSettings.HUD.DEPTH;
    this.#finishX = finishX;

    // trilho meio transparente com a linha do caminho
    const track = scene.add.graphics().setScrollFactor(0).setDepth(depth);
    track.fillStyle(0x000000, cfg.ALPHA)
      .fillRoundedRect(cfg.X - 10, cfg.Y - cfg.HEIGHT / 2, cfg.WIDTH + 20, cfg.HEIGHT, cfg.HEIGHT / 2);
    track.fillStyle(0xffffff, 0.35).fillRect(cfg.X, cfg.Y - 1, cfg.WIDTH, 2);

    const flag = scene.add.image(cfg.X + cfg.WIDTH, cfg.Y + cfg.HEIGHT / 2, GameSettings.GOAL_FLAG.TEXTURE)
      .setOrigin(0.3, 1).setScrollFactor(0).setDepth(depth);
    flag.setScale(cfg.FLAG_HEIGHT / flag.height);

    this.#dots = players.map(player => ({
      player,
      dot: scene.add.circle(cfg.X, cfg.Y, cfg.DOT_RADIUS, GameSettings.PARTY.COLORS[player.slot])
        .setStrokeStyle(2, 0x1a1020).setScrollFactor(0).setDepth(depth + 0.1)
    }));

    this.#parts = [track, flag, ...this.#dots.map(({ dot }) => dot)];
    eventBus.on(GameEvents.BOSS_FIGHT_STARTED, () => this.#parts.forEach(part => part.setVisible(false)));
  }

  /** Coloca cada pontinho na posição do seu jogador (chamar a cada frame). */
  update() {
    const cfg = GameSettings.HUD.PROGRESS;
    this.#dots.forEach(({ player, dot }) => {
      const progress = Phaser.Math.Clamp(player.x / this.#finishX, 0, 1);
      dot.x = cfg.X + progress * cfg.WIDTH;
      dot.setAlpha(player.isKnockedOut ? 0.35 : 1); // fora da partida: apagadinho
    });
  }
}
