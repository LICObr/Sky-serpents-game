/**
 * level_banner.js
 * -----------------------------------------------------------------------------
 * Faixa de título no meio da tela que aparece e some sozinha
 * (ex.: "FASE 1 — Campos de Fogo", "CHEFÃO: Dragão Vermelho").
 * -----------------------------------------------------------------------------
 */
class LevelBanner {
  #scene;
  #title;
  #subtitle;

  /** @param {Phaser.Scene} scene */
  constructor(scene) {
    const { WIDTH, HEIGHT } = GameSettings.SCREEN;
    this.#scene = scene;
    this.#title = UiStyle.addFixedText(scene, WIDTH / 2, HEIGHT / 2 - 40, '', 26, '#ffe066').setAlpha(0);
    this.#subtitle = UiStyle.addFixedText(scene, WIDTH / 2, HEIGHT / 2 + 4, '', 12).setAlpha(0);
  }

  /**
   * @param {string} title
   * @param {string} subtitle
   */
  show(title, subtitle = '') {
    const targets = [this.#title.setText(title), this.#subtitle.setText(subtitle)];
    this.#scene.tweens.killTweensOf(targets);
    targets.forEach(t => t.setAlpha(1));

    this.#scene.tweens.add({
      targets,
      alpha: 0,
      delay: GameSettings.HUD.BANNER_DURATION_MS,
      duration: 500
    });
  }
}
