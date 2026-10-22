/**
 * thunderstorm.js
 * -----------------------------------------------------------------------------
 * TEMPESTADE de noite (STORM no arquivo da fase):
 *   - CHUVA muito forte, inclinada pelo vento, com respingos no chão;
 *   - ESCURIDÃO: a tela fica escurecida e só os relâmpagos clareiam;
 *   - RELÂMPAGOS de tempos em tempos: um raio cheio de galhos risca o céu, tudo
 *     clareia piscando (duas vezes, como relâmpago de verdade) e o fundo
 *     ILUMINADO aparece — o tornado brilha. Um instante depois vem o TROVÃO
 *     (a tela treme);
 *   - às vezes o raio CAI NO CHÃO perto de um jogador: o lugar brilha e solta
 *     faíscas avisando e, se ele não sair dali, perde um coração;
 *   - RAJADAS DE VENTO: primeiro folhas voando e a chuva deitando (o aviso),
 *     depois o vento empurra os jogadores por uns segundos.
 * -----------------------------------------------------------------------------
 */
class Thunderstorm {
  static SKY_DEPTH = -1.5; // raios no céu: na frente do fundo, atrás do chão

  #scene;
  #cfg;
  #levelMap;
  #party;
  #lit;           // o fundo iluminado (o tornado brilhando)
  #darkness;      // a tela escurecida da noite
  #rain;
  #splashes;
  #leaves;
  #sparks;
  #nextFlashAt;
  #nextGustAt;
  #gust = null;   // { direction, pushAt, endsAt }

  /**
   * @param {Phaser.Scene} scene
   * @param {object} cfg STORM da fase
   * @param {ParallaxBackground} background para a camada do fundo iluminado
   * @param {LevelMap} levelMap onde fica o chão (respingos, raio no chão)
   * @param {PlayerParty} party
   */
  constructor(scene, cfg, background, levelMap, party) {
    this.#scene = scene;
    this.#cfg = cfg;
    this.#levelMap = levelMap;
    this.#party = party;
    const { WIDTH, HEIGHT } = GameSettings.SCREEN;
    const hudDepth = GameSettings.HUD.DEPTH;

    this.#lit = background.addLightLayer(cfg.LIT_TEXTURE);
    this.#darkness = scene.add.rectangle(0, 0, WIDTH, HEIGHT, cfg.DARKNESS.COLOR, cfg.DARKNESS.ALPHA)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(hudDepth - 2);

    this.#rain = scene.add.particles(FxTextureKeys.RAIN).setDepth(hudDepth - 1).createEmitter({
      x: { min: -160, max: WIDTH + 160 },
      y: -30,
      lifespan: 800,
      speedY: { min: cfg.RAIN.SPEED * 0.85, max: cfg.RAIN.SPEED * 1.1 },
      speedX: cfg.WIND.BASE,
      scale: { min: 0.8, max: 1.4 },
      alpha: { min: 0.35, max: 0.8 },
      frequency: cfg.RAIN.EVERY_MS,
      quantity: cfg.RAIN.PER_TICK
    }).setScrollFactor(0);
    this.#tiltRain(cfg.WIND.BASE);

    const particles = (texture, depth) => scene.add.particles(texture).setDepth(depth);
    this.#splashes = particles(FxTextureKeys.SPARK, GameSettings.PLAYER.DEPTH + 0.1).createEmitter({
      on: false,
      speed: { min: 30, max: 110 },
      angle: { min: 220, max: 320 },
      gravityY: 700,
      lifespan: 260,
      scale: { start: 0.35, end: 0.05 },
      alpha: { start: 0.8, end: 0 },
      tint: 0xcfe2ff
    });
    this.#leaves = particles(FxTextureKeys.LEAF, hudDepth - 1).createEmitter({
      on: false,
      x: 0, y: { min: 60, max: HEIGHT - 60 },
      lifespan: 2600,
      speedY: { min: -40, max: 60 },
      rotate: { start: 0, end: 720 },
      scale: { min: 0.8, max: 1.6 },
      frequency: 50
    }).setScrollFactor(0);
    this.#sparks = particles(FxTextureKeys.SPARK, GameSettings.PLAYER.DEPTH + 0.2).createEmitter({
      on: false,
      speed: { min: 60, max: 260 },
      angle: { min: 200, max: 340 },
      gravityY: 500,
      lifespan: { min: 250, max: 600 },
      scale: { start: 0.6, end: 0 },
      tint: [0xffffff, 0xcfe0ff, 0xfff2a0],
      blendMode: 'ADD'
    });

    const now = scene.time.now;
    this.#nextFlashAt = now + cfg.LIGHTNING.FIRST_MS;
    this.#nextGustAt = now + Phaser.Math.Between(cfg.WIND.EVERY_MS.MIN, cfg.WIND.EVERY_MS.MAX);
  }

  /** Relâmpagos, vento e respingos (chamar a cada frame, depois de mover os jogadores). */
  update(time) {
    if (time >= this.#nextFlashAt) {
      const { EVERY_MS, GROUND_CHANCE } = this.#cfg.LIGHTNING;
      this.#nextFlashAt = time + Phaser.Math.Between(EVERY_MS.MIN, EVERY_MS.MAX);
      if (Phaser.Math.Between(1, 100) <= GROUND_CHANCE) this.#strikeNearPlayer();
      else this.#skyLightning();
    }
    this.#updateWind(time);
    this.#splashOnGround();
  }

  // ------------------------------------------------------------- relâmpagos

  /** Raio no céu: risca, tudo clareia e depois troveja. */
  #skyLightning() {
    const { WIDTH } = GameSettings.SCREEN;
    const x = Phaser.Math.Between(60, WIDTH - 60);
    this.#drawBolt(x, -10, x + Phaser.Math.Between(-120, 120), Phaser.Math.Between(170, 340), true);
    this.#flash();
    const { MIN, MAX } = this.#cfg.LIGHTNING.THUNDER_DELAY_MS;
    this.#scene.time.delayedCall(Phaser.Math.Between(MIN, MAX), () => this.#thunder(0.004));
  }

  /** Raio no chão perto de um jogador: aviso brilhando e, depois, o raio cai ali. */
  #strikeNearPlayer() {
    const players = this.#party.inGame;
    if (players.length === 0) return;
    const cfg = this.#cfg.LIGHTNING.GROUND;
    const target = Phaser.Utils.Array.GetRandom(players);
    const x = target.x + Phaser.Math.Between(-cfg.SPREAD_X, cfg.SPREAD_X);
    const groundY = this.#levelMap.surfaceYAt(x);
    if (groundY === null || this.#levelMap.waterAt(x)) {
      this.#skyLightning(); // em cima de buraco ou lagoa: só no céu
      return;
    }
    const scene = this.#scene;
    const warning = scene.add.ellipse(x, groundY - 2, 34, 10, 0xcfe0ff, 0.25)
      .setDepth(GameSettings.PLAYER.DEPTH - 0.1);
    scene.tweens.add({ targets: warning, alpha: 0.8, scaleX: 1.4, duration: 120, yoyo: true, repeat: Math.floor(cfg.WARNING_MS / 240) });
    const crackle = scene.time.addEvent({ delay: 110, repeat: Math.floor(cfg.WARNING_MS / 110), callback: () => this.#sparks.explode(2, x, groundY - 2) });

    scene.time.delayedCall(cfg.WARNING_MS, () => {
      warning.destroy();
      crackle.remove();
      const view = scene.cameras.main.worldView;
      this.#drawBolt(x + Phaser.Math.Between(-60, 60), view.top - 10, x, groundY, false);
      this.#flash();
      this.#thunder(0.012);
      this.#sparks.explode(26, x, groundY - 2);
      const scorch = scene.add.ellipse(x, groundY, 46, 8, 0x000000, 0.5).setDepth(GameSettings.ENEMY.DEPTH - 0.6);
      scene.tweens.add({ targets: scorch, alpha: 0, delay: 1500, duration: 1500, onComplete: () => scorch.destroy() });
      this.#party.inGame
        .filter(player => Math.abs(player.x - x) < cfg.RADIUS && Math.abs(player.feetY - groundY) < 48)
        .forEach(player => player.hitByContact(ProjectileEffect.NONE));
    });
  }

  /**
   * Desenha um raio (LightningBolt) e apaga logo.
   * @param {boolean} onScreen true = preso na tela (céu); false = no mundo (cai no chão)
   */
  #drawBolt(fromX, fromY, toX, toY, onScreen) {
    const depth = onScreen ? Thunderstorm.SKY_DEPTH : GameSettings.PLAYER.DEPTH + 0.3;
    LightningBolt.draw(this.#scene, fromX, fromY, toX, toY, depth, onScreen);
  }

  /** Tudo clareia piscando duas vezes: o fundo iluminado aparece e a escuridão some. */
  #flash() {
    const scene = this.#scene;
    const cfg = this.#cfg.LIGHTNING;
    const night = this.#cfg.DARKNESS.ALPHA;
    scene.tweens.killTweensOf([this.#lit, this.#darkness]);
    const light = (litAlpha, darkAlpha) => {
      this.#lit.setAlpha(litAlpha);
      this.#darkness.setAlpha(darkAlpha);
    };
    light(1, 0);
    scene.time.delayedCall(60, () => light(0.35, night * 0.6));
    scene.time.delayedCall(120, () => {
      light(0.9, 0.05);
      scene.tweens.add({ targets: this.#lit, alpha: 0, duration: cfg.FADE_MS, ease: 'Quad.easeIn' });
      scene.tweens.add({ targets: this.#darkness, alpha: night, duration: cfg.FADE_MS, ease: 'Quad.easeIn' });
    });
  }

  /** Trovão: a tela treme. */
  #thunder(intensity) {
    this.#scene.cameras.main.shake(380, intensity);
    SoundFx.play(this.#scene, SoundKeys.THUNDER, { volume: Phaser.Math.Clamp(intensity / 0.012, 0.4, 1) });
  }

  // ------------------------------------------------------------- vento e chuva

  /** Rajadas: aviso (folhas e chuva deitando) e depois o empurrão nos jogadores. */
  #updateWind(time) {
    const cfg = this.#cfg.WIND;
    if (!this.#gust && time >= this.#nextGustAt) {
      const direction = Phaser.Math.Between(0, 1) ? 1 : -1;
      this.#gust = { direction, pushAt: time + cfg.WARNING_MS, endsAt: time + cfg.WARNING_MS + cfg.GUST_MS };
      this.#tiltRain(cfg.BASE + direction * cfg.GUST_RAIN);
      const { WIDTH, HEIGHT } = GameSettings.SCREEN;
      this.#leaves.setPosition(direction > 0 ? -20 : WIDTH + 20, { min: 60, max: HEIGHT - 60 });
      this.#leaves.setSpeedX({ min: direction * 380, max: direction * 620 });
      this.#leaves.start();
    }
    if (!this.#gust) return;
    if (time >= this.#gust.endsAt) {
      this.#gust = null;
      this.#nextGustAt = time + Phaser.Math.Between(cfg.EVERY_MS.MIN, cfg.EVERY_MS.MAX);
      this.#tiltRain(cfg.BASE);
      this.#leaves.stop();
      return;
    }
    if (time < this.#gust.pushAt) return;
    // o vento soma na velocidade de cada jogador (andando contra ele fica lento)
    this.#party.inGame.forEach(player => {
      const body = player.sprite.body;
      if (body.enable) body.velocity.x += this.#gust.direction * cfg.PUSH;
    });
  }

  /** Chuva caindo inclinada na direção do vento. */
  #tiltRain(windX) {
    this.#rain.setSpeedX({ min: windX * 0.9, max: windX * 1.1 });
    const angle = Phaser.Math.RadToDeg(Math.atan2(-windX, this.#cfg.RAIN.SPEED));
    this.#rain.rotate.onChange(angle);
  }

  /** Respingos de chuva no chão, por toda a tela. */
  #splashOnGround() {
    const view = this.#scene.cameras.main.worldView;
    for (let i = 0; i < this.#cfg.RAIN.SPLASHES_PER_FRAME; i++) {
      const x = Phaser.Math.Between(view.left, view.right);
      const groundY = this.#levelMap.surfaceYAt(x);
      if (groundY !== null) this.#splashes.explode(1, x, groundY - 1);
    }
  }
}
