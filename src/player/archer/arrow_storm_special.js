/**
 * arrow_storm_special.js
 * -----------------------------------------------------------------------------
 * Especial da ARQUEIRA — "Tempestade de Flechas": um LEQUE de flechas só
 * para a frente (de reto para cima até reto para baixo, nada para trás),
 * em duas ondas que se intercalam: juntas cobrem o leque por igual. Cada
 * flecha é igual a um tiro comum (mesma velocidade e dano).
 * -----------------------------------------------------------------------------
 */
class ArrowStormSpecial extends PlayerSpecial {
  #bow;

  /**
   * @param {Player} player
   * @param {InputController} input
   * @param {BowAttack} bow arco da arqueira (de onde saem as flechas)
   */
  constructor(player, input, bow) {
    super(player, input);
    this.#bow = bow;
  }

  /** @override */
  get name() { return 'Tempestade de Flechas'; }

  /** @override Duas ondas de flechas em leque, para a frente. */
  start() {
    const cfg = GameSettings.SPECIAL.ARROW_STORM;
    const step = cfg.FAN_DEG / (cfg.ARROWS * cfg.WAVES); // espaço entre as flechas das duas ondas juntas
    const player = this.player;

    player.showPose(PlayerPose.ATTACK);
    player.scene.cameras.main.shake(200, 0.005);

    for (let wave = 0; wave < cfg.WAVES; wave++) {
      player.scene.time.delayedCall(wave * cfg.WAVE_DELAY_MS, () => {
        if (!player.isAlive) return;
        SoundFx.play(player.scene, SoundKeys.ARROW_STORM);
        for (let i = 0; i < cfg.ARROWS; i++) {
          // negativo = para cima; as ondas se alternam: 1ª, 2ª, 1ª, 2ª...
          const degrees = -cfg.FAN_DEG / 2 + (wave + i * cfg.WAVES + 0.5) * step;
          this.#bow.fireArrow(this.#forward(Phaser.Math.DegToRad(degrees)));
        }
      });
    }
    player.scene.time.delayedCall(cfg.WAVES * cfg.WAVE_DELAY_MS, () => {
      if (player.isAlive) player.showPose(PlayerPose.STAND);
    });
  }

  /** Ângulo medido a partir da frente da arqueira (virada para a esquerda, espelha). */
  #forward(radians) {
    return this.player.facingRight ? radians : Math.PI - radians;
  }
}
