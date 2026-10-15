/**
 * hopper_enemy.js
 * -----------------------------------------------------------------------------
 * Sapo saltador: fica sentado e, quando o jogador chega perto, pula em
 * arco na direção dele (de tempos em tempos). Mostra o quadro "sentado" no
 * chão e o quadro "pulando" no ar.
 * -----------------------------------------------------------------------------
 */
class HopperEnemy extends Enemy {
  #nextJumpTime = 0;

  /** @override O sapo escolhe o próprio quadro (sentado/pulando). */
  get cyclesFrames() {
    return false;
  }

  /** @override */
  behave(time, player) {
    const type = this.type;
    const sprite = this.sprite;
    const onGround = sprite.body.blocked.down;

    if (!onGround) {
      this.setTextureIfChanged(type.FRAMES[1]); // no ar: pernas esticadas
      return;
    }

    sprite.setVelocityX(0);
    this.setTextureIfChanged(type.FRAMES[0]); // sentado

    const playerNear = this.distanceFrom(player) < type.JUMP_RANGE;
    if (playerNear && time >= this.#nextJumpTime) {
      const direction = Math.sign(player.x - this.x) || 1;
      sprite.setVelocity(direction * this.speed, type.JUMP_VELOCITY);
      sprite.setFlipX(direction > 0);
      this.#nextJumpTime = time + type.JUMP_INTERVAL_MS;
    }
  }
}
