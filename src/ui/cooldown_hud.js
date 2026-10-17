/**
 * cooldown_hud.js
 * -----------------------------------------------------------------------------
 * Caixinha de RECARGA do HUD (usada pelo especial e pelo escudinho):
 *   - pronta: caixinha acesa e o texto PRONTO;
 *   - recarregando: a caixinha vai enchendo de baixo para cima e mostra o
 *     tempo que falta (ex.: 0:06).
 * Dentro dela vai uma letra (a tecla do especial) ou um ícone (o escudo).
 * -----------------------------------------------------------------------------
 */
class CooldownHUD {
  #scene;
  #box;
  #fill;
  #content;
  #label;
  #remainingMs;
  #totalMs;
  #pulse;

  /**
   * @param {Phaser.Scene} scene
   * @param {number} x canto esquerdo da caixinha
   * @param {number} y centro da caixinha
   * @param {object} options
   * @param {string} [options.text] letra dentro da caixinha (ex.: 'G')
   * @param {string} [options.icon] ou a textura de um ícone
   * @param {Function} options.remainingMs quanto falta para recarregar (0 = pronto)
   * @param {number} options.totalMs tempo total da recarga
   * @param {boolean} [options.pulse] pisca de leve quando está pronto
   */
  constructor(scene, x, y, { text, icon, remainingMs, totalMs, pulse = false }) {
    const { SIZE } = GameSettings.HUD.COOLDOWN;
    const depth = GameSettings.HUD.DEPTH;
    const fixed = object => object.setScrollFactor(0).setDepth(depth);
    this.#scene = scene;
    this.#remainingMs = remainingMs;
    this.#totalMs = totalMs;
    this.#pulse = pulse;

    this.#box = fixed(scene.add.rectangle(x, y, SIZE, SIZE, 0x000000, 0.35)
      .setOrigin(0, 0.5).setStrokeStyle(2, 0xffffff, 0.6));
    // Preenchimento DENTRO da caixinha: cresce de baixo para cima via scaleY
    // (mudar a altura do retângulo não atualiza a origem e ele "vazava" para baixo)
    this.#fill = fixed(scene.add.rectangle(x + 2, y + SIZE / 2 - 2, SIZE - 4, SIZE - 4, 0x6fb8ff, 0.7).setOrigin(0, 1));
    this.#content = fixed(icon
      ? scene.add.image(x + SIZE / 2, y, icon).setScale(GameSettings.DUCK_SHIELD.SCALE)
      : scene.add.text(x + SIZE / 2, y + 1, text, UiStyle.text(12)).setOrigin(0.5));
    this.#label = fixed(scene.add.text(x + SIZE + 8, y, '', UiStyle.text(8)).setOrigin(0, 0.5));
  }

  /** Atualiza a caixinha (chamar a cada frame). */
  update() {
    const remaining = this.#remainingMs();
    if (remaining === 0) {
      const glow = this.#pulse ? 0.75 + Math.sin(this.#scene.time.now * 0.006) * 0.25 : 1;
      this.#box.setStrokeStyle(2, 0xffe066, glow);
      this.#fill.setFillStyle(0xffe066, 0.55 * glow).setScale(1, 1);
      this.#setContentReady(true);
      this.#label.setText('PRONTO').setColor('#ffe066');
      return;
    }

    // Recarregando: a caixinha vai enchendo de baixo para cima
    const progress = 1 - remaining / this.#totalMs;
    this.#box.setStrokeStyle(2, 0xffffff, 0.5);
    this.#fill.setFillStyle(0x6fb8ff, 0.7).setScale(1, progress);
    this.#setContentReady(false);
    const seconds = Math.ceil(remaining / 1000);
    this.#label.setText(`${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`).setColor('#ffffff');
  }

  /** Letra amarela / ícone aceso quando pronto; apagado recarregando. */
  #setContentReady(ready) {
    if (this.#content.setColor) this.#content.setColor(ready ? '#ffe066' : '#c8c0e0');
    else this.#content.setAlpha(ready ? 1 : 0.45);
  }
}
