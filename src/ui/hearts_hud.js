/**
 * hearts_hud.js
 * -----------------------------------------------------------------------------
 * Ícones de coração de UM jogador. Escuta PLAYER_HEARTS_CHANGED (só os
 * avisos desse jogador) e mostra exatamente tantos corações quanto ele tiver.
 * No canto direito (jogador 2) os corações crescem para a esquerda.
 * -----------------------------------------------------------------------------
 */
class HeartsHUD {
  #icons = [];

  /**
   * @param {Phaser.Scene} scene
   * @param {Player} player
   * @param {Phaser.Events.EventEmitter} eventBus
   * @param {{x: number, y: number, direction: number}} position primeiro coração;
   *   direction 1 = os outros vêm à direita, -1 = à esquerda
   */
  constructor(scene, player, eventBus, { x, y, direction }) {
    const cfg = GameSettings.HUD.HEARTS;
    for (let i = 0; i < player.health.maxHearts; i++) {
      const icon = scene.add
        .image(x + direction * i * cfg.SPACING, y, cfg.TEXTURE)
        .setScrollFactor(0)
        .setScale(cfg.SCALE)
        .setDepth(GameSettings.HUD.DEPTH);
      this.#icons.push(icon);
    }
    eventBus.on(GameEvents.PLAYER_HEARTS_CHANGED, (hearts, _max, owner) => {
      if (owner === player) this.#render(hearts);
    });
  }

  /** Mostra os primeiros `hearts` ícones e esconde o resto. */
  #render(hearts) {
    this.#icons.forEach((icon, index) => icon.setVisible(index < hearts));
  }
}
