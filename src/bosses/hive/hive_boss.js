/**
 * hive_boss.js
 * -----------------------------------------------------------------------------
 * Chefão COLMEIA (fase 5, 1ª etapa). É PARADO: fica exatamente em cima do
 * desenho da colmeia no cenário da arena (colmeia.json diz onde) e perde vida
 * quando apanha (espada, flechas, especiais).
 *
 * Para se defender, solta VESPAS pela boca (as mesmas vespas do jogo) em
 * levas: uma por segundo até 6, depois descansa 25 s e começa outra leva,
 * até acabarem as guardadas.
 * Enquanto isso, gotas de MEL caem do teto (CeilingDrops).
 * Quando a vida acaba ela escurece e sai a ABELHA RAINHA (NEXT_BOSS).
 * -----------------------------------------------------------------------------
 */
class HiveBoss extends Boss {
  #layout;
  #bees = [];            // vespas soltas
  #released = 0;         // quantas já saíram
  #inWave = 0;           // quantas já saíram na leva atual
  #nextBeeAt;            // quando sai a próxima vespa
  #honey;                // mel espirrando ao apanhar
  #drops;                // gotas de mel caindo do teto

  /**
   * @param {Phaser.Scene} scene
   * @param {object} stats estatísticas ajustadas (MatchConfig)
   * @param {BossArena} arena
   * @param {PlayerParty} players
   * @param {Phaser.Events.EventEmitter} eventBus
   */
  constructor(scene, stats, arena, players, eventBus) {
    const layout = scene.cache.json.get(stats.LAYOUT);
    const sprite = scene.physics.add.image(arena.toWorldX(layout.x), layout.y, stats.TEXTURE)
      .setOrigin(0, 0)
      .setDepth(GameSettings.BOSS.DEPTH);

    super(scene, sprite, stats, arena, players, eventBus);
    this.#layout = layout;

    // Parada: sem gravidade e sem se mexer. A hitbox é só o corpo da colmeia
    // (sem o musgo pendurado nas bordas).
    const { HITBOX } = GameSettings.HIVE;
    sprite.body.setAllowGravity(false);
    sprite.body.moves = false;
    sprite.body.setSize(sprite.width * (HITBOX.RIGHT - HITBOX.LEFT), sprite.height * (HITBOX.BOTTOM - HITBOX.TOP), false);
    sprite.body.setOffset(sprite.width * HITBOX.LEFT, sprite.height * HITBOX.TOP);

    this.#honey = scene.add.particles(FxTextureKeys.SPARK).setDepth(GameSettings.BOSS.DEPTH + 0.5)
      .createEmitter({
        on: false,
        speed: { min: 40, max: 180 },
        angle: { min: 20, max: 160 },
        gravityY: 500,
        scale: { start: 0.8, end: 0.2 },
        lifespan: { min: 400, max: 800 },
        tint: [0xffc21a, 0xffdd66, 0xd98a00]
      });
    this.#drops = new CeilingDrops(scene, arena, players, (x, y, n) => this.#honey.explode(n, x, y),
      { texture: 'gota_mel', cfg: GameSettings.HONEY_DROPS });
    this.#nextBeeAt = scene.time.now + GameSettings.HIVE.FIRST_BEE_MS;

    // aparece junto com o cenário da arena (mesmo fade)
    sprite.setAlpha(0);
    scene.tweens.add({ targets: sprite, alpha: 1, duration: GameSettings.BACKGROUND.PHASE_FADE_MS });
  }

  /** Centro da colmeia (ela é desenhada a partir do canto de cima). */
  get x() { return this.sprite.body.center.x; }
  get y() { return this.sprite.body.center.y; }

  /** @override */
  get meleeReach() {
    return GameSettings.HIVE.MELEE_REACH;
  }

  /** @override A colmeia é grande: a espada mede até a borda dela, não até o centro. */
  distanceFrom(other) {
    const body = this.sprite.body;
    const dx = Math.max(body.left - other.x, 0, other.x - body.right);
    const dy = Math.max(body.top - other.y, 0, other.y - body.bottom);
    return Math.hypot(dx, dy);
  }

  /** @override Boca da colmeia (de onde saem as vespas). */
  get mouth() {
    const [x, y] = this.#layout.mouth;
    return { x: this.arena.toWorldX(x), y };
  }

  /** @override Mel caindo do teto e as vespas saindo uma de cada vez. */
  behave() {
    const now = this.scene.time.now;
    this.#drops.update();
    this.#drops.autoRain(now, this.target.x);
    if (now >= this.#nextBeeAt) this.#releaseNextBee(now);
  }

  /**
   * Solta a próxima vespa da leva. Depois da última da leva (PER_WAVE) a
   * colmeia descansa (WAVE_PAUSE_MS); se já houver vespas demais voando,
   * espera um pouco e tenta de novo.
   */
  #releaseNextBee(now) {
    const swarm = this.stats.SWARM;
    if (this.#released >= swarm.TOTAL) return; // acabaram as vespas guardadas
    this.#bees = this.#bees.filter(bee => bee.isAlive);
    if (this.#bees.length >= swarm.MAX_ALIVE) {
      this.#nextBeeAt = now + swarm.BEE_INTERVAL_MS;
      return;
    }

    this.#releaseBee();
    this.#released++;
    this.#inWave++;
    const waveDone = this.#inWave >= swarm.PER_WAVE;
    if (waveDone) this.#inWave = 0;
    this.#nextBeeAt = now + (waveDone ? swarm.WAVE_PAUSE_MS : swarm.BEE_INTERVAL_MS);
  }

  #releaseBee() {
    const { x, y } = this.mouth;
    const spawn = {
      TYPE: EnemyTypeId[this.stats.SWARM.BEE_TYPE],
      X: x + Phaser.Math.Between(-15, 15),
      Y: y + Phaser.Math.Between(-20, 20) // alturas diferentes para não voarem iguais
    };
    this.#honey.explode(4, x, y);
    this.summon(spawn, bee => this.#bees.push(bee));
  }

  /** @override Pisca em branco, a tela treme e espirra mel de onde apanhou. */
  onHit(source) {
    const { HIT_FLASH_MS, HIT_SHAKE } = GameSettings.HIVE;
    this.scene.cameras.main.shake(HIT_SHAKE.DURATION_MS, HIT_SHAKE.INTENSITY);
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(HIT_FLASH_MS, () => {
      if (this.canBeHit) this.sprite.clearTint(); // derrotada: fica escura
    });
    const body = this.sprite.body;
    this.#honey.explode(6, Phaser.Math.Clamp(source.x, body.left, body.right), Phaser.Math.Clamp(source.y, body.top, body.bottom));
  }

  /** @override Esvaziou: treme, escurece e espirra mel antes da rainha sair. */
  playDefeat(done) {
    const cfg = GameSettings.HIVE;
    this.scene.cameras.main.shake(cfg.DEFEAT_MS, 0.008);
    this.sprite.setTint(cfg.DEFEAT_TINT);
    this.#drops.clear();
    const { x, y } = this.mouth;
    for (let i = 0; i < 5; i++) {
      this.scene.time.delayedCall(i * 200, () => this.#honey.explode(10, x + Phaser.Math.Between(-60, 60), y));
    }
    this.scene.time.delayedCall(cfg.DEFEAT_MS, done);
  }

  /** @override A colmeia vazia continua pendurada (escura); só sai do combate. */
  destroyParts() {
    this.sprite.body.enable = false;
    this.#drops.destroy();
  }
}
