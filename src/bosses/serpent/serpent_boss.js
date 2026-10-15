/**
 * serpent_boss.js
 * -----------------------------------------------------------------------------
 * Chefão Serpente Glacial — um dragão em forma de cobra. Herda de Boss e é
 * composto por:
 *   - SerpentBody     → segmentos que seguem a cabeça
 *   - SerpentMovement → nadar pela arena e dar investidas
 *   - BossAttack      → tiros de gelo (deixam lento) + anel duplo
 *
 * Qualquer parte do corpo pode ser atingida e encostar em qualquer parte
 * machuca o jogador.
 * -----------------------------------------------------------------------------
 */
class SerpentBoss extends Boss {
  #body;
  #movement;
  #attack;

  /**
   * @param {Phaser.Scene} scene
   * @param {object} stats estatísticas ajustadas (MatchConfig.boss)
   * @param {BossArena} arena
   * @param {Player} target
   * @param {Phaser.Events.EventEmitter} eventBus
   * @param {FireballPool} projectiles
   * @param {Function} AttackClass subclasse de BossAttack
   */
  constructor(scene, stats, arena, target, eventBus, projectiles, AttackClass) {
    const cfg = GameSettings.SERPENT;
    const head = scene.physics.add
      .sprite(arena.toWorldX(cfg.START_X), cfg.START_Y, 'serpent_head')
      .setScale(stats.SCALE)
      .setDepth(GameSettings.BOSS.DEPTH + 0.5);

    super(scene, head, stats, arena, target, eventBus);
    SerpentBody.configurePart(head, this, 0.6);

    this.#body = new SerpentBody(this, stats);
    this.#movement = new SerpentMovement(this);
    this.#attack = new AttackClass(this, projectiles);
  }

  /** @override */
  get meleeReach() {
    return GameSettings.SERPENT.MELEE_REACH;
  }

  /** @override Cabeça + corpo + cauda. */
  get hitboxSprites() {
    return this.isAlive ? [this.sprite, ...this.#body.parts] : [];
  }

  /** @override Os projéteis saem um pouco à frente da cabeça. */
  get mouth() {
    const head = this.sprite;
    const distance = head.displayWidth * 0.4;
    return {
      x: head.x + Math.cos(head.rotation) * distance,
      y: head.y + Math.sin(head.rotation) * distance
    };
  }

  /** @override Distância até a parte do corpo mais próxima. */
  distanceFrom(other) {
    return Math.min(...this.hitboxSprites.map(part =>
      Phaser.Math.Distance.Between(part.x, part.y, other.x, other.y)));
  }

  /** @override */
  behave() {
    this.#movement.update(this.scene.game.loop.delta);
    this.#body.update();
    this.#attack.updateShot();
    this.#attack.updateSpecial();
  }

  /** Cabeça vermelha piscando = vai dar a investida. */
  setWarning(on) {
    if (on) this.sprite.setTint(0xff6060);
    else this.sprite.clearTint();
  }

  /** @override Corpo inteiro pisca em branco. */
  onHit() {
    const { DURATION_MS, INTENSITY } = GameSettings.SERPENT.HIT_SHAKE;
    this.scene.cameras.main.shake(DURATION_MS, INTENSITY); // tela treme, como no dragão
    const flashMs = GameSettings.SERPENT.HIT_FLASH_MS;
    this.#body.flash(0xffffff, flashMs);
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(flashMs, () => {
      if (this.isAlive) this.sprite.clearTint();
    });
  }

  /** @override */
  destroyParts() {
    this.#body.destroy();
    this.destroy();
  }
}
