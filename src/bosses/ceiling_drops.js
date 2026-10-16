/**
 * ceiling_drops.js
 * -----------------------------------------------------------------------------
 * Coisas que CAEM DO TETO na luta contra o chefão:
 *   - pinos de gelo do Urso Polar (quando ele está bravo);
 *   - gotas de mel da Abelha Rainha.
 *
 *   1. aparece no topo da tela TREMENDO (aviso de onde vai cair);
 *   2. despenca com gravidade;
 *   3. ao bater no chão se espatifa (gelo/mel espirrando).
 * Acertar o jogador machuca (impacto físico).
 * -----------------------------------------------------------------------------
 */
class CeilingDrops {
  #scene;
  #arena;
  #group;
  #splash;
  #texture;
  #cfg;
  #nextRainAt = 0;
  #overlap;          // colisão jogador x gotas (desfeita no destroy)

  /**
   * @param {Phaser.Scene} scene
   * @param {BossArena} arena
   * @param {Player} target
   * @param {Function} splash (x, y, quantidade) → gelo/mel espirrando
   * @param {{texture: string, cfg: object}} options imagem e configuração
   *        (ex.: GameSettings.POLAR_BEAR.ICICLES)
   */
  constructor(scene, arena, target, splash, { texture, cfg }) {
    this.#scene = scene;
    this.#arena = arena;
    this.#splash = splash;
    this.#texture = texture;
    this.#cfg = cfg;
    this.#group = scene.physics.add.group({ allowGravity: false });

    this.#overlap = scene.physics.add.overlap(target.sprite, this.#group, (_player, icicle) => {
      if (!icicle.getData('falling')) return;
      target.hitByContact(ProjectileEffect.NONE);
      this.#shatter(icicle);
    });
  }

  /**
   * Solta uma chuva em posições sorteadas (uma sempre perto do jogador).
   * @param {number} count
   * @param {number} targetX posição do jogador
   */
  rain(count, targetX) {
    const cfg = this.#cfg;
    for (let i = 0; i < count; i++) {
      const x = i === 0
        ? Phaser.Math.Clamp(targetX + Phaser.Math.Between(-30, 30), this.#arena.left + 30, this.#arena.right - 30)
        : Phaser.Math.Between(this.#arena.left + 30, this.#arena.right - 30);
      this.#scene.time.delayedCall(i * cfg.STAGGER_MS, () => this.#spawn(x));
    }
  }

  /**
   * Chuva automática: de tempos em tempos (INTERVAL_MS) cai PER_RAIN da
   * configuração. Chamar a cada frame enquanto a chuva estiver ligada.
   * @param {number} now
   * @param {number} targetX posição do jogador
   */
  autoRain(now, targetX) {
    const cfg = this.#cfg;
    if (this.#nextRainAt === 0) this.#nextRainAt = now + (cfg.FIRST_MS || 0);
    if (now < this.#nextRainAt) return;
    this.#nextRainAt = now + Phaser.Math.Between(cfg.INTERVAL_MS.MIN, cfg.INTERVAL_MS.MAX);
    this.rain(Phaser.Math.Between(cfg.PER_RAIN.MIN, cfg.PER_RAIN.MAX), targetX);
  }

  #spawn(x) {
    const cfg = this.#cfg;
    const icicle = this.#group.get(x, cfg.START_Y, this.#texture);
    if (!icicle) return;
    icicle.setTexture(this.#texture);
    icicle.enableBody(true, x, cfg.START_Y, true, true);
    icicle.body.setAllowGravity(false);
    icicle.setVelocity(0, 0).setAngle(0).setAlpha(1).setScale(cfg.SCALE)
      .setOrigin(0.5, 0).setDepth(GameSettings.BOSS.DEPTH + 0.65);
    icicle.body.setSize(10, 30).setOffset(7, 10);
    icicle.setData('falling', false);

    // Aviso: treme pendurado lá em cima
    this.#scene.tweens.add({
      targets: icicle, x: x + 2, duration: 45, yoyo: true, repeat: Math.floor(cfg.WARNING_MS / 90),
      onComplete: () => {
        if (!icicle.active) return;
        icicle.x = x;
        icicle.setData('falling', true);
        icicle.body.setAllowGravity(true);
        icicle.setVelocityY(cfg.FALL_SPEED);
      }
    });
  }

  /** Confere quem bateu no chão (chamar a cada frame). */
  update() {
    const ground = GameSettings.LEVEL.GROUND_TOP;
    this.#group.getChildren().forEach(icicle => {
      if (icicle.active && icicle.getData('falling') && icicle.body.bottom >= ground) this.#shatter(icicle);
    });
  }

  /** Espatifa: pedacinhos espirrando e some. */
  #shatter(icicle) {
    icicle.setData('falling', false);
    this.#splash(icicle.x, Math.min(icicle.body.bottom, GameSettings.LEVEL.GROUND_TOP) - 4, 12);
    this.#scene.cameras.main.shake(70, 0.003);
    this.#group.killAndHide(icicle);
    icicle.body.enable = false;
  }

  /** Some com todos (ex.: urso derrotado). */
  clear() {
    this.#group.getChildren().forEach(icicle => {
      if (icicle.active) this.#shatter(icicle);
    });
  }

  /** Remove tudo, inclusive a colisão (a luta pode continuar com outro chefão). */
  destroy() {
    this.#overlap.destroy();
    this.#group.destroy(true);
  }
}
