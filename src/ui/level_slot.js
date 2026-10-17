/**
 * level_slot.js
 * -----------------------------------------------------------------------------
 * Caixinha de uma fase na tela de escolha: transparente, com o número.
 *   - fase disponível  → clicável, acende ao ser escolhida, com as
 *                        estrelas ganhas embaixo do número
 *   - fase concluída   → um check verde pequeno no canto de cima
 *   - em desenvolvimento → apagada, com um x vermelho pequeno no canto
 * -----------------------------------------------------------------------------
 */
class LevelSlot {
  #box;
  #number;
  #available;
  #selected = false;

  /**
   * @param {Phaser.Scene} scene
   * @param {number} x centro
   * @param {number} y centro
   * @param {number} levelNumber número mostrado (1, 2, 3...)
   * @param {boolean} available a fase já existe?
   * @param {{onHover: Function, onClick: Function}} handlers
   */
  constructor(scene, x, y, levelNumber, available, { onHover, onClick }) {
    const { BOX, NUMBER_Y, STARS_Y, STAR_RADIUS } = GameSettings.LEVEL_SELECT;
    this.#available = available;

    this.#box = scene.add.rectangle(x, y, BOX.WIDTH, BOX.HEIGHT, 0xffffff, 0.08)
      .setInteractive({ useHandCursor: available })
      .on('pointerover', onHover)
      .on('pointerdown', onClick);

    this.#number = scene.add.text(x, y + (available ? NUMBER_Y : 0), String(levelNumber), UiStyle.text(18)).setOrigin(0.5);

    // marquinha pequena no canto de cima à direita
    const cornerX = x + BOX.WIDTH / 2 - 11;
    const cornerY = y - BOX.HEIGHT / 2 + 11;
    if (available) {
      const result = LevelProgress.of(levelNumber);
      new StarRow(scene, x, y + STARS_Y, result.stars, { radius: STAR_RADIUS });
      if (result.done) LevelSlot.#drawCheck(scene, cornerX, cornerY);
    } else {
      LevelSlot.#drawCross(scene, cornerX, cornerY);
    }
    this.render();
  }

  /** Check verde: fase já concluída. */
  static #drawCheck(scene, cx, cy) {
    scene.add.graphics()
      .lineStyle(3, 0x3ddc5a, 1)
      .beginPath().moveTo(cx - 5, cy).lineTo(cx - 1, cy + 4).lineTo(cx + 6, cy - 5).strokePath();
  }

  /** x vermelho: fase em desenvolvimento. */
  static #drawCross(scene, cx, cy) {
    scene.add.graphics()
      .lineStyle(3, 0xff3b3b, 1)
      .lineBetween(cx - 5, cy - 5, cx + 5, cy + 5)
      .lineBetween(cx + 5, cy - 5, cx - 5, cy + 5);
  }

  get available() { return this.#available; }

  setSelected(selected) {
    this.#selected = selected;
    this.render();
  }

  render() {
    const selected = this.#selected;
    const color = selected ? (this.#available ? 0xffe066 : 0xff7a6a) : 0xffffff;
    this.#box
      .setFillStyle(0xffffff, selected ? 0.18 : 0.08)
      .setStrokeStyle(selected ? 3 : 2, color, this.#available ? 0.9 : 0.4);
    this.#number
      .setColor(selected && this.#available ? '#ffe066' : '#ffffff')
      .setAlpha(this.#available ? 1 : 0.35);
  }
}
