/**
 * eel_enemy.js
 * -----------------------------------------------------------------------------
 * Poraquê, o peixe-elétrico (pântano): nada devagar no meio da lagoa,
 * ondulando. De tempos em tempos ele CARREGA (pisca amarelo) e solta um
 * CHOQUE: um anel de raios que se espalha pela água — quem estiver NADANDO
 * perto leva o choque (em cima de uma vitória-régia ou na margem, escapa).
 * Encostar nele também dá choque.
 * -----------------------------------------------------------------------------
 */
class EelEnemy extends Enemy {
  #lake;
  #swimY;
  #direction = -1;
  #chargeUntil = 0;  // 0 = não está carregando
  #nextShockAt;

  /**
   * @param {Phaser.Scene} scene
   * @param {number} x precisa estar sobre uma lagoa (WATER)
   * @param {number} y (ignorado: nada no meio da lagoa)
   * @param {object} type
   * @param {MatchConfig} match
   * @param {Phaser.Events.EventEmitter} eventBus
   * @param {LevelMap} levelMap onde fica a lagoa
   */
  constructor(scene, x, y, type, match, eventBus, levelMap) {
    const lake = SwimmerEnemy.lakeAt(levelMap, x);
    const swimY = lake.surfaceY + type.SWIM_DEPTH;
    super(scene, x, swimY, type, match, eventBus);
    this.#lake = lake;
    this.#swimY = swimY;
    this.sprite.body.setAllowGravity(false);
    this.#nextShockAt = scene.time.now + type.SHOCK.EVERY_MS;
  }

  /** @override Carregando fica parado piscando; senão, nada de margem a margem. */
  behave(time, player) {
    const cfg = this.type.SHOCK;
    if (this.#chargeUntil) {
      this.sprite.setVelocity(0, 0);
      if (Math.floor(time / 60) % 2 === 0) this.sprite.setTint(cfg.COLOR);
      else this.restoreTint();
      if (time >= this.#chargeUntil) this.#shock(time, player);
      return;
    }
    const margin = this.sprite.displayWidth / 2;
    if (this.x <= this.#lake.left + margin) this.#direction = 1;
    else if (this.x >= this.#lake.right - margin) this.#direction = -1;
    this.sprite.setVelocity(this.#direction * this.speed, (this.#swimY + Math.sin(time * 0.002) * 6 - this.y) * 4);
    this.sprite.setFlipX(this.#direction > 0); // a arte olha para a esquerda

    if (time >= this.#nextShockAt && this.distanceFrom(player) < cfg.RADIUS * 1.6) this.#chargeUntil = time + cfg.CHARGE_MS;
  }

  /** @override Fora da câmera fica parado. */
  sleep() {
    if (this.isActive) this.sprite.setVelocity(0, 0);
  }

  /** Choque: anel de raios pela água; quem está nadando perto perde um coração. */
  #shock(time, player) {
    const cfg = this.type.SHOCK;
    this.#chargeUntil = 0;
    this.#nextShockAt = time + cfg.EVERY_MS;
    this.restoreTint();

    const scene = this.scene;
    const depth = GameSettings.SWIM.DEPTH + 0.3;
    const ring = scene.add.circle(this.x, this.y, 10).setStrokeStyle(4, cfg.COLOR, 1).setDepth(depth);
    scene.tweens.add({ targets: ring, scale: cfg.RADIUS / 10, alpha: 0, duration: 380, onComplete: () => ring.destroy() });
    const bolts = scene.add.graphics().setDepth(depth).lineStyle(2, 0xffffff, 1);
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2 + Math.random() * 0.5;
      let [bx, by] = [this.x, this.y];
      bolts.beginPath().moveTo(bx, by);
      for (let step = 1; step <= 4; step++) {
        const reach = (cfg.RADIUS * 0.8 * step) / 4;
        bx = this.x + Math.cos(angle) * reach + Phaser.Math.Between(-8, 8);
        by = this.y + Math.sin(angle) * reach + Phaser.Math.Between(-8, 8);
        bolts.lineTo(bx, by);
      }
      bolts.strokePath();
    }
    scene.tweens.add({ targets: bolts, alpha: 0, duration: 260, onComplete: () => bolts.destroy() });

    if (player.status.isSwimming && this.distanceFrom(player) < cfg.RADIUS) player.hitByContact(ProjectileEffect.NONE);
  }
}
