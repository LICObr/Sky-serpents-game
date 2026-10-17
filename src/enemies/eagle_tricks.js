/**
 * eagle_tricks.js
 * -----------------------------------------------------------------------------
 * TRUQUES das águias diferentes (fase 6), no padrão "Strategy": cada tipo
 * de águia escolhe o seu em enemy_types.js (TRICK.ID) e a EagleEnemy só
 * chama os ganchos:
 *   onLand(time)        acabou de pousar
 *   walk(time, player)  no chão; true = o truque controla o movimento agora
 *   onRise(time)        subindo de volta depois do mergulho (as que não pousam)
 *   shielded            protegida (não apanha nem machuca)
 *   destroy()           a águia morreu: limpa o que o truque criou
 *
 *   STUCK_BEAK    Bico-de-Lança: o bico ENTALA no chão ao pousar (fica parada,
 *                 tremendo); depois dá ESTOCADAS correndo na direção do jogador
 *   TAIL_GUST     Rabo-de-Leque: abana o rabo e o VENTO empurra o jogador para trás
 *   WING_SHIELD   Asa-Larga: se cobre com as asas enormes (escudinho em cima)
 *   FEATHER_DARTS Negra: ao subir depois do mergulho, solta PENAS afiadas
 * -----------------------------------------------------------------------------
 */
const EagleTrickId = Object.freeze({
  STUCK_BEAK: 'STUCK_BEAK',
  TAIL_GUST: 'TAIL_GUST',
  WING_SHIELD: 'WING_SHIELD',
  FEATHER_DARTS: 'FEATHER_DARTS'
});

/** Sem truque (águia comum): todos os ganchos não fazem nada. */
class EagleTrick {
  #eagle;
  #config;

  /**
   * @param {EagleEnemy} eagle dona do truque
   * @param {object} config TRICK do tipo da águia
   */
  constructor(eagle, config) {
    this.#eagle = eagle;
    this.#config = config;
  }

  get eagle()    { return this.#eagle; }
  get config()   { return this.#config; }
  get shielded() { return false; }

  // eslint-disable-next-line no-unused-vars
  onLand(time) {}

  // eslint-disable-next-line no-unused-vars
  walk(time, player) { return false; }

  // eslint-disable-next-line no-unused-vars
  onRise(time) {}

  destroy() {}

  /** Cria o truque certo para o tipo (ou o "sem truque"). */
  static create(eagle, config, eggs) {
    switch (config && config.ID) {
      case EagleTrickId.STUCK_BEAK:    return new StuckBeakTrick(eagle, config);
      case EagleTrickId.TAIL_GUST:     return new TailGustTrick(eagle, config);
      case EagleTrickId.WING_SHIELD:   return new WingShieldTrick(eagle, config);
      case EagleTrickId.FEATHER_DARTS: return new FeatherDartsTrick(eagle, config, eggs);
      default:                         return new EagleTrick(eagle, config);
    }
  }
}

/** Bico-de-Lança: entala o bico no chão e depois dá estocadas. */
class StuckBeakTrick extends EagleTrick {
  #stuckUntil = 0;
  #lungeUntil = 0;
  #nextLungeAt = 0;

  /** @override O bico entra no chão: fica inclinada para a frente. */
  onLand(time) {
    const sprite = this.eagle.sprite;
    this.#stuckUntil = time + this.config.STUCK_MS;
    this.#nextLungeAt = this.#stuckUntil + this.config.LUNGE_EVERY_MS / 2;
    sprite.setRotation(sprite.flipX ? 0.5 : -0.5);
  }

  /** @override Entalada (tremendo) → anda normal → de vez em quando, uma estocada. */
  walk(time, player) {
    const cfg = this.config;
    const sprite = this.eagle.sprite;
    if (time < this.#stuckUntil) {
      sprite.setVelocityX(Math.sin(time * 0.09) * 40); // puxando o bico preso
      return true;
    }
    if (sprite.rotation !== 0) sprite.setRotation(0); // soltou
    if (time < this.#lungeUntil) return true;          // estocada em andamento

    const dx = player.x - this.eagle.x;
    if (time < this.#nextLungeAt || Math.abs(dx) > cfg.LUNGE_RANGE_X) return false;
    const direction = Math.sign(dx) || -1;
    sprite.setVelocityX(direction * cfg.LUNGE_SPEED);
    sprite.setFlipX(direction > 0); // a arte olha para a esquerda
    this.#lungeUntil = time + cfg.LUNGE_MS;
    this.#nextLungeAt = time + cfg.LUNGE_EVERY_MS;
    return true;
  }
}

/** Rabo-de-Leque: abana o rabo e o vento empurra o jogador para trás. */
class TailGustTrick extends EagleTrick {
  #nextGustAt = 0;
  #wind;

  constructor(eagle, config) {
    super(eagle, config);
    this.#wind = eagle.scene.add.particles(FxTextureKeys.SPARK).setDepth(GameSettings.ENEMY.DEPTH + 0.6)
      .createEmitter({
        on: false,
        speed: { min: 260, max: 440 },
        lifespan: 420,
        scale: { start: 0.7, end: 0 },
        alpha: { start: 0.85, end: 0 },
        tint: [0xffffff, 0xd8f0ff]
      });
  }

  /** @override */
  onLand(time) {
    this.#nextGustAt = time + this.config.EVERY_MS / 2;
  }

  /** @override Continua andando; de tempos em tempos, uma rajada. */
  walk(time, player) {
    if (time < this.#nextGustAt) return false;
    this.#nextGustAt = time + this.config.EVERY_MS;
    this.#gust(player);
    return false;
  }

  /** Abana o rabo (estica rapidinho) e solta o vento na direção do jogador. */
  #gust(player) {
    const cfg = this.config;
    const eagle = this.eagle;
    const sprite = eagle.sprite;
    const direction = Math.sign(player.x - eagle.x) || 1;
    eagle.scene.tweens.add({ targets: sprite, scaleY: sprite.scaleY * 1.25, duration: 80, yoyo: true, repeat: 1 });
    this.#wind.setAngle(direction > 0 ? { min: -15, max: 15 } : { min: 165, max: 195 });
    this.#wind.explode(16, eagle.x, eagle.y);
    const near = Math.abs(player.x - eagle.x) < cfg.RANGE_X && Math.abs(player.y - eagle.y) < cfg.RANGE_Y;
    if (near) player.pushBack(direction, cfg.FORCE);
  }

  /** @override */
  destroy() {
    this.#wind.manager.destroy();
  }
}

/** Asa-Larga: se cobre com as asas — nesse tempo nada acerta (nem ela machuca). */
class WingShieldTrick extends EagleTrick {
  #shieldUntil = 0;
  #nextShieldAt = 0;
  #icon;

  constructor(eagle, config) {
    super(eagle, config);
    this.#icon = eagle.scene.add.image(0, 0, FxTextureKeys.SHIELD)
      .setScale(0.6).setAlpha(0.85).setDepth(GameSettings.ENEMY.DEPTH + 0.6).setVisible(false);
  }

  /** @override */
  get shielded() {
    return this.eagle.scene.time.now < this.#shieldUntil;
  }

  /** @override */
  onLand(time) {
    this.#nextShieldAt = time + this.config.EVERY_MS / 2;
  }

  /** @override Coberta: parada, asas abertas por cima e o escudinho aparecendo. */
  walk(time) {
    const cfg = this.config;
    const eagle = this.eagle;
    const sprite = eagle.sprite;
    if (time >= this.#nextShieldAt) {
      this.#shieldUntil = time + cfg.MS;
      this.#nextShieldAt = time + cfg.EVERY_MS;
    }
    const covered = this.shielded;
    this.#icon.setVisible(covered).setPosition(sprite.x, sprite.y - sprite.displayHeight * 0.7);
    if (!covered) {
      eagle.restoreTint();
      return false;
    }
    sprite.setVelocityX(0);
    sprite.setTint(0xaab0c0);
    eagle.setTextureIfChanged(eagle.type.FRAMES[1]); // asas abaixadas, cobrindo o corpo
    return true;
  }

  /** @override */
  destroy() {
    this.#icon.destroy();
  }
}

/** Negra: ao subir de volta, solta penas afiadas que caem balançando. */
class FeatherDartsTrick extends EagleTrick {
  #eggs;

  constructor(eagle, config, eggs) {
    super(eagle, config);
    this.#eggs = eggs;
  }

  /** @override */
  onRise() {
    const cfg = this.config;
    const eagle = this.eagle;
    for (let i = 0; i < cfg.COUNT; i++) {
      const feather = this.#eggs.spawn(eagle.x, eagle.y, cfg.TEXTURE, 0, 0);
      if (feather) feather.setVelocity((i - (cfg.COUNT - 1) / 2) * cfg.SPREAD_X, cfg.SPEED_Y);
    }
  }
}
