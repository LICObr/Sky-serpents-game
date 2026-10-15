/**
 * boss_hp_bar.js
 * -----------------------------------------------------------------------------
 * Barra de vida do chefão no topo da tela, com o nome dele embaixo.
 * Fica escondida durante o percurso e aparece quando a luta começa.
 * Só é redesenhada quando a vida muda (não a cada frame).
 * -----------------------------------------------------------------------------
 */
class BossHPBar {
  #graphics;
  #label;
  #maxHp = 1;

  /**
   * @param {Phaser.Scene} scene
   * @param {Phaser.Events.EventEmitter} eventBus
   */
  constructor(scene, eventBus) {
    const cfg = GameSettings.HUD.BOSS_BAR;

    this.#graphics = scene.add.graphics().setScrollFactor(0).setDepth(GameSettings.HUD.DEPTH).setVisible(false);
    this.#label = UiStyle.addFixedText(scene, cfg.X + cfg.WIDTH / 2, cfg.LABEL_Y, '', 10).setVisible(false);

    eventBus.on(GameEvents.BOSS_FIGHT_STARTED, boss => this.#show(boss));
    eventBus.on(GameEvents.BOSS_HP_CHANGED, currentHp => this.#render(currentHp));
  }

  #show(boss) {
    this.#maxHp = boss.health.max;
    this.#label.setText(boss.name).setVisible(true);
    this.#graphics.setVisible(true);
    this.#render(boss.health.current);
  }

  #render(currentHp) {
    const cfg = GameSettings.HUD.BOSS_BAR;
    const width = Math.max(currentHp / this.#maxHp, 0) * cfg.WIDTH;

    this.#graphics.clear();
    this.#graphics.fillStyle(cfg.BACK_COLOR, cfg.BACK_ALPHA);
    this.#graphics.fillRect(cfg.X, cfg.Y, cfg.WIDTH, cfg.HEIGHT);
    this.#graphics.fillStyle(cfg.COLOR, 1);
    this.#graphics.fillRect(cfg.X, cfg.Y, width, cfg.HEIGHT);
  }
}
