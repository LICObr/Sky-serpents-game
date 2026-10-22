/**
 * rapier_attack.js
 * -----------------------------------------------------------------------------
 * Florete do BARDO: ESTOCADA rápida para a frente, um pouco mais longe que a
 * espada do guerreiro (mas só no que estiver na frente), com um risco
 * brilhante na direção do golpe. É o ataque de todo dia — a nota encantada
 * é o especial.
 * -----------------------------------------------------------------------------
 */
class RapierAttack extends PlayerAttack {
  /**
   * @param {Player} player
   * @param {InputController} input
   */
  constructor(player, input) {
    const cfg = GameSettings.RAPIER_ATTACK;
    super(player, input, { cooldownMs: cfg.COOLDOWN_MS, poseDurationMs: cfg.POSE_DURATION_MS });
  }

  /** @override */
  perform(combat) {
    const cfg = GameSettings.RAPIER_ATTACK;
    const player = this.player;
    const direction = player.facingRight ? 1 : -1;
    combat.targets.forEach(target => {
      const inFront = Math.sign(target.x - player.x) === direction || Math.abs(target.x - player.x) < 12;
      if (target !== player && inFront && target.distanceFrom(player) < target.meleeReach * cfg.REACH_RATIO) {
        target.takeHit(player, cfg.DAMAGE);
      }
    });
    this.#streak(direction);
  }

  /** Risco brilhante que sai da ponta do florete e some. */
  #streak(direction) {
    const player = this.player;
    const scene = player.scene;
    const x = player.x + direction * 22;
    const streak = scene.add.rectangle(x, player.y + 1, 26, 2, 0xffffff, 0.9)
      .setOrigin(direction > 0 ? 0 : 1, 0.5).setDepth(GameSettings.PLAYER.DEPTH + 0.2);
    scene.tweens.add({ targets: streak, scaleX: 1.6, alpha: 0, duration: 120, onComplete: () => streak.destroy() });
  }
}
