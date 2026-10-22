/**
 * hammer_attack.js
 * -----------------------------------------------------------------------------
 * Ataque do VIKING:
 *   - com o martelo na mão: ARREMESSA (ele voa girando, acerta quem estiver
 *     no caminho e, ao cair, faz um tremor — veja ThrownHammer);
 *   - sem o martelo: SOQUINHO, bem mais fraco e só de perto (mas dá dano!).
 * Para ter o martelo de volta é só passar por cima dele.
 * -----------------------------------------------------------------------------
 */
class HammerAttack extends PlayerAttack {
  #hammer;

  /**
   * @param {Player} player
   * @param {InputController} input
   */
  constructor(player, input) {
    const cfg = GameSettings.HAMMER_ATTACK;
    super(player, input, { cooldownMs: cfg.COOLDOWN_MS, poseDurationMs: cfg.POSE_DURATION_MS });
    this.#hammer = new ThrownHammer(player);
  }

  /** O martelo (o especial chama ele de volta). */
  get hammer() {
    return this.#hammer;
  }

  /** @override Arremessa o martelo ou, sem ele, dá um soquinho. */
  perform(combat) {
    const direction = this.player.facingRight ? 1 : -1;
    if (this.#hammer.isHeld) this.#hammer.throw(direction);
    else this.#punch(combat, direction);
  }

  /** @override Martelo x alvos e martelo x terreno. */
  bindCollisions(combat, levelMap) {
    this.#hammer.bind(combat, levelMap);
  }

  /** @override O martelo segue girando, esperando no chão ou voltando mesmo com o viking fora. */
  updateProjectiles() {
    this.#hammer.update();
  }

  /** Soco: só o que estiver colado na frente dele. */
  #punch(combat, direction) {
    const cfg = GameSettings.HAMMER_ATTACK.PUNCH;
    const player = this.player;
    combat.targets.forEach(target => {
      const inFront = Math.sign(target.x - player.x) === direction || Math.abs(target.x - player.x) < 12;
      if (target !== player && inFront && target.distanceFrom(player) < target.meleeReach * cfg.REACH_RATIO) {
        target.takeHit(player, cfg.DAMAGE);
      }
    });
    // "pow" no punho
    const scene = player.scene;
    const pow = scene.add.image(player.x + direction * cfg.POW_X, player.y + cfg.POW_Y, FxTextureKeys.GLOW)
      .setScale(0.12).setTint(0xfff4d0).setDepth(GameSettings.PLAYER.DEPTH + 0.1);
    scene.tweens.add({ targets: pow, scale: 0.32, alpha: 0, duration: 140, onComplete: () => pow.destroy() });
  }
}
