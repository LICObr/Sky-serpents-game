/**
 * dragon_boss.js
 * -----------------------------------------------------------------------------
 * Chefão dragão (Vermelho e Rosa Místico). Herda de Boss e é composto por:
 *   - DragonMovement  → voo, fuga, limites da arena
 *   - DragonAnimation → clipes da sprite sheet (pairar, subir, descer,
 *                       atacar, poder especial, apanhar, morrer)
 *   - BossAttack      → tiro comum + poder especial (depende do tipo)
 * -----------------------------------------------------------------------------
 */
class DragonBoss extends Boss {
  #movement;
  #animation;
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
    const cfg = GameSettings.DRAGON;
    const sprite = scene.physics.add
      .sprite(arena.toWorldX(cfg.START_X), cfg.START_Y, stats.SPRITE_SHEET, 0)
      .setScale(cfg.SCALE)
      .setDepth(GameSettings.BOSS.DEPTH);

    super(scene, sprite, stats, arena, target, eventBus);

    sprite.setCollideWorldBounds(true);
    sprite.body.setAllowGravity(false);
    sprite.body.setSize(cfg.BODY.WIDTH, cfg.BODY.HEIGHT, true); // centralizada no quadro

    this.#movement = new DragonMovement(this);
    this.#animation = new DragonAnimation(this, stats.SPRITE_SHEET);
    this.#attack = new AttackClass(this, projectiles);
  }

  /** @override */
  get meleeReach() {
    return GameSettings.DRAGON.MELEE_REACH;
  }

  /** Vira o dragão para a direita (true) ou esquerda (false) — exceto atacando. */
  setFacing(right) {
    if (!this.#animation.isAttacking) this.#animation.setFacing(right);
  }

  /**
   * @override As bolas saem da BOCA: o ponto da boca no quadro é espelhado
   * quando ele olha para a esquerda e acompanha a inclinação do corpo.
   */
  get mouth() {
    const { MOUTH } = GameSettings.DRAGON;
    const sprite = this.sprite;
    const facing = this.#animation.facingRight ? 1 : -1;
    const localX = (MOUTH.X - 0.5) * sprite.displayWidth * facing;
    const localY = (MOUTH.Y - 0.5) * sprite.displayHeight;
    const cos = Math.cos(sprite.rotation);
    const sin = Math.sin(sprite.rotation);
    return {
      x: sprite.x + localX * cos - localY * sin,
      y: sprite.y + localX * sin + localY * cos
    };
  }

  /** @override Mesma ordem do protótipo original. */
  behave() {
    this.#attack.updateShot();
    this.#movement.update();
    this.#animation.update(this.scene.time.now);
    this.#restoreAlphaAfterHit();
    this.#attack.updateSpecial();
  }

  /** @override Vira para o jogador e toca o sopro de fogo a cada tiro. */
  onAttack() {
    if (!this.#animation.isAttacking) {
      this.sprite.body.velocity.scale(GameSettings.DRAGON_ANIMATION.ATTACK_HOVER_FACTOR);
    }
    this.#faceTarget();
    this.#animation.playAttack();
  }

  /** @override Poder especial: fica de frente abrindo as asas. */
  onSpecialAttack() {
    this.#animation.playSpecial();
  }

  /** @override Fica transparente, pisca, a tela treme e ele foge de quem atacou. */
  onHit(source) {
    this.sprite.setAlpha(GameSettings.BOSS.HIT_ALPHA);
    this.#animation.playHurt();
    this.#movement.fleeFrom(source.x, source.y);
  }

  /** @override Toca a animação de morte e some (em vez de sumir de uma vez). */
  destroyParts() {
    this.sprite.body.enable = false;
    this.sprite.setAlpha(1);
    this.#animation.playDeath(() => this.destroy());
  }

  /** Olha na direção do jogador. */
  #faceTarget() {
    this.#animation.setFacing(this.target.x > this.x);
  }

  /** Volta a ficar opaco quando o cooldown de golpe termina. */
  #restoreAlphaAfterHit() {
    if (this.sprite.alpha < 1 && this.isHitCooldownReady) this.sprite.setAlpha(1);
  }
}
