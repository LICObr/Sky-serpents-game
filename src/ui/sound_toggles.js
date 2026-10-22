/**
 * sound_toggles.js
 * -----------------------------------------------------------------------------
 * Dois botõezinhos no canto de baixo, à direita, em todas as telas:
 *   [nota]     liga/desliga a música de fundo
 *   [alto-falante] liga/desliga todos os sons
 * Desligado, o ícone fica apagado e riscado. A escolha fica guardada
 * (AudioSettings).
 * -----------------------------------------------------------------------------
 */
class SoundToggles {
  #buttons;

  /** @param {Phaser.Scene} scene */
  constructor(scene) {
    const { X, Y, GAP, SIZE } = GameSettings.HUD.SOUND_TOGGLES;
    const depth = GameSettings.HUD.DEPTH + 2;
    AudioSettings.apply(scene);
    this.#buttons = [
      { x: X - GAP, icon: FxTextureKeys.NOTE, scale: 0.62, isOn: () => AudioSettings.musicOn, toggle: () => AudioSettings.toggleMusic(scene) },
      { x: X, icon: FxTextureKeys.SPEAKER, scale: 0.8, isOn: () => AudioSettings.soundOn, toggle: () => AudioSettings.toggleSound(scene) }
    ].map(button => {
      const box = scene.add.rectangle(button.x, Y, SIZE, SIZE, 0x1a1030, 0.6)
        .setStrokeStyle(2, 0x6a5a8a).setScrollFactor(0).setDepth(depth)
        .setInteractive({ useHandCursor: true });
      const icon = scene.add.image(button.x, Y, button.icon).setScale(button.scale).setScrollFactor(0).setDepth(depth);
      const slash = scene.add.graphics().setScrollFactor(0).setDepth(depth)
        .lineStyle(3, 0xff5a4a, 0.95).lineBetween(button.x - SIZE * 0.36, Y + SIZE * 0.36, button.x + SIZE * 0.36, Y - SIZE * 0.36);
      box.on('pointerover', () => box.setStrokeStyle(2, 0xffe066));
      box.on('pointerout', () => box.setStrokeStyle(2, 0x6a5a8a));
      box.on('pointerdown', () => {
        button.toggle();
        this.#render();
      });
      return { ...button, box, icon, slash };
    });
    this.#render();
  }

  /** Ligado: ícone aceso; desligado: apagado e riscado. */
  #render() {
    this.#buttons.forEach(({ isOn, icon, slash }) => {
      const on = isOn();
      icon.setAlpha(on ? 1 : 0.4).setTint(on ? 0xffe066 : 0x9a90b0);
      slash.setVisible(!on);
    });
  }
}
