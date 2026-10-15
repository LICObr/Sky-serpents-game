/**
 * arrow_storm_special.js
 * -----------------------------------------------------------------------------
 * Especial da ARQUEIRA — "Tempestade de Flechas": dispara flechas para
 * TODAS as direções (cima, baixo, lados e diagonais) de uma vez, em duas
 * ondas (a segunda defasada, fechando os espaços entre as flechas).
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

  /** @override Duas ondas de flechas ao redor da arqueira. */
  start() {
    const cfg = GameSettings.SPECIAL.ARROW_STORM;
    const step = (Math.PI * 2) / cfg.ARROWS;
    const player = this.player;

    player.showPose(PlayerPose.ATTACK);
    player.scene.cameras.main.shake(200, 0.005);

    for (let wave = 0; wave < cfg.WAVES; wave++) {
      player.scene.time.delayedCall(wave * cfg.WAVE_DELAY_MS, () => {
        if (!player.isAlive) return;
        const offset = wave * step / 2;
        for (let i = 0; i < cfg.ARROWS; i++) this.#bow.fireArrow(offset + step * i);
      });
    }
    player.scene.time.delayedCall(cfg.WAVES * cfg.WAVE_DELAY_MS, () => {
      if (player.isAlive) player.showPose(PlayerPose.STAND);
    });
  }
}
