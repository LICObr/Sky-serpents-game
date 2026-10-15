/**
 * dragon_animation.js
 * -----------------------------------------------------------------------------
 * Animações do dragão, como uma pequena máquina de estados. Cada estado
 * toca um clipe da folha de animação (GameSettings.DRAGON_ANIMATION.STATE_CLIPS):
 *
 *   FLY      pairando ............ "parado"
 *   ASCEND   subindo ............. "voando para cima"
 *   DIVE     descendo/mergulhando  "voando para baixo"
 *   ATTACK   tiro comum .......... "ataque (sopro de fogo)"
 *   SPECIAL  poder especial ...... "de frente", abrindo as asas
 *   HURT     levou dano .......... "pulo/impulso" + pisca branco + tela treme
 *   DEATH    morrendo ............ "morrendo" e depois some
 *
 * FLY/ASCEND/DIVE são escolhidos pela velocidade vertical. ATTACK, SPECIAL e
 * HURT são "golpes": tocam por cima do movimento até terminarem.
 *
 * Direção: o DragonMovement informa para onde ele está indo (setFacing) e
 * aqui o sprite é espelhado conforme o lado para o qual cada clipe foi
 * desenhado na sprite sheet.
 * -----------------------------------------------------------------------------
 */
const DragonAnimState = Object.freeze({
  FLY: 'FLY',
  ASCEND: 'ASCEND',
  DIVE: 'DIVE',
  ATTACK: 'ATTACK',
  SPECIAL: 'SPECIAL',
  HURT: 'HURT',
  DEATH: 'DEATH'
});

class DragonAnimation {
  #dragon;
  #sheetKey;
  #state = DragonAnimState.FLY;
  #facingRight = false;
  #busyUntil = 0;   // até quando um "golpe" (ataque, dano...) ocupa a animação
  #candidate = null;      // pose de voo "candidata" (anti-pisca)
  #candidateSince = 0;

  /**
   * @param {DragonBoss} dragon dono deste componente
   * @param {string} sheetKey folha de animação (ex.: 'dragon_red')
   */
  constructor(dragon, sheetKey) {
    this.#dragon = dragon;
    this.#sheetKey = sheetKey;
    this.#play(DragonAnimState.FLY);
  }

  get state() { return this.#state; }
  get facingRight() { return this.#facingRight; }

  /** Para onde o dragão está olhando (definido pelo movimento ou pelo ataque). */
  setFacing(right) {
    this.#facingRight = right;
  }

  /** Está no meio de um ataque (não deve virar de costas para o jogador)? */
  get isAttacking() {
    return [DragonAnimState.ATTACK, DragonAnimState.SPECIAL].includes(this.#state)
      && this.#dragon.scene.time.now < this.#busyUntil;
  }

  /** Atualiza a pose (chamar a cada frame). */
  update(time) {
    if (this.#state === DragonAnimState.DEATH) return;

    if (time >= this.#busyUntil) this.#play(this.#stableMovementState(time));
    this.#applyFacing();
  }

  /** Tiro comum: "ataque (sopro de fogo)". */
  playAttack() {
    // Não interrompe o especial nem o dano
    if (this.#isBusyWith(DragonAnimState.SPECIAL, DragonAnimState.HURT, DragonAnimState.DEATH)) return;
    this.#playOnce(DragonAnimState.ATTACK);
  }

  /** Poder especial: fica de frente abrindo as asas. */
  playSpecial() {
    if (this.#isBusyWith(DragonAnimState.DEATH)) return;
    this.#play(DragonAnimState.SPECIAL);
    this.#busyUntil = this.#dragon.scene.time.now + GameSettings.DRAGON_ANIMATION.SPECIAL_MS;
  }

  /** Levou dano: impulso para trás, pisca branco e a tela treme. */
  playHurt() {
    if (this.#isBusyWith(DragonAnimState.DEATH)) return;
    const scene = this.#dragon.scene;
    const sprite = this.#dragon.sprite;

    this.#playOnce(DragonAnimState.HURT);
    sprite.setTintFill(0xffffff);
    scene.time.delayedCall(80, () => { if (sprite.active) sprite.clearTint(); });
    scene.cameras.main.shake(140, GameSettings.DRAGON_ANIMATION.HURT_SHAKE_PX / 1000);
  }

  /**
   * Morte: toca "morrendo", cai um pouco e some. Chama onComplete no final.
   * @param {Function} onComplete
   */
  playDeath(onComplete) {
    const sprite = this.#dragon.sprite;
    const scene = this.#dragon.scene;

    this.#play(DragonAnimState.DEATH);
    this.#applyFacing();
    scene.cameras.main.shake(400, 0.01);

    sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      scene.tweens.add({
        targets: sprite,
        alpha: 0,
        y: sprite.y + 40,
        duration: GameSettings.DRAGON_ANIMATION.DEATH_FADE_MS,
        onComplete
      });
    });
  }

  /** Só troca de pose de voo se a nova se mantiver por um tempinho (sem piscar). */
  #stableMovementState(time) {
    const wanted = this.#movementState();
    if (wanted !== this.#candidate) {
      this.#candidate = wanted;
      this.#candidateSince = time;
    }
    const isFlightState = [DragonAnimState.FLY, DragonAnimState.ASCEND, DragonAnimState.DIVE].includes(this.#state);
    if (isFlightState && time - this.#candidateSince < GameSettings.DRAGON_ANIMATION.MIN_CLIP_MS) return this.#state;
    return wanted;
  }

  /** Subindo, mergulhando ou voando reto? */
  #movementState() {
    const vy = this.#dragon.sprite.body.velocity.y;
    const threshold = GameSettings.DRAGON_ANIMATION.VERTICAL_THRESHOLD;
    if (vy < -threshold) return DragonAnimState.ASCEND;
    if (vy > threshold) return DragonAnimState.DIVE;
    return DragonAnimState.FLY;
  }

  /** Toca um clipe que roda uma vez e ocupa a animação até acabar. */
  #playOnce(state) {
    const clip = this.#play(state, true);
    this.#busyUntil = this.#dragon.scene.time.now + clip.duration;
  }

  /**
   * Toca o clipe do estado (se já não estiver tocando).
   * @param {boolean} restart recomeça mesmo se já estiver tocando
   * @returns {Phaser.Animations.Animation}
   */
  #play(state, restart = false) {
    const name = GameSettings.DRAGON_ANIMATION.STATE_CLIPS[state];
    const key = DragonSpriteSheets.clipKey(this.#sheetKey, name);
    this.#state = state;
    this.#dragon.sprite.play(key, !restart);
    return this.#dragon.scene.anims.get(key);
  }

  #isBusyWith(...states) {
    return states.includes(this.#state) && this.#dragon.scene.time.now < this.#busyUntil
      || this.#state === DragonAnimState.DEATH;
  }

  /** Espelha o sprite conforme o lado em que o clipe foi desenhado. */
  #applyFacing() {
    const clip = GameSettings.DRAGON_ANIMATION.STATE_CLIPS[this.#state];
    this.#dragon.sprite.setFlipX(this.#facingRight !== DragonSpriteSheets.facesRight(clip));
  }


}
