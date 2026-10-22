/**
 * dash_special.js
 * -----------------------------------------------------------------------------
 * Especial do GUERREIRO — "Investida": avança para a frente a 1,5x da
 * velocidade por meio segundo, causando DANO CONTÍNUO em tudo que estiver
 * no caminho (golpes rápidos e seguidos). Durante a investida ele não leva
 * dano e deixa um rastro de "fantasmas" para trás.
 * -----------------------------------------------------------------------------
 */
class DashSpecial extends PlayerSpecial {
  #direction = 1;
  #nextTickAt = 0;
  #nextGhostAt = 0;

  /** @override */
  get name() { return 'Investida'; }

  /** @override */
  get durationMs() { return GameSettings.SPECIAL.DASH.DURATION_MS; }

  /** @override Durante a investida o movimento é dela. */
  get controlsMovement() { return true; }

  /** @override */
  start() {
    const player = this.player;
    this.#direction = player.facingRight ? 1 : -1;
    this.#nextTickAt = 0;
    this.#nextGhostAt = 0;
    player.showPose(PlayerPose.ATTACK);
    player.health.grantInvulnerability(this.durationMs);
    player.scene.cameras.main.shake(this.durationMs, 0.004);
    SoundFx.play(player.scene, SoundKeys.DASH);
    player.scene.time.delayedCall(this.durationMs, () => {
      if (player.isAlive) player.showPose(PlayerPose.STAND); // fim da investida
    });
  }

  /** @override Avança, acerta quem estiver na frente e deixa rastro. */
  whileActive(combat, now) {
    const cfg = GameSettings.SPECIAL.DASH;
    const player = this.player;
    const speed = player.character.WALK_SPEED * cfg.SPEED_MULTIPLIER;
    player.sprite.setVelocityX(this.#direction * speed);
    player.showPose(PlayerPose.ATTACK);

    // Dano contínuo: um golpe a cada TICK_MS em todos os alvos ao alcance
    if (now >= this.#nextTickAt) {
      this.#nextTickAt = now + cfg.TICK_MS;
      combat.targets.forEach(target => {
        const inFront = Math.sign(target.x - player.x) === this.#direction || Math.abs(target.x - player.x) < 20;
        if (target !== player && inFront && target.distanceFrom(player) < cfg.REACH) target.takeHit(player, cfg.TICK_DAMAGE);
      });
    }

    if (now >= this.#nextGhostAt) {
      this.#nextGhostAt = now + cfg.GHOST_EVERY_MS;
      this.#leaveGhost();
    }
  }

  /** Cópia translúcida do guerreiro que some rapidinho (rastro da investida). */
  #leaveGhost() {
    const sprite = this.player.sprite;
    const ghost = sprite.scene.add.image(sprite.x, sprite.y, sprite.texture.key)
      .setScale(sprite.scaleX, sprite.scaleY)
      .setTint(0x9fd8ff)
      .setAlpha(0.55)
      .setDepth(sprite.depth - 0.1);
    sprite.scene.tweens.add({ targets: ghost, alpha: 0, duration: 260, onComplete: () => ghost.destroy() });
  }
}
