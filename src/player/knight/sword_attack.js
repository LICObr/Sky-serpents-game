/**
 * sword_attack.js
 * -----------------------------------------------------------------------------
 * Golpe de espada do Guerreiro: atinge todos os alvos dentro do alcance
 * (cada alvo define o próprio alcance — um dragão grande é mais fácil de
 * acertar do que um slime pequeno).
 * -----------------------------------------------------------------------------
 */
class SwordAttack extends PlayerAttack {
  /**
   * @param {Player} player
   * @param {InputController} input
   */
  constructor(player, input) {
    const cfg = GameSettings.SWORD_ATTACK;
    super(player, input, { cooldownMs: cfg.COOLDOWN_MS, poseDurationMs: cfg.POSE_DURATION_MS });
  }

  /** @override */
  perform(combat) {
    const player = this.player;
    combat.targets.forEach(target => {
      if (target !== player && target.distanceFrom(player) < target.meleeReach) {
        target.takeHit(player, GameSettings.SWORD_ATTACK.DAMAGE);
      }
    });
  }
}
