/**
 * player_movement.js
 * -----------------------------------------------------------------------------
 * Responsável por TODA a locomoção do jogador: andar (com os quadros da
 * caminhada), pular, agachar e NADAR (lagoas do pântano). A velocidade vem
 * do personagem escolhido e pode ser reduzida por efeitos (gelo, água, lama).
 * Quem tem AIR_JUMPS (o ninja) ainda pula de novo no ar: pulo duplo.
 * -----------------------------------------------------------------------------
 */
class PlayerMovement {
  #player;
  #input;
  #isDucking = false;
  #lastGroundedAt = 0;
  #swimmingSince = null; // quando caiu na água (null = fora da água)
  #airJumpsLeft = 0;     // pulos que ainda dá para dar no ar (pulo duplo)
  #jumpWasHeld = false;  // para o pulo no ar precisar de uma nova apertada

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
    if (sprite.body.blocked.down) {
      this.#lastGroundedAt = now;
      this.#airJumpsLeft = this.#player.character.AIR_JUMPS || 0;
    }
    const jumpHeld = this.#input.isJumpHeld();
    const jumpPressed = jumpHeld && !this.#jumpWasHeld;
    this.#jumpWasHeld = jumpHeld;

    // Enquanto agachado o jogador não anda nem pula
    if (this.#handleDuck(sprite)) return;

    this.#handleHorizontal(sprite, now);
    this.#handleJump(sprite, now, jumpPressed);
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

  /** Andar para a esquerda/direita: no chão mostra os quadros da caminhada. */
  #handleHorizontal(sprite, now) {
    const speed = this.#player.character.WALK_SPEED * this.#player.status.speedMultiplier;

    if (this.#input.isLeftHeld()) {
      sprite.setVelocityX(-speed);
      this.#player.face(false);
    } else if (this.#input.isRightHeld()) {
      sprite.setVelocityX(speed);
      this.#player.face(true);
    } else {
      sprite.setVelocityX(0);
    }

    // No ar: pose de pulo/queda (um instante de folga para não piscar ao descer
    // degraus de rampa); no chão: quadros da caminhada ou a pose parada
    const airborne = now - this.#lastGroundedAt > GameSettings.PLAYER.AIR_POSE_DELAY_MS;
    if (airborne) this.#player.showAirPose();
    else if (sprite.body.velocity.x !== 0) this.#player.walk(now);
    else this.#player.stopWalking();
  }

  /**
   * Pulo: permitido com os pés no chão ou logo depois de sair dele
   * ("coyote time" — evita falhar o pulo ao descer degraus de rampa).
   * Pulo duplo: no ar, uma NOVA apertada pula de novo (se ainda tiver pulo).
   */
  #handleJump(sprite, now, jumpPressed) {
    if (this.#player.status.isSwimming) {
      this.#swim(sprite, now);
      return;
    }
    this.#swimmingSince = null;
    const grounded = now - this.#lastGroundedAt <= GameSettings.PLAYER.COYOTE_TIME_MS;
    const goingUp = sprite.body.velocity.y < 0;
    if (this.#input.isJumpHeld() && grounded && !goingUp) {
      sprite.setVelocityY(GameSettings.PLAYER.JUMP_VELOCITY * this.#player.status.jumpMultiplier);
      this.#lastGroundedAt = 0; // não deixa pular duas vezes no mesmo instante
      SoundFx.play(this.#player.scene, SoundKeys.JUMP, { volume: 0.5 });
    } else if (jumpPressed && !grounded && this.#airJumpsLeft > 0) {
      this.#airJumpsLeft--;
      const { VELOCITY_MULTIPLIER } = GameSettings.PLAYER.AIR_JUMP;
      sprite.setVelocityY(GameSettings.PLAYER.JUMP_VELOCITY * VELOCITY_MULTIPLIER * this.#player.status.jumpMultiplier);
      this.#player.playAirJump();
      SoundFx.play(this.#player.scene, SoundKeys.AIR_JUMP, { volume: 0.6 });
    }
  }

  /**
   * Nadando: segurando pular, nada para cima DEVAGAR (solto, afunda devagar).
   * Perto da superfície o pulo é o normal, para sair da água — mas só depois
   * de um tempinho dentro dela.
   */
  #swim(sprite, now) {
    const cfg = GameSettings.SWIM;
    if (this.#swimmingSince === null) this.#swimmingSince = now;
    if (!this.#input.isJumpHeld()) return;
    const nearSurface = this.#player.status.waterDepth < cfg.SURFACE_JUMP_DEPTH;
    const settled = now - this.#swimmingSince >= cfg.SURFACE_JUMP_DELAY_MS;
    if (nearSurface && settled) {
      sprite.setVelocityY(GameSettings.PLAYER.JUMP_VELOCITY);
      this.#swimmingSince = null;
    } else if (!nearSurface || settled) {
      sprite.setVelocityY(-cfg.SWIM_UP_SPEED);
    }
  }
}
