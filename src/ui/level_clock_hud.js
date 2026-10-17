/**
 * level_clock_hud.js
 * -----------------------------------------------------------------------------
 * RELÓGIO da fase no topo da tela, embaixo da bandeirinha de chegada
 * (terminar rápido vale mais estrelas).
 * -----------------------------------------------------------------------------
 */
class LevelClockHUD {
  #text;
  #timer;

  /**
   * @param {Phaser.Scene} scene
   * @param {LevelTimer} timer
   */
  constructor(scene, timer) {
    const cfg = GameSettings.HUD.CLOCK;
    this.#timer = timer;
    this.#text = scene.add.text(cfg.X, cfg.Y, '0:00', UiStyle.text(cfg.SIZE))
      .setOrigin(0.5).setScrollFactor(0).setDepth(GameSettings.HUD.DEPTH);
  }

  /** Mostra o tempo atual (chamar a cada frame). */
  update() {
    this.#text.setText(LevelTimer.format(this.#timer.elapsedMs));
  }
}
