/**
 * hearts_hud.js
 * -----------------------------------------------------------------------------
 * Ícones de coração no canto da tela. Escuta PLAYER_HEARTS_CHANGED e mostra
 * exatamente tantos corações quanto o jogador tiver.
 * -----------------------------------------------------------------------------
 */
class HeartsHUD {
  #icons = [];

  /**
   * @param {Phaser.Scene} scene
   * @param {number} maxHearts quantidade de ícones a criar
   * @param {Phaser.Events.EventEmitter} eventBus
   */
  constructor(scene, maxHearts, eventBus) {
    const cfg = GameSettings.HUD.HEARTS;

    for (let i = 0; i < maxHearts; i++) {
      const icon = scene.add
        .image(cfg.X + i * cfg.SPACING, cfg.Y, cfg.TEXTURE)
        .setScrollFactor(0)
        .setScale(cfg.SCALE)
        .setDepth(GameSettings.HUD.DEPTH);
      this.#icons.push(icon);
    }

    eventBus.on(GameEvents.PLAYER_HEARTS_CHANGED, hearts => this.#render(hearts));
  }

  /** Mostra os primeiros `hearts` ícones e esconde o resto. */
  #render(hearts) {
    this.#icons.forEach((icon, index) => icon.setVisible(index < hearts));
  }
}
