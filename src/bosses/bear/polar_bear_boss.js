/**
 * polar_bear_boss.js
 * -----------------------------------------------------------------------------
 * Chefão URSO POLAR (fase 4). Diferente dos dragões, ele luta NO CHÃO.
 * Herda de Boss e é composto por:
 *   - BearBrain     → máquina de estados (o que fazer e qual animação mostrar)
 *   - IceBallAttack → bolas de gelo que CONGELAM (não tiram coração)
 *   - IceWaves      → ondas de gelo do terremoto (pule por cima!)
 *   - CeilingDrops  → pinos de gelo caindo do céu (só abaixo de 50% da vida)
 *   - ajudantes     → depois de perder 20% da vida, chama morceguinhos e slimes de gelo
 *
 * Esta classe sabe EXECUTAR cada movimento (andar, investir, pular, pisar no
 * chão...) com física, animação e efeitos (neve espirrando, tela tremendo);
 * o cérebro decide QUANDO. Encostar no urso machuca (dano físico).
 *
 * Ao ser derrotado: animação morrendo → se enrola → vira uma BOLA DE NEVE.
 * -----------------------------------------------------------------------------
 */
class PolarBearBoss extends Boss {
  #brain;
  #attack;
  #waves;
  #icicles;
  #nextRainAt = 0;
  #floor;
  #snow;
  #facingRight = false;
  #nextSprayAt = 0;
  #warningTween = null;
  #minions = [];
  #nextSummonAt = 0;

  /**
   * @param {Phaser.Scene} scene
   * @param {object} stats estatísticas ajustadas (MatchConfig.boss)
   * @param {BossArena} arena
   * @param {Player} target
   * @param {Phaser.Events.EventEmitter} eventBus
   * @param {FireballPool} projectiles
   * @param {Function} AttackClass subclasse de BossAttack (IceBallAttack)
   */
  constructor(scene, stats, arena, target, eventBus, projectiles, AttackClass) {
    const cfg = GameSettings.POLAR_BEAR;
    const groundTop = GameSettings.LEVEL.GROUND_TOP;
    const sprite = scene.physics.add
      .sprite(arena.toWorldX(cfg.START_X), groundTop - 80, BearSpriteSheet.key, 0)
      .setScale(stats.SCALE)
      .setDepth(GameSettings.BOSS.DEPTH + 0.5);

    super(scene, sprite, stats, arena, target, eventBus);

    // Hitbox no corpo, com os pés na base do quadro
    const frame = sprite.frame;
    sprite.body.setSize(cfg.BODY.WIDTH, cfg.BODY.HEIGHT);
    sprite.body.setOffset((frame.width - cfg.BODY.WIDTH) / 2, frame.height - cfg.BODY.FOOT_PADDING - cfg.BODY.HEIGHT);
    sprite.setCollideWorldBounds(true);
    sprite.setFlipX(true); // começa olhando para a esquerda (para o jogador)

    // Chão próprio da arena (o urso não sobe nas ilhas)
    this.#floor = scene.add.rectangle(arena.left + GameSettings.LEVEL.ARENA_WIDTH / 2, groundTop + 30,
      GameSettings.LEVEL.ARENA_WIDTH, 60).setVisible(false);
    scene.physics.add.existing(this.#floor, true);
    scene.physics.add.collider(sprite, this.#floor);

    // Neve espirrando (pisadas, derrapadas, ondas, morte)
    const particles = scene.add.particles(FxTextureKeys.SPARK).setDepth(GameSettings.BOSS.DEPTH + 0.7);
    this.#snow = particles.createEmitter({
      on: false,
      speed: { min: 60, max: 260 },
      angle: { min: 200, max: 340 },
      gravityY: 600,
      scale: { start: 0.9, end: 0.1 },
      alpha: { start: 1, end: 0 },
      lifespan: { min: 400, max: 900 },
      tint: [0xffffff, 0xe6f8ff, 0xbfe9ff]
    });

    this.#attack = new AttackClass(this, projectiles);
    this.#waves = new IceWaves(scene, arena, target, (x, y, n) => this.snowPuff(x, y, n));
    this.#icicles = new CeilingDrops(scene, arena, target, (x, y, n) => this.snowPuff(x, y, n),
      { texture: FxTextureKeys.ICICLE, cfg: GameSettings.POLAR_BEAR.ICICLES });
    this.#brain = new BearBrain(this);
  }

  get facingRight() { return this.#facingRight; }
  get brain()       { return this.#brain; }

  get isOnGround() {
    const body = this.sprite.body;
    return body.blocked.down || body.touching.down;
  }

  /** @override */
  get meleeReach() {
    return GameSettings.POLAR_BEAR.MELEE_REACH;
  }

  /** @override As bolas saem da pata da frente. */
  get mouth() {
    const sprite = this.sprite;
    const dir = this.#facingRight ? 1 : -1;
    return { x: sprite.x + dir * sprite.displayWidth * 0.35, y: sprite.y - sprite.displayHeight * 0.1 };
  }

  /** @override */
  behave() {
    const now = this.scene.time.now;
    this.#brain.update(now);
    this.#waves.update(now);
    this.#icicles.update();
    this.#updateIcicleRain(now);
    this.#updateMinions(now);
  }

  /** Bravo (abaixo de 50%): pinos de gelo caem do céu de tempos em tempos. */
  #updateIcicleRain(now) {
    if (!this.#brain.isAngry) return;
    const cfg = GameSettings.POLAR_BEAR.ICICLES;
    if (this.#nextRainAt === 0) this.#nextRainAt = now + 1500; // logo depois do rugido
    if (now < this.#nextRainAt) return;
    this.#nextRainAt = now + Phaser.Math.Between(cfg.INTERVAL_MS.MIN, cfg.INTERVAL_MS.MAX);
    this.#icicles.rain(Phaser.Math.Between(cfg.PER_RAIN.MIN, cfg.PER_RAIN.MAX), this.target.x);
  }

  /** Depois de perder 20% da vida, chama morceguinhos e slimes de gelo de vez em quando. */
  #updateMinions(now) {
    const cfg = GameSettings.POLAR_BEAR.MINIONS;
    if (this.health.ratio > cfg.HP_RATIO) return;
    if (this.#nextSummonAt === 0) this.#nextSummonAt = now + 600; // o primeiro vem logo
    if (now < this.#nextSummonAt) return;
    this.#nextSummonAt = now + Phaser.Math.Between(cfg.INTERVAL_MS.MIN, cfg.INTERVAL_MS.MAX);

    this.#minions = this.#minions.filter(enemy => enemy.isAlive);
    const count = Math.min(Phaser.Math.Between(cfg.PER_CALL.MIN, cfg.PER_CALL.MAX), cfg.MAX_ALIVE - this.#minions.length);
    for (let i = 0; i < count; i++) {
      // entram pelas bordas da arena, do lado oposto ao jogador
      const fromLeft = this.target.x > this.arena.left + GameSettings.LEVEL.ARENA_WIDTH / 2;
      const x = fromLeft ? this.arena.left + 30 + i * 40 : this.arena.right - 30 - i * 40;
      const minion = Phaser.Utils.Array.GetRandom(cfg.TYPES);
      const spawn = { TYPE: EnemyTypeId[minion.TYPE], X: x };
      if (minion.FLYING) spawn.Y = Phaser.Math.Between(cfg.Y.MIN, cfg.Y.MAX);
      this.snowPuff(x, spawn.Y ?? GameSettings.LEVEL.GROUND_TOP - 10, 10);
      this.summon(spawn, enemy => this.#minions.push(enemy));
    }
  }

  // ------------------------------------------------------------- movimentos

  /** Toca um clipe (não reinicia se já estiver tocando). */
  play(clip) {
    this.sprite.play(BearSpriteSheet.clipKey(clip), true);
  }

  /** O jogador está do outro lado (precisa virar)? */
  wantsToTurn() {
    const dx = this.target.x - this.x;
    return Math.abs(dx) > 30 && (dx > 0) !== this.#facingRight;
  }

  /** Vira para o lado do jogador. */
  faceTarget() {
    this.#facingRight = this.target.x > this.x;
    this.sprite.setFlipX(!this.#facingRight);
  }

  stop() {
    if (this.isOnGround) this.sprite.setVelocityX(0);
  }

  walk(speed) {
    this.sprite.setVelocityX((this.#facingRight ? 1 : -1) * speed);
  }

  /** Investida: corre reto na direção em que está virado, levantando neve. */
  dash(speed) {
    this.walk(speed);
    this.#spray(40, 3);
  }

  /** Freia aos poucos (fator por frame). */
  brake(factor) {
    this.sprite.setVelocityX(this.sprite.body.velocity.x * factor);
  }

  /** Neve voando dos pés enquanto derrapa. */
  skidSpray() {
    if (Math.abs(this.sprite.body.velocity.x) > 15) this.#spray(30, 4);
  }

  /** Rugido: tela treme e neve cai do céu. */
  roar() {
    const camera = this.scene.cameras.main;
    camera.shake(GameSettings.POLAR_BEAR.ROAR_MS * 0.8, 0.006);
    for (let i = 0; i < 6; i++) {
      this.scene.time.delayedCall(i * 140, () => {
        this.snowPuff(Phaser.Math.Between(this.arena.left, this.arena.right), 10, 6);
      });
    }
  }

  /** Pisca em vermelho-claro: vai fazer algo forte. */
  setWarning(on) {
    if (this.#warningTween) { this.#warningTween.stop(); this.#warningTween = null; }
    if (!this.isAlive) return;
    if (!on) { this.sprite.clearTint(); return; }
    this.sprite.setTint(0xffb0b0);
    this.#warningTween = this.scene.tweens.addCounter({
      from: 0, to: 1, duration: 90, yoyo: true, repeat: -1,
      onUpdate: tween => {
        if (!this.isAlive) return;
        if (tween.getValue() > 0.5) this.sprite.setTint(0xff9a9a); else this.sprite.clearTint();
      }
    });
  }

  /** Pulo calculado para cair perto do jogador. */
  leapAtTarget(velocityY, maxSpeedX) {
    this.faceTarget();
    const gravity = GameSettings.PHYSICS.GRAVITY_Y;
    const airTime = (2 * -velocityY) / gravity;
    const speedX = Phaser.Math.Clamp((this.target.x - this.x) / airTime, -maxSpeedX, maxSpeedX);
    this.sprite.setVelocity(speedX, velocityY);
    this.play('pulando_sobe');
    this.snowPuff(this.x, GameSettings.LEVEL.GROUND_TOP - 4, 10);
  }

  /** Subindo ou descendo no ar. */
  updateJumpPose() {
    if (this.sprite.body.velocity.y > 0) this.play('pulando_desce');
  }

  /** Caiu do pulo: terra treme; bravo, solta ondinhas pequenas. */
  landImpact(angry) {
    this.scene.cameras.main.shake(180, 0.008);
    this.snowPuff(this.x, GameSettings.LEVEL.GROUND_TOP - 4, 22);
    if (angry) {
      const speed = GameSettings.POLAR_BEAR.WAVE.SPEED * 0.8;
      this.#waves.spawn(this.x - 40, -1, speed);
      this.#waves.spawn(this.x + 40, 1, speed);
    }
  }

  /** PISOU NO CHÃO: terremoto com ondas de gelo para os dois lados. */
  quake(waveSpeed, angry) {
    const cfg = GameSettings.POLAR_BEAR.QUAKE;
    const ground = GameSettings.LEVEL.GROUND_TOP;
    this.scene.cameras.main.shake(cfg.SHAKE_MS, cfg.SHAKE_INTENSITY);
    this.snowPuff(this.x - 30, ground - 4, 18);
    this.snowPuff(this.x + 30, ground - 4, 18);
    this.#waves.spawn(this.x - 50, -1, waveSpeed);
    this.#waves.spawn(this.x + 50, 1, waveSpeed);
    // Bravo: o tremor derruba pinos de gelo do céu
    if (angry) this.#icicles.rain(cfg.ICICLES, this.target.x);
  }

  /** Bateu a pata: uma onda rápida só na direção do jogador. */
  slam(waveSpeed) {
    const dir = this.#facingRight ? 1 : -1;
    this.scene.cameras.main.shake(140, 0.005);
    this.snowPuff(this.x + dir * 50, GameSettings.LEVEL.GROUND_TOP - 4, 14);
    this.#waves.spawn(this.x + dir * 60, dir, waveSpeed);
  }

  throwIceBalls(count) {
    this.faceTarget();
    this.#attack.throwBalls(count);
  }

  /** Neve espirrando num ponto. */
  snowPuff(x, y, count) {
    this.#snow.explode(count, x, y);
  }

  #spray(intervalMs, count) {
    const now = this.scene.time.now;
    if (now < this.#nextSprayAt) return;
    this.#nextSprayAt = now + intervalMs;
    this.snowPuff(this.x - (this.#facingRight ? 30 : -30), GameSettings.LEVEL.GROUND_TOP - 4, count);
  }

  // ------------------------------------------------------------- apanhar / morrer

  /** @override Pisca em branco e a tela treme. */
  onHit() {
    const { DURATION_MS, INTENSITY } = GameSettings.POLAR_BEAR.HIT_SHAKE;
    this.scene.cameras.main.shake(DURATION_MS, INTENSITY);
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(GameSettings.POLAR_BEAR.HIT_FLASH_MS, () => {
      if (this.isAlive && !this.#warningTween) this.sprite.clearTint();
    });
    this.snowPuff(this.x, this.y - 20, 6);
  }

  /** @override Morrendo → se enrola → vira uma bola de neve. */
  playDefeat(done) {
    const scene = this.scene;
    const sprite = this.sprite;
    const ground = GameSettings.LEVEL.GROUND_TOP;
    this.setWarning(false);
    this.#waves.clear();
    this.#icicles.clear();
    sprite.clearTint();
    sprite.setVelocity(0, sprite.body.velocity.y);
    scene.cameras.main.shake(300, 0.006);

    sprite.play(BearSpriteSheet.clipKey('morrendo'));
    sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      sprite.play(BearSpriteSheet.clipKey('enrolado'));
      sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        // Puf de neve: o urso some e no lugar fica uma bola de neve
        this.snowPuff(sprite.x, ground - 20, 40);
        this.snowPuff(sprite.x, ground - 40, 30);
        scene.tweens.add({ targets: sprite, scaleX: sprite.scaleX * 0.4, scaleY: sprite.scaleY * 0.4, alpha: 0, duration: 260 });

        const ball = scene.add.image(sprite.x, ground, FxTextureKeys.SNOWBALL)
          .setOrigin(0.5, 0.5).setScale(0).setDepth(GameSettings.BOSS.DEPTH + 0.5);
        ball.y = ground - ball.height * GameSettings.POLAR_BEAR.SNOWBALL_SCALE / 2;
        scene.tweens.add({
          targets: ball, scale: GameSettings.POLAR_BEAR.SNOWBALL_SCALE, duration: 420, ease: 'Back.easeOut',
          onComplete: () => {
            // rolando um pouquinho e parando
            const dir = this.#facingRight ? 1 : -1;
            scene.tweens.add({ targets: ball, x: ball.x + dir * 60, angle: dir * 200, duration: 900, ease: 'Cubic.easeOut' });
            scene.time.delayedCall(GameSettings.POLAR_BEAR.DEFEAT_PAUSE_MS, done);
          }
        });
      });
    });
  }

  /** @override */
  destroyParts() {
    this.#waves.destroy();
    this.#icicles.destroy();
    this.#floor.destroy();
    this.destroy();
  }
}
