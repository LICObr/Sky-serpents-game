/**
 * icicles.js
 * -----------------------------------------------------------------------------
 * PINOS DE GELO caindo do céu (como estalactites de caverna). Só acontecem
 * quando o Urso Polar está BRAVO (abaixo de metade da vida):
 *   1. o pino aparece no topo da tela TREMENDO (aviso de onde vai cair);
 *   2. despenca com gravidade;
 *   3. ao bater no chão estilhaça em pedacinhos de gelo.
 * Acertar o jogador machuca (impacto físico).
 * -----------------------------------------------------------------------------
 */
class Icicles {
  #scene;
  #arena;
  #group;
  #snow;

  /**
   * @param {Phaser.Scene} scene
   * @param {BossArena} arena
   * @param {Player} target
   * @param {Function} snowPuff (x, y, quantidade) → gelo espirrando
   */
  constructor(scene, arena, target, snowPuff) {
    this.#scene = scene;
    this.#arena = arena;
    this.#snow = snowPuff;
    this.#group = scene.physics.add.group({ allowGravity: false });

    scene.physics.add.overlap(target.sprite, this.#group, (_player, icicle) => {
      if (!icicle.getData('falling')) return;
      target.hitByContact(ProjectileEffect.NONE);
      this.#shatter(icicle);
    });
  }

  /**
   * Solta uma chuva de pinos em posições sorteadas (alguns perto do jogador).
   * @param {number} count
   * @param {number} targetX posição do jogador (um pino sempre mira nele)
   */
  rain(count, targetX) {
    const cfg = GameSettings.POLAR_BEAR.ICICLES;
    for (let i = 0; i < count; i++) {
      const x = i === 0
        ? Phaser.Math.Clamp(targetX + Phaser.Math.Between(-30, 30), this.#arena.left + 30, this.#arena.right - 30)
        : Phaser.Math.Between(this.#arena.left + 30, this.#arena.right - 30);
      this.#scene.time.delayedCall(i * cfg.STAGGER_MS, () => this.#spawn(x));
    }
  }

  #spawn(x) {
    const cfg = GameSettings.POLAR_BEAR.ICICLES;
    const icicle = this.#group.get(x, cfg.START_Y, FxTextureKeys.ICICLE);
    if (!icicle) return;
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

  /** Estilhaça: pedacinhos de gelo e some. */
  #shatter(icicle) {
    icicle.setData('falling', false);
    this.#snow(icicle.x, Math.min(icicle.body.bottom, GameSettings.LEVEL.GROUND_TOP) - 4, 12);
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

  destroy() {
    this.#group.destroy(true);
  }
}
