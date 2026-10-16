/**
 * coin_hud.js
 * -----------------------------------------------------------------------------
 * Contador de MOEDAS no canto superior direito: ícone da moeda + total
 * guardado. Usado no jogo (atualiza a cada moeda pega) e no menu.
 * -----------------------------------------------------------------------------
 */
class CoinHUD {
  #icon;
  #text;

  /**
   * @param {Phaser.Scene} scene
   * @param {Phaser.Events.EventEmitter} [eventBus] no jogo: escuta as moedas pegas
   */
  constructor(scene, eventBus = null) {
    const cfg = GameSettings.HUD.COINS;
    const depth = GameSettings.HUD.DEPTH;
    this.#text = scene.add.text(cfg.RIGHT_X, cfg.Y, '', UiStyle.text(cfg.TEXT_SIZE, '#ffe066'))
      .setOrigin(1, 0.5).setScrollFactor(0).setDepth(depth);
    this.#icon = scene.add.image(0, cfg.Y, GameSettings.COIN.TEXTURE)
      .setScale(cfg.ICON_SCALE).setScrollFactor(0).setDepth(depth);
    this.#render(CoinWallet.total);

    if (eventBus) eventBus.on(GameEvents.COINS_CHANGED, total => this.#render(total, true));
  }

  /** Mostra o total; o ícone fica sempre logo à esquerda do número. */
  #render(total, bump = false) {
    const cfg = GameSettings.HUD.COINS;
    this.#text.setText(String(total));
    this.#icon.x = this.#text.x - this.#text.width - cfg.GAP - this.#icon.displayWidth / 2;
    if (!bump) return;
    this.#icon.scene.tweens.add({ targets: this.#icon, scale: cfg.ICON_SCALE * 1.35, duration: 90, yoyo: true });
  }
}
