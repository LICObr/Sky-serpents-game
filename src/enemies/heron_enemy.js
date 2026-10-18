/**
 * heron_enemy.js
 * -----------------------------------------------------------------------------
 * Garça pescadora (pântano): fica parada na margem, numa perna só, sempre
 * olhando para o jogador. Quando ele chega perto, dá uma BICADA: avança
 * rápido de pescoço esticado e volta para o lugar dela.
 * A área que machuca é só o corpo dela (o desenho tem espaço na frente do
 * bico): ao virar de lado, a área vira junto.
 * -----------------------------------------------------------------------------
 */
class HeronEnemy extends Enemy {
  #homeX = null;     // onde ela fica (onde pousou)
  #peckUntil = 0;
  #nextPeckAt = 0;
  #facing = 0;       // -1 = olhando para a esquerda (como a arte), 1 = direita

  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {object} type
   * @param {MatchConfig} match
   * @param {Phaser.Events.EventEmitter} eventBus
   */
  constructor(scene, x, y, type, match, eventBus) {
    super(scene, x, y, type, match, eventBus);
    this.#face(-1);
  }

  /** @override Parada, vira para o jogador e bica quando ele chega perto. */
  behave(time, player) {
    const cfg = this.type.PECK;
    const sprite = this.sprite;
    if (this.#homeX === null && sprite.body.blocked.down) this.#homeX = this.x;
    if (time < this.#peckUntil) {
      sprite.setVelocityX(this.#facing * cfg.SPEED);
      return;
    }
    sprite.setAngle(0);
    sprite.setVelocityX(this.#homeX === null ? 0 : (this.#homeX - this.x) * 5); // volta para o lugar
    const dx = player.x - this.x;
    if (Math.abs(dx) > 6) this.#face(Math.sign(dx));

    const inReach = Math.abs(dx) < cfg.RANGE_X && Math.abs(player.y - this.y) < cfg.RANGE_Y;
    if (inReach && time >= this.#nextPeckAt) {
      this.#peckUntil = time + cfg.MS;
      this.#nextPeckAt = time + cfg.MS + cfg.COOLDOWN_MS;
      sprite.setAngle(cfg.TILT_DEG * this.#facing); // cabeça para a frente e para baixo
    }
  }

  /** Vira para um lado (a área que machuca acompanha o corpo). */
  #face(direction) {
    if (direction === this.#facing) return;
    this.#facing = direction;
    const box = this.type.BODY;
    const width = this.sprite.frame.width;
    this.sprite.setFlipX(direction > 0);
    this.sprite.body.setSize(box.WIDTH, box.HEIGHT, false);
    this.sprite.body.setOffset(direction > 0 ? width - box.WIDTH - box.OFFSET_X : box.OFFSET_X, box.OFFSET_Y);
  }
}
