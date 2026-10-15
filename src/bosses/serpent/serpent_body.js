/**
 * serpent_body.js
 * -----------------------------------------------------------------------------
 * O corpo comprido da serpente: vários segmentos + cauda que seguem o
 * RASTRO deixado pela cabeça (como no jogo da cobrinha).
 *
 * Funcionamento: a cada poucos pixels que a cabeça anda, a posição dela é
 * guardada numa lista (o "rastro"). Cada segmento fica num ponto mais
 * antigo desse rastro, e gira para "olhar" para a parte da frente.
 * -----------------------------------------------------------------------------
 */
class SerpentBody {
  #serpent;
  #parts = [];   // segmentos (do pescoço até a cauda; o último é a cauda)
  #path = [];    // posições recentes da cabeça (mais nova primeiro)
  #pointsPerSegment;

  /**
   * @param {SerpentBoss} serpent dono do corpo
   * @param {object} stats estatísticas do chefão
   */
  constructor(serpent, stats) {
    const { PATH_POINT_SPACING } = GameSettings.SERPENT;
    this.#serpent = serpent;
    this.#pointsPerSegment = Math.max(1, Math.round(stats.SEGMENT_SPACING / PATH_POINT_SPACING));

    for (let i = 1; i <= stats.SEGMENTS; i++) {
      const isTail = i === stats.SEGMENTS;
      const sprite = serpent.scene.physics.add
        .sprite(serpent.x, serpent.y, isTail ? 'serpent_tail' : 'serpent_body')
        .setScale(stats.SCALE)
        .setDepth(GameSettings.BOSS.DEPTH - i * 0.01); // partes da frente por cima
      SerpentBody.configurePart(sprite, serpent, 0.7);
      this.#parts.push(sprite);
    }

    // Rastro inicial: corpo esticado para a direita da cabeça
    const totalPoints = this.#pointsPerSegment * (stats.SEGMENTS + 1);
    for (let i = 0; i < totalPoints; i++) {
      this.#path.push({ x: serpent.x + i * PATH_POINT_SPACING, y: serpent.y });
    }
    this.update();
  }

  /** Segmentos + cauda (para colisões). */
  get parts() {
    return this.#parts.filter(part => part.active);
  }

  /**
   * Configura um sprite como parte "cinemática" da serpente: sem gravidade,
   * movida manualmente, mas com hitbox para flechas e contato.
   * @param {Phaser.Physics.Arcade.Sprite} sprite
   * @param {SerpentBoss} owner
   * @param {number} hitboxRatio tamanho da hitbox em relação à imagem
   */
  static configurePart(sprite, owner, hitboxRatio) {
    sprite.body.setAllowGravity(false);
    sprite.body.moves = false;
    sprite.body.setSize(sprite.frame.realWidth * hitboxRatio, sprite.frame.realHeight * hitboxRatio, true);
    sprite.setData('owner', owner);
  }

  /** Registra a nova posição da cabeça e reposiciona o corpo. */
  update() {
    const { PATH_POINT_SPACING } = GameSettings.SERPENT;
    const head = { x: this.#serpent.x, y: this.#serpent.y };

    const newest = this.#path[0];
    if (Phaser.Math.Distance.Between(head.x, head.y, newest.x, newest.y) >= PATH_POINT_SPACING) {
      this.#path.unshift(head);
      this.#path.length = this.#pointsPerSegment * (this.#parts.length + 1);
    }

    let previous = head;
    this.#parts.forEach((part, index) => {
      const point = this.#path[Math.min((index + 1) * this.#pointsPerSegment, this.#path.length - 1)] || previous;
      part.setPosition(point.x, point.y);
      const angle = Phaser.Math.Angle.Between(point.x, point.y, previous.x, previous.y);
      part.setRotation(angle);
      part.setFlipY(Math.cos(angle) < 0); // barriga sempre para baixo
      previous = point;
    });
  }

  /** Aplica uma cor em todo o corpo (ex.: piscar ao apanhar). */
  flash(color, durationMs) {
    this.parts.forEach(part => part.setTintFill(color));
    this.#serpent.scene.time.delayedCall(durationMs, () => {
      this.parts.forEach(part => part.clearTint());
    });
  }

  destroy() {
    this.#parts.forEach(part => part.destroy());
    this.#parts = [];
  }
}
