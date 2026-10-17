/**
 * eaglet_boss.js
 * -----------------------------------------------------------------------------
 * Chefão FILHOTE DE ÁGUIA (fase 6). Fica no ninho do cenário da arena
 * (filhote.json diz onde) e:
 *   - balança para cima e para baixo sem parar, estilo Cuphead, afundando no
 *     ninho (a beirada da frente do ninho é desenhada por cima dele);
 *   - vira o olhar a cada 4 s (direita ↔ esquerda) e joga MINHOCAS em arco
 *     para o lado em que está olhando (elas se contorcem no ar e caem);
 *   - de tempos em tempos CHAMA A MAMÃE: olha para cima de bico aberto, a
 *     tela treme, caem gravetos da árvore e chegam ÁGUIAS de todos os tipos
 *     pelo alto, uma de cada vez (até 7 voando);
 *   - bravo (menos da metade da vida): balança mais rápido e joga 3 minhocas.
 * -----------------------------------------------------------------------------
 */
const EagletPose = Object.freeze({
  RIGHT: 'RIGHT',
  LEFT: 'LEFT',
  CALL: 'CALL'
});

class EagletBoss extends Boss {
  #layout;
  #projectiles;
  #front;              // beirada da frente do ninho (por cima do filhote)
  #feathers;           // penas voando ao apanhar
  #splinters;          // lasquinhas dos gravetos que caem
  #twigs;              // gravetos caindo quando ele chama a mamãe
  #bob;                // balanço para cima e para baixo
  #look = EagletPose.LEFT;
  #eagles = [];
  #angry = false;
  #callingUntil = 0;
  #nextLookAt;
  #nextWormAt;
  #nextCallAt;

  /**
   * @param {Phaser.Scene} scene
   * @param {object} stats estatísticas ajustadas (MatchConfig)
   * @param {BossArena} arena
   * @param {PlayerParty} players
   * @param {Phaser.Events.EventEmitter} eventBus
   * @param {FireballPool} projectiles onde nascem as minhocas
   */
  constructor(scene, stats, arena, players, eventBus, projectiles) {
    const cfg = GameSettings.EAGLET;
    const layout = scene.cache.json.get(stats.LAYOUT);
    const sprite = scene.physics.add.image(arena.toWorldX(layout.eaglet.x), layout.eaglet.y, stats.TEXTURES.LEFT)
      .setOrigin(0, 0)
      .setDepth(GameSettings.BOSS.DEPTH);

    super(scene, sprite, stats, arena, players, eventBus);
    this.#layout = layout;
    this.#projectiles = projectiles;

    // Parado no ninho (só o balanço mexe). A hitbox é o corpo, sem as bordas.
    const { HITBOX } = cfg;
    sprite.body.setAllowGravity(false);
    sprite.body.moves = false;
    sprite.body.setSize(sprite.width * (HITBOX.RIGHT - HITBOX.LEFT), sprite.height * (HITBOX.BOTTOM - HITBOX.TOP), false);
    sprite.body.setOffset(sprite.width * HITBOX.LEFT, sprite.height * HITBOX.TOP);

    this.#front = scene.add.image(arena.toWorldX(layout.front.x), layout.front.y, stats.NEST_FRONT)
      .setOrigin(0, 0)
      .setDepth(GameSettings.BOSS.DEPTH + 0.05);

    const particles = tint => scene.add.particles(FxTextureKeys.SPARK).setDepth(GameSettings.BOSS.DEPTH + 0.5)
      .createEmitter({
        on: false,
        speed: { min: 40, max: 170 },
        angle: { min: 200, max: 340 },
        gravityY: 260,
        scale: { start: 0.8, end: 0.2 },
        lifespan: { min: 500, max: 900 },
        tint
      });
    this.#feathers = particles([0xffffff, 0xf3ead8, 0xc9b49a]);
    this.#splinters = particles([0x8a5a2b, 0x6b4423, 0xb07a40]);
    this.#twigs = new CeilingDrops(scene, arena, players, (x, y, n) => this.#splinters.explode(n, x, y),
      { texture: 'graveto', cfg: GameSettings.TWIG_DROPS });

    // Balanço estilo Cuphead: sobe e desce o tempo todo
    sprite.y -= cfg.BOB.HEIGHT / 2;
    this.#bob = scene.tweens.add({
      targets: sprite, y: sprite.y + cfg.BOB.HEIGHT, duration: cfg.BOB.MS,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    const now = scene.time.now;
    this.#nextLookAt = now + cfg.LOOK_MS;
    this.#nextWormAt = now + cfg.WORM.FIRST_MS;
    this.#nextCallAt = now + cfg.CALL.FIRST_MS;

    // aparece junto com o cenário da arena (mesmo fade)
    [sprite, this.#front].forEach(part => {
      part.setAlpha(0);
      scene.tweens.add({ targets: part, alpha: 1, duration: GameSettings.BACKGROUND.PHASE_FADE_MS });
    });
  }

  /** Centro do corpo (ele é desenhado a partir do canto de cima). */
  get x() { return this.sprite.body.center.x; }
  get y() { return this.sprite.body.center.y; }

  /** @override */
  get meleeReach() {
    return GameSettings.EAGLET.MELEE_REACH;
  }

  /** @override A espada mede até a borda do corpo, não até o centro. */
  distanceFrom(other) {
    const body = this.sprite.body;
    const dx = Math.max(body.left - other.x, 0, other.x - body.right);
    const dy = Math.max(body.top - other.y, 0, other.y - body.bottom);
    return Math.hypot(dx, dy);
  }

  /** @override Bico (de onde saem as minhocas) — acompanha a pose e o balanço. */
  get mouth() {
    const [x, y] = this.#layout.mouth[this.#look];
    return { x: this.sprite.x + x, y: this.sprite.y + y };
  }

  /** @override Olhar, minhocas e chamar a mamãe. */
  behave() {
    const cfg = GameSettings.EAGLET;
    const now = this.scene.time.now;
    this.#twigs.update();
    if (!this.#angry && this.health.ratio < cfg.ANGRY_BELOW) this.#becomeAngry();
    if (now < this.#callingUntil) return; // chamando a mamãe: só isso

    if (now >= this.#nextCallAt) this.#callMom(now);
    else if (now >= this.#nextLookAt) this.#turnAround(now);
    else if (now >= this.#nextWormAt) this.#throwWorms(now);
  }

  /** Vira o olhar para o outro lado. */
  #turnAround(now) {
    this.#look = this.#look === EagletPose.LEFT ? EagletPose.RIGHT : EagletPose.LEFT;
    this.sprite.setTexture(this.stats.TEXTURES[this.#look]);
    this.#nextLookAt = now + GameSettings.EAGLET.LOOK_MS;
  }

  /** Minhocas em arco para o lado em que está olhando (bravo: três, em leque). */
  #throwWorms(now) {
    const cfg = GameSettings.EAGLET.WORM;
    const count = this.#angry ? cfg.ANGRY_COUNT : 1;
    const lift = Phaser.Math.DegToRad(Phaser.Math.Between(cfg.ANGLE_DEG.MIN, cfg.ANGLE_DEG.MAX));
    const aim = this.#look === EagletPose.RIGHT ? -lift : Math.PI + lift; // para cima, para o lado do olhar
    const { x, y } = this.mouth;
    for (let i = 0; i < count; i++) {
      const spread = Phaser.Math.DegToRad((i - (count - 1) / 2) * cfg.SPREAD_DEG);
      const speed = Phaser.Math.Between(cfg.SPEED.MIN, cfg.SPEED.MAX);
      this.#projectiles.spawn(x, y, 'minhoca', aim + spread, speed, { effect: ProjectileEffect.NONE });
    }
    this.#nextWormAt = now + Phaser.Math.Between(cfg.EVERY_MS.MIN, cfg.EVERY_MS.MAX);
  }

  /** Olha para cima de bico aberto: a tela treme, caem gravetos e vêm as águias. */
  #callMom(now) {
    const cfg = GameSettings.EAGLET.CALL;
    const scene = this.scene;
    this.#callingUntil = now + cfg.POSE_MS;
    this.#nextCallAt = now + cfg.EVERY_MS;
    this.sprite.setTexture(this.stats.TEXTURES.CALL);
    scene.cameras.main.shake(cfg.SHAKE.MS, cfg.SHAKE.INTENSITY);
    this.#twigs.rain(cfg.TWIGS, this.target.x);

    for (let i = 0; i < cfg.EAGLES; i++) scene.time.delayedCall(i * cfg.EAGLE_EVERY_MS, () => this.#callEagle());
    scene.time.delayedCall(cfg.POSE_MS, () => {
      if (this.canBeHit) this.sprite.setTexture(this.stats.TEXTURES[this.#look]);
    });
  }

  /** Uma águia chega pelo alto da tela (se ainda não houver águias demais). */
  #callEagle() {
    const cfg = GameSettings.EAGLET.CALL;
    if (!this.canBeHit) return;
    this.#eagles = this.#eagles.filter(eagle => eagle.isAlive);
    if (this.#eagles.length >= cfg.MAX_EAGLES) return;
    const spawn = {
      TYPE: EnemyTypeId[Phaser.Utils.Array.GetRandom(this.stats.EAGLE_TYPES)],
      X: Phaser.Math.Between(this.arena.left + 60, this.arena.right - 60),
      Y: Phaser.Math.Between(cfg.EAGLE_Y.MIN, cfg.EAGLE_Y.MAX)
    };
    this.summon(spawn, eagle => this.#eagles.push(eagle));
  }

  /** Bravo: balança mais rápido (e as minhocas vêm de três em três). */
  #becomeAngry() {
    this.#angry = true;
    this.#bob.setTimeScale(GameSettings.EAGLET.ANGRY_BOB_SPEED);
  }

  /** @override Pisca em branco, a tela treme e voam penas de onde apanhou. */
  onHit(source) {
    const { HIT_FLASH_MS, HIT_SHAKE } = GameSettings.EAGLET;
    this.scene.cameras.main.shake(HIT_SHAKE.DURATION_MS, HIT_SHAKE.INTENSITY);
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(HIT_FLASH_MS, () => {
      if (this.canBeHit) this.sprite.clearTint();
    });
    const body = this.sprite.body;
    this.#feathers.explode(6, Phaser.Math.Clamp(source.x, body.left, body.right), Phaser.Math.Clamp(source.y, body.top, body.bottom));
  }

  /** @override Derrotado: penas para todo lado e ele afunda no ninho. */
  playDefeat(done) {
    const cfg = GameSettings.EAGLET;
    this.#bob.stop();
    this.#twigs.clear();
    this.sprite.setTexture(this.stats.TEXTURES.CALL).setTint(0xb8b8b8);
    for (let i = 0; i < 5; i++) {
      this.scene.time.delayedCall(i * 180, () => this.#feathers.explode(12, this.x + Phaser.Math.Between(-30, 30), this.y));
    }
    this.scene.tweens.add({ targets: this.sprite, y: this.sprite.y + 60, alpha: 0, delay: 500, duration: cfg.DEFEAT_MS - 500 });
    this.scene.time.delayedCall(cfg.DEFEAT_MS, done);
  }

  /** @override O ninho fica (é do cenário); só o filhote sai. */
  destroyParts() {
    this.#twigs.destroy();
    this.destroy();
  }
}
