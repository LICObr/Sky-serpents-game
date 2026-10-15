/**
 * snake_enemy.js
 * -----------------------------------------------------------------------------
 * Cobrinha (mini-serpente): anda no chão como o slime (herda de WalkerEnemy)
 * e arrasta um corpo em segmentos que segue o rastro da cabeça, ondulando —
 * igual à Serpente Glacial, só que pequenininha.
 *
 * Só a cabeça tem hitbox; o corpo é visual.
 * -----------------------------------------------------------------------------
 */
class SnakeEnemy extends WalkerEnemy {
  #segments = [];
  #path = [];      // posições recentes da cabeça (mais nova primeiro)

  /** @param {...any} args mesmos parâmetros de WalkerEnemy */
  constructor(...args) {
    super(...args);
    const type = this.type;
    const sprite = this.sprite;

    // A cabeça da serpente é larga: hitbox menor e na parte de baixo
    sprite.body.setSize(sprite.frame.realWidth * 0.7, sprite.frame.realHeight * 0.6);

    for (let i = 1; i <= type.SEGMENTS; i++) {
      const isTail = i === type.SEGMENTS;
      const segment = this.scene.add
        .image(sprite.x, sprite.y, isTail ? 'serpent_tail' : 'serpent_body')
        .setScale(type.SCALE * 1.1)
        .setDepth(GameSettings.ENEMY.DEPTH - i * 0.01);
      if (type.TINT) segment.setTint(type.TINT);
      this.#segments.push(segment);
    }
  }

  /** @override Rasteja e arrasta o corpo. */
  behave(time, player) {
    super.behave(time, player);
    const sprite = this.sprite;
    sprite.setFlipX(sprite.body.velocity.x < 0); // a arte da cabeça olha para a direita
    this.#updateBody(time);
  }

  /** @override Leva o corpo junto ao sumir. */
  destroy() {
    this.#segments.forEach(segment => segment.destroy());
    this.#segments = [];
    super.destroy();
  }

  /** Cada segmento fica num ponto mais antigo do rastro, ondulando. */
  #updateBody(time) {
    const { SEGMENT_SPACING, WIGGLE } = this.type;
    const head = { x: this.x, y: this.y + this.sprite.displayHeight * 0.15 };

    const newest = this.#path[0];
    if (!newest || Phaser.Math.Distance.Between(head.x, head.y, newest.x, newest.y) >= 2) {
      this.#path.unshift(head);
      this.#path.length = Math.min(this.#path.length, (this.#segments.length + 1) * SEGMENT_SPACING);
    }

    let previous = head;
    this.#segments.forEach((segment, index) => {
      const point = this.#path[Math.min((index + 1) * SEGMENT_SPACING / 2 | 0, this.#path.length - 1)] || previous;
      const wiggle = Math.sin(time * 0.012 + index * 0.9) * WIGGLE;
      segment.setPosition(point.x, point.y + wiggle);
      const angle = Phaser.Math.Angle.Between(segment.x, segment.y, previous.x, previous.y);
      segment.setRotation(angle).setFlipY(Math.cos(angle) < 0);
      segment.setAlpha(this.sprite.alpha);
      previous = { x: segment.x, y: segment.y };
    });
  }
}
