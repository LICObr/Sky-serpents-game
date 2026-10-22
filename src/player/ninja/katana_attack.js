/**
 * katana_attack.js
 * -----------------------------------------------------------------------------
 * Katana do NINJA: golpe RÁPIDO, só no que estiver na frente dele, com um
 * risco branco em meia-lua. É FURTIVO: o primeiro golpe em cada bicho (pego
 * de surpresa) vale o dobro — e, escondido na fumaça (especial), todos valem.
 * -----------------------------------------------------------------------------
 */
class KatanaAttack extends PlayerAttack {
  #struck = new WeakSet(); // quem já levou um golpe (não é mais surpresa)
  #ambushUntil = 0;        // escondido na fumaça até este momento: todo golpe é furtivo

  /**
   * @param {Player} player
   * @param {InputController} input
   */
  constructor(player, input) {
    const cfg = GameSettings.KATANA_ATTACK;
    super(player, input, { cooldownMs: cfg.COOLDOWN_MS, poseDurationMs: cfg.POSE_DURATION_MS });
  }

  /**
   * Todos os golpes são furtivos por um tempo (bomba de fumaça).
   * @param {number} ms
   */
  ambushFor(ms) {
    this.#ambushUntil = this.player.scene.time.now + ms;
  }

  /** @override Corta o que estiver na frente (furtivo: dano dobrado). */
  perform(combat) {
    const cfg = GameSettings.KATANA_ATTACK;
    const player = this.player;
    const direction = player.facingRight ? 1 : -1;
    const hidden = player.scene.time.now < this.#ambushUntil;
    SoundFx.play(player.scene, SoundKeys.KATANA, { volume: 0.8 });
    combat.targets.forEach(target => {
      const inFront = Math.sign(target.x - player.x) === direction || Math.abs(target.x - player.x) < 14;
      if (!player.canStrike(target) || !inFront || target.distanceFrom(player) >= target.meleeReach) return;
      const sneaky = hidden || !this.#struck.has(target);
      this.#struck.add(target);
      target.takeHit(player, sneaky ? cfg.DAMAGE * cfg.SNEAK_MULTIPLIER : cfg.DAMAGE);
      if (sneaky) this.#sneakFlash(target);
    });
    this.#slash(direction);
  }

  /** Risco branco em meia-lua na frente dele. */
  #slash(direction) {
    const player = this.player;
    const scene = player.scene;
    const arc = scene.add.graphics({ x: player.x, y: player.y + 2 }).setDepth(GameSettings.PLAYER.DEPTH + 0.2);
    arc.lineStyle(5, 0xffffff, 0.85).beginPath().arc(0, 0, 24, -1.2, 0.9).strokePath();
    arc.lineStyle(2, 0xbfe4ff, 0.9).beginPath().arc(0, 0, 18, -1.0, 0.7).strokePath();
    arc.setScale(direction, 1); // virado para a esquerda: espelha
    scene.tweens.add({
      targets: arc, alpha: 0, scaleX: direction * 1.25, scaleY: 1.25, duration: 130, onComplete: () => arc.destroy()
    });
  }

  /** Golpe furtivo: brilho dourado no alvo. */
  #sneakFlash(target) {
    const scene = this.player.scene;
    const flash = scene.add.image(target.x, target.y, FxTextureKeys.GLOW)
      .setScale(0.2).setTint(0xffe066).setDepth(GameSettings.PLAYER.DEPTH + 0.2);
    scene.tweens.add({ targets: flash, scale: 0.6, alpha: 0, duration: 200, onComplete: () => flash.destroy() });
  }
}
