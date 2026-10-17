/**
 * queen_bee_boss.js
 * -----------------------------------------------------------------------------
 * Chefão ABELHA RAINHA (fase 5, 2ª etapa): sai da colmeia quando ela esvazia.
 * Herda de Boss e é composto por:
 *   - DragonMovement → voa pela arena igual ao dragão (vaga, foge ao apanhar)
 *   - BossAttack     → espirros de mel (grudam: deixam o jogador lento)
 *   - CeilingDrops   → gotas de mel caindo do teto (como o gelo do urso)
 *
 * Animação: asas batendo (voando) e um quadro inclinado ao atacar.
 * -----------------------------------------------------------------------------
 */
class QueenBeeBoss extends Boss {
  #movement;
  #attack;
  #drops;
  #honey;            // mel espirrando
  #poseUntil = 0;    // até quando fica na pose de ataque

  /**
   * @param {Phaser.Scene} scene
   * @param {object} stats estatísticas ajustadas (MatchConfig)
   * @param {BossArena} arena
   * @param {PlayerParty} players
   * @param {Phaser.Events.EventEmitter} eventBus
   * @param {FireballPool} projectiles
   * @param {Function} AttackClass subclasse de BossAttack
   */
  constructor(scene, stats, arena, players, eventBus, projectiles, AttackClass) {
    const cfg = GameSettings.QUEEN_BEE;
    const sprite = scene.physics.add
      .sprite(arena.toWorldX(cfg.START_X), cfg.START_Y, QueenBeeSpriteSheet.key, 0)
      .setDepth(GameSettings.BOSS.DEPTH + 0.5);
    const scale = cfg.DISPLAY_HEIGHT / sprite.height;

    super(scene, sprite, stats, arena, players, eventBus);

    sprite.setCollideWorldBounds(true);
    sprite.body.setAllowGravity(false);
    sprite.body.setSize(sprite.width * cfg.BODY_RATIO.WIDTH, sprite.height * cfg.BODY_RATIO.HEIGHT, true);
    sprite.play(QueenBeeSpriteSheet.clipKey('voando'));

    this.#honey = scene.add.particles(FxTextureKeys.SPARK).setDepth(GameSettings.BOSS.DEPTH + 0.7)
      .createEmitter({
        on: false,
        speed: { min: 50, max: 220 },
        angle: { min: 200, max: 340 },
        gravityY: 600,
        scale: { start: 0.9, end: 0.1 },
        lifespan: { min: 400, max: 800 },
        tint: [0xffc21a, 0xffdd66, 0xd98a00]
      });
    this.#movement = new DragonMovement(this);
    this.#attack = new AttackClass(this, projectiles);
    this.#drops = new CeilingDrops(scene, arena, players, (x, y, n) => this.#honey.explode(n, x, y),
      { texture: 'gota_mel', cfg: GameSettings.HONEY_DROPS });

    // Sai da colmeia crescendo
    sprite.setScale(scale * 0.2);
    scene.tweens.add({ targets: sprite, scale, duration: 600, ease: 'Back.easeOut' });
  }

  /** @override */
  get meleeReach() {
    return GameSettings.QUEEN_BEE.MELEE_REACH;
  }

  /** Vira para a direita (true) ou esquerda (false). A arte olha para a esquerda. */
  setFacing(right) {
    if (this.#poseUntil === 0) this.sprite.setFlipX(right);
  }

  /** @override Os tiros saem da cabeça (que muda de lado quando ela vira). */
  get mouth() {
    const { MOUTH } = GameSettings.QUEEN_BEE;
    const sprite = this.sprite;
    const side = sprite.flipX ? -1 : 1;
    return {
      x: sprite.x + (MOUTH.X - 0.5) * sprite.displayWidth * side,
      y: sprite.y + (MOUTH.Y - 0.5) * sprite.displayHeight
    };
  }

  /** @override */
  behave() {
    const now = this.scene.time.now;
    this.#attack.updateShot();
    this.#movement.update();
    this.#drops.update();
    this.#drops.autoRain(now, this.target.x);
    this.#updatePose(now);
    this.#attack.updateSpecial();
  }

  /** @override Vira para o jogador e se inclina para o ataque. */
  onAttack() {
    this.sprite.setFlipX(this.target.x > this.x);
    this.sprite.play(QueenBeeSpriteSheet.clipKey('atacando'), true);
    this.#poseUntil = this.scene.time.now + GameSettings.QUEEN_BEE.ATTACK_POSE_MS;
  }

  /** @override Fica transparente, pisca branco, a tela treme e ela foge de quem atacou. */
  onHit(source) {
    const cfg = GameSettings.QUEEN_BEE;
    this.sprite.setAlpha(GameSettings.BOSS.HIT_ALPHA);
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(cfg.HIT_FLASH_MS, () => { if (this.isAlive) this.sprite.clearTint(); });
    this.scene.cameras.main.shake(cfg.HIT_SHAKE.DURATION_MS, cfg.HIT_SHAKE.INTENSITY);
    this.#movement.fleeFrom(source.x, source.y);
  }

  /** @override Gira, cai e some. */
  playDefeat(done) {
    const sprite = this.sprite;
    this.#drops.clear();
    sprite.anims.stop();
    sprite.body.enable = false;
    sprite.setAlpha(1).clearTint();
    this.scene.cameras.main.shake(400, 0.008);
    this.#honey.explode(30, sprite.x, sprite.y);
    this.scene.tweens.add({
      targets: sprite,
      angle: sprite.flipX ? 540 : -540,
      y: GameSettings.LEVEL.GROUND_TOP - 30,
      alpha: 0,
      duration: GameSettings.QUEEN_BEE.DEATH_MS,
      ease: 'Quad.easeIn',
      onComplete: done
    });
  }

  /** @override */
  destroyParts() {
    this.#drops.destroy();
    this.#honey.manager.destroy();
    this.destroy();
  }

  /** Volta a voar depois da pose de ataque e a ficar opaca depois de apanhar. */
  #updatePose(now) {
    if (this.#poseUntil !== 0 && now >= this.#poseUntil) {
      this.#poseUntil = 0;
      this.sprite.play(QueenBeeSpriteSheet.clipKey('voando'));
    }
    if (this.sprite.alpha < 1 && !this.isHitBlinking) this.sprite.setAlpha(1);
  }
}
