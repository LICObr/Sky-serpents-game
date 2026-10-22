/**
 * lightning_bolt.js
 * -----------------------------------------------------------------------------
 * RAIO desenhado por código: um zigue-zague com dois galhos, um brilho
 * azulado em volta e o risco branco por cima; aparece e apaga rapidinho.
 * Usado pela tempestade (Thunderstorm) e pelo especial do Viking (Trovão).
 * -----------------------------------------------------------------------------
 */
class LightningBolt {
  constructor() {
    throw new TypeError('LightningBolt é estático e não deve ser instanciado.');
  }

  /**
   * Desenha um raio de um ponto a outro e apaga logo.
   * @param {Phaser.Scene} scene
   * @param {number} fromX
   * @param {number} fromY
   * @param {number} toX
   * @param {number} toY
   * @param {number} depth
   * @param {boolean} [onScreen] true = preso na tela (céu); false = no mundo (cai no chão)
   */
  static draw(scene, fromX, fromY, toX, toY, depth, onScreen = false) {
    const bolt = scene.add.graphics().setDepth(depth);
    if (onScreen) bolt.setScrollFactor(0);
    const path = LightningBolt.#zigzag(fromX, fromY, toX, toY, 16);
    const branches = [1, 2].map(() => {
      const start = path[Phaser.Math.Between(2, Math.max(2, path.length - 3))];
      const side = Phaser.Math.Between(0, 1) ? 1 : -1;
      return LightningBolt.#zigzag(start.x, start.y, start.x + side * Phaser.Math.Between(40, 110),
        start.y + Phaser.Math.Between(40, 120), 10);
    });
    const stroke = (points, width, color, alpha) => {
      bolt.lineStyle(width, color, alpha).beginPath().moveTo(points[0].x, points[0].y);
      points.slice(1).forEach(point => bolt.lineTo(point.x, point.y));
      bolt.strokePath();
    };
    [path, ...branches].forEach((points, i) => {
      const main = i === 0;
      stroke(points, main ? 10 : 6, 0x8fb0ff, 0.3);  // brilho em volta
      stroke(points, main ? 3 : 1.5, 0xffffff, 1);    // o raio
    });
    scene.tweens.add({ targets: bolt, alpha: 0, delay: 90, duration: 260, onComplete: () => bolt.destroy() });
  }

  /** Pontos de um raio em zigue-zague de um ponto a outro. */
  static #zigzag(fromX, fromY, toX, toY, jitter) {
    const steps = Math.max(4, Math.round(Math.hypot(toX - fromX, toY - fromY) / 22));
    const points = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const wobble = i === 0 || i === steps ? 0 : Phaser.Math.Between(-jitter, jitter);
      points.push({ x: Phaser.Math.Linear(fromX, toX, t) + wobble, y: Phaser.Math.Linear(fromY, toY, t) });
    }
    return points;
  }
}
