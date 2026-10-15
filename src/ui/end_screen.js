/**
 * end_screen.js
 * -----------------------------------------------------------------------------
 * Tela de fim de partida (substitui os alert() do protótipo): escurece o
 * jogo, mostra um título e as opções, cada uma ligada a uma tecla.
 * As opções também podem ser clicadas com o mouse.
 * -----------------------------------------------------------------------------
 */
class EndScreen {
  /**
   * @param {Phaser.Scene} scene
   * @param {{title: string, subtitle?: string, color: string,
   *          options: {label: string, key: string, action: Function}[]}} config
   */
  constructor(scene, { title, subtitle = '', color, options }) {
    const { WIDTH, HEIGHT } = GameSettings.SCREEN;
    const depth = GameSettings.HUD.DEPTH + 1;

    scene.add.rectangle(0, 0, WIDTH, HEIGHT, 0x000000, 0.65)
      .setOrigin(0).setScrollFactor(0).setDepth(depth);

    UiStyle.addFixedText(scene, WIDTH / 2, HEIGHT / 2 - 80, title, 28, color).setDepth(depth);
    if (subtitle) UiStyle.addFixedText(scene, WIDTH / 2, HEIGHT / 2 - 36, subtitle, 11).setDepth(depth);

    let chosen = false;
    const choose = action => {
      if (chosen) return; // evita disparar duas vezes
      chosen = true;
      action();
    };

    options.forEach(({ label, key, action }, index) => {
      const text = UiStyle.addFixedText(scene, WIDTH / 2, HEIGHT / 2 + 20 + index * 36, label, 14)
        .setDepth(depth)
        .setInteractive({ useHandCursor: true });
      text.on('pointerover', () => text.setColor('#ffe066'));
      text.on('pointerout', () => text.setColor('#ffffff'));
      text.on('pointerdown', () => choose(action));
      scene.input.keyboard.once(`keydown-${key}`, () => choose(action));
    });
  }
}
