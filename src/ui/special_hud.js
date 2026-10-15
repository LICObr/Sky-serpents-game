/**
 * special_hud.js
 * -----------------------------------------------------------------------------
 * Indicador do ESPECIAL (tecla G) logo abaixo dos corações:
 *   - pronto: caixinha acesa "G" e o texto PRONTO (piscando de leve);
 *   - recarregando: barra enchendo e o tempo que falta (ex.: 1:12).
 * -----------------------------------------------------------------------------
 */
class SpecialHUD {
  #player;
  #box;
  #fill;
  #key;
  #label;
  #fillWidth;

  /**
   * @param {Phaser.Scene} scene
   * @param {Player} player
   */
  constructor(scene, player) {
    const hearts = GameSettings.HUD.HEARTS;
    const depth = GameSettings.HUD.DEPTH;
    // Logo abaixo dos corações
    const x = hearts.X - 15;
    const y = hearts.Y + 38;

    this.#player = player;
    this.#fillWidth = 26;
    this.#box = scene.add.rectangle(x, y, 30, 30, 0x000000, 0.35)
      .setOrigin(0, 0.5).setStrokeStyle(2, 0xffffff, 0.6).setScrollFactor(0).setDepth(depth);
    // Preenchimento DENTRO da caixinha: cresce de baixo para cima via scaleY
    // (mudar a altura do retângulo não atualiza a origem e ele "vazava" para baixo)
    this.#fill = scene.add.rectangle(x + 2, y + 13, this.#fillWidth, 26, 0x6fb8ff, 0.7)
      .setOrigin(0, 1).setScrollFactor(0).setDepth(depth);
    this.#key = scene.add.text(x + 15, y + 1, 'G', UiStyle.text(12)).setOrigin(0.5).setScrollFactor(0).setDepth(depth);
    this.#label = scene.add.text(x + 38, y, '', UiStyle.text(8)).setOrigin(0, 0.5).setScrollFactor(0).setDepth(depth);
  }

  /** Atualiza o indicador (chamar a cada frame). */
  update() {
    const special = this.#player.special;
    const remaining = special.remainingMs;
    const total = GameSettings.SPECIAL.COOLDOWN_MS;

    if (remaining === 0) {
      const pulse = 0.75 + Math.sin(this.#player.scene.time.now * 0.006) * 0.25;
      this.#box.setStrokeStyle(2, 0xffe066, pulse);
      this.#fill.setFillStyle(0xffe066, 0.55 * pulse).setScale(1, 1);
      this.#key.setColor('#ffe066');
      this.#label.setText('PRONTO').setColor('#ffe066');
      return;
    }

    // Recarregando: a caixinha vai enchendo de baixo para cima
    const progress = 1 - remaining / total;
    this.#box.setStrokeStyle(2, 0xffffff, 0.5);
    this.#fill.setFillStyle(0x6fb8ff, 0.7).setScale(1, progress);
    this.#key.setColor('#c8c0e0');
    const seconds = Math.ceil(remaining / 1000);
    this.#label.setText(`${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`).setColor('#ffffff');
  }
}
