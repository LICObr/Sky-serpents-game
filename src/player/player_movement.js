/**
 * player_movement.js
 * -----------------------------------------------------------------------------
 * Responsável por TODA a locomoção do jogador: andar, pular, agachar e o
 * pequeno "balanço" ao caminhar. A velocidade vem do personagem escolhido
 * e pode ser reduzida por efeitos (ex.: gelo).
 * -----------------------------------------------------------------------------
 */
class PlayerMovement {
  #player;
  #input;
  #isDucking = false;
  #shakeStep = 0;
  #lastGroundedAt = 0;

  /**
   * @param {Player} player dono deste componente
   * @param {InputController} input
   */
  constructor(player, input) {
    this.#player = player;
    this.#input = input;
  }

  get isDucking() {
    return this.#isDucking;
  }

  /** Executa a movimentação do frame atual. */
  update() {
    const sprite = this.#player.sprite;
    const now = this.#player.scene.time.now;
    if (sprite.body.blocked.down) this.#lastGroundedAt = now;

    // Enquanto agachado o jogador não anda nem pula
    if (this.#handleDuck(sprite)) return;

    this.#applyWalkShake(sprite);
    this.#handleHorizontal(sprite);
    this.#handleJump(sprite, now);
  }

  /** Cancela o agachamento (ex.: ao renascer no checkpoint). */
  reset() {
    if (this.#isDucking) this.#player.setDuckVisual(false);
    this.#isDucking = false;
  }

  /**
   * Agacha/levanta o jogador.
   * @returns {boolean} true se está agachado neste frame
   */
  #handleDuck(sprite) {
    const wantsToDuck = this.#input.isDuckHeld() && sprite.body.blocked.down;

    if (wantsToDuck) {
      if (!this.#isDucking) {
        this.#player.setDuckVisual(true); // desce o desenho (a hitbox fica)
        this.#isDucking = true;
      }
      sprite.setVelocityX(0);
      this.#player.showPose(PlayerPose.DUCK);
      return true;
    }

    if (this.#isDucking) {
      this.#player.setDuckVisual(false);
      this.#isDucking = false;
      this.#player.showPose(PlayerPose.STAND);
    }
    return false;
  }

  /** Leve oscilação vertical enquanto caminha no chão. */
  #applyWalkShake(sprite) {
    if (!this.#input.isLeftHeld() && !this.#input.isRightHeld()) return;
    if (!sprite.body.blocked.down) return;

    const { SHAKE_FREQUENCY, SHAKE_AMPLITUDE } = GameSettings.PLAYER;
    this.#shakeStep++;
    sprite.y += Math.sin(this.#shakeStep * SHAKE_FREQUENCY) * SHAKE_AMPLITUDE;
  }

  /** Andar para a esquerda/direita. */
  #handleHorizontal(sprite) {
    const speed = this.#player.character.WALK_SPEED * this.#player.status.speedMultiplier;

    if (this.#input.isLeftHeld()) {
      sprite.setVelocityX(-speed);
      this.#player.face(false);
      this.#player.showPose(PlayerPose.STAND);
    } else if (this.#input.isRightHeld()) {
      sprite.setVelocityX(speed);
      this.#player.face(true);
      this.#player.showPose(PlayerPose.STAND);
    } else {
      sprite.setVelocityX(0);
    }
  }

  /**
   * Pulo: permitido com os pés no chão ou logo depois de sair dele
   * ("coyote time" — evita falhar o pulo ao descer degraus de rampa).
   */
  #handleJump(sprite, now) {
    const grounded = now - this.#lastGroundedAt <= GameSettings.PLAYER.COYOTE_TIME_MS;
    const goingUp = sprite.body.velocity.y < 0;
    if (this.#input.isJumpHeld() && grounded && !goingUp) {
      sprite.setVelocityY(GameSettings.PLAYER.JUMP_VELOCITY);
      this.#lastGroundedAt = 0; // não deixa pular duas vezes no mesmo instante
    }
  }
}
