/**
 * star_row.js
 * -----------------------------------------------------------------------------
 * Fileira de 3 ESTRELAS: as ganhas ficam douradas, as que faltam só com o
 * contorno. Usada nas caixinhas das fases e na tela de vitória (lá elas
 * aparecem uma de cada vez).
 * -----------------------------------------------------------------------------
 */
class StarRow {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x centro da fileira
   * @param {number} y
   * @param {number} earned estrelas ganhas (0 a 3)
   * @param {object} [options]
   * @param {number} [options.radius] tamanho de cada estrela
   * @param {boolean} [options.popIn] aparecem uma de cada vez
   * @param {number} [options.depth] se informado, fica presa à tela nesta profundidade
   */
  constructor(scene, x, y, earned, { radius = GameSettings.STARS.RADIUS, popIn = false, depth = null } = {}) {
    const { COLOR, OUTLINE } = GameSettings.STARS;
    const gap = radius * 2.6;

    for (let i = 0; i < 3; i++) {
      const won = i < earned;
      const star = scene.add.star(x + (i - 1) * gap, y, 5, radius * 0.48, radius, won ? COLOR : 0x000000, won ? 1 : 0.3)
        .setStrokeStyle(Math.max(1, radius / 5), won ? OUTLINE : 0xffffff, won ? 1 : 0.5);
      if (depth !== null) star.setScrollFactor(0).setDepth(depth);
      if (popIn) {
        star.setScale(0);
        scene.tweens.add({ targets: star, scale: 1, delay: 300 + i * 250, duration: 260, ease: 'Back.easeOut' });
      }
    }
  }
}
