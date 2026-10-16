/**
 * eagle_enemy.js
 * -----------------------------------------------------------------------------
 * Águia (bicho raro). Uma pequena máquina de estados:
 *
 *   SOAR ──(do nada, se o jogador estiver perto)──▶ WARN ──▶ DIVE ──▶ GROUNDED
 *
 *   SOAR     voa bem alto, planando de um lado para o outro e soltando um
 *            OVO de vez em quando (cai devagar, seguindo o embalo do voo)
 *   WARN     "grito": para no ar piscando, um instante antes do mergulho
 *   DIVE     mergulha em linha reta na direção do jogador, de asas fechadas
 *   GROUNDED depois de bater no chão fica andando desajeitada e FRACA
 *            (vida reduzida: morre com um golpe ou uma pisada) — e não
 *            solta mais ovos
 * -----------------------------------------------------------------------------
 */
const EagleState = Object.freeze({
  SOAR: 'SOAR',
  WARN: 'WARN',
  DIVE: 'DIVE',
  GROUNDED: 'GROUNDED'
});

class EagleEnemy extends Enemy {
  #levelMap;
  #eggs;
  #nextEggTime = 0;
  #state = EagleState.SOAR;
  #homeX;
  #soarY;
  #direction = -1;
  #stateEndsAt = 0;
  #nextDiveCheck = 0;
  #frameIndex = 0;
  #nextFrameTime = 0;

  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y altura em que voa
   * @param {object} type
   * @param {MatchConfig} match
   * @param {Phaser.Events.EventEmitter} eventBus
   * @param {LevelMap} levelMap para andar no chão sem cair nos buracos
   * @param {EggPool} eggs de onde saem os ovos
   */
  constructor(scene, x, y, type, match, eventBus, levelMap, eggs) {
    super(scene, x, y, type, match, eventBus);
    this.#levelMap = levelMap;
    this.#eggs = eggs;
    this.#nextEggTime = scene.time.now + this.#eggInterval();
    this.#homeX = x;
    this.#soarY = y;
    this.sprite.body.setAllowGravity(false);
    this.#nextDiveCheck = scene.time.now + Phaser.Math.Between(0, type.DIVE_CHECK_MS * 2);
  }

  /** @override A águia escolhe os próprios quadros conforme o estado. */
  get cyclesFrames() {
    return false;
  }

  /** @override */
  behave(time, player) {
    switch (this.#state) {
      case EagleState.SOAR:     this.#soar(time, player); break;
      case EagleState.WARN:     this.#warn(time, player); break;
      case EagleState.DIVE:     this.#dive(time); break;
      case EagleState.GROUNDED: this.#walk(time); break;
    }
  }

  /** @override */
  sleep() {
    if (!this.isActive) return;
    if (this.#state === EagleState.GROUNDED) this.sprite.setVelocityX(0);
    else this.sprite.setVelocity(0, 0);
  }

  /** Voa lá no alto, indo e voltando, e às vezes decide mergulhar. */
  #soar(time, player) {
    const type = this.type;
    const sprite = this.sprite;
    if (this.x < this.#homeX - type.PATROL_RANGE) this.#direction = 1;
    if (this.x > this.#homeX + type.PATROL_RANGE) this.#direction = -1;

    const targetY = this.#soarY + Math.sin(time * 0.002) * 12;
    sprite.setVelocity(this.#direction * this.speed, (targetY - this.y) * 3);
    sprite.setFlipX(this.#direction > 0); // a arte olha para a esquerda
    sprite.setRotation(0);
    this.#animate(time, type.FRAMES);
    this.#dropEggs(time);

    if (time < this.#nextDiveCheck) return;
    this.#nextDiveCheck = time + type.DIVE_CHECK_MS;
    const playerNear = Math.abs(player.x - this.x) < type.DIVE_TRIGGER_X;
    if (playerNear && RandomUtils.chance(type.DIVE_CHANCE_PERCENT)) {
      this.#state = EagleState.WARN;
      this.#stateEndsAt = time + type.DIVE_WARNING_MS;
    }
  }

  /** Solta um ovo de tempos em tempos (só enquanto voa lá no alto). */
  #dropEggs(time) {
    if (time < this.#nextEggTime) return;
    this.#nextEggTime = time + this.#eggInterval();

    const egg = this.type.EGG;
    const vx = this.sprite.body.velocity.x * egg.KEEP_MOMENTUM;
    const dropped = this.#eggs.spawn(this.x, this.y + this.sprite.displayHeight * 0.3, egg.TEXTURE, 0, 0);
    if (dropped) dropped.setVelocity(vx, 0); // começa parado na vertical e vai caindo
  }

  #eggInterval() {
    const { MIN, MAX } = this.type.EGG.INTERVAL_MS;
    return Phaser.Math.Between(MIN, MAX);
  }

  /** Para no ar piscando ("grito") e então mergulha. */
  #warn(time, player) {
    const sprite = this.sprite;
    sprite.setVelocity(0, 0);
    if (Math.floor(time / 60) % 2 === 0) sprite.setTint(0xff6060);
    else this.restoreTint();
    if (time < this.#stateEndsAt) return;

    // Mergulho: asas fechadas, bico apontando para o jogador
    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    const speed = this.type.DIVE_SPEED;
    this.restoreTint();
    this.setTextureIfChanged(this.type.DIVE_FRAME);
    sprite.setFlipX(false);
    sprite.setRotation(angle - Math.PI); // a arte olha para a esquerda (PI)
    sprite.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    this.#state = EagleState.DIVE;
    this.#stateEndsAt = time + this.type.DIVE_MAX_MS;
  }

  /** Desce até bater no chão (ou cansar e cair). */
  #dive(time) {
    const body = this.sprite.body;
    if (body.blocked.down || body.touching.down || time > this.#stateEndsAt) this.#land();
  }

  /** Pousou: passa a andar no chão, fraquinha. */
  #land() {
    const sprite = this.sprite;
    this.#state = EagleState.GROUNDED;
    this.#direction = sprite.body.velocity.x > 0 ? 1 : -1;
    sprite.setRotation(0);
    sprite.setVelocity(0, 0);
    sprite.body.setAllowGravity(true);
    this.setTextureIfChanged(this.type.GROUND_FRAMES[0]);
    sprite.body.setSize(sprite.frame.realWidth * 0.8, sprite.frame.realHeight * 0.9, true);
    this.weakenTo(this.type.GROUND_HP);
  }

  /** Anda devagar, virando nas paredes e nas beiradas. */
  #walk(time) {
    const sprite = this.sprite;
    const body = sprite.body;
    const lookahead = GameSettings.ENEMY.LEDGE_LOOKAHEAD;

    if (body.blocked.left) this.#direction = 1;
    else if (body.blocked.right) this.#direction = -1;
    else if (body.blocked.down) {
      const aheadX = this.#direction > 0 ? body.right + lookahead : body.left - lookahead;
      if (!this.#levelMap.hasFloorAt(aheadX, body.bottom)) this.#direction *= -1;
    }

    sprite.setVelocityX(this.#direction * this.type.GROUND_SPEED);
    sprite.setFlipX(this.#direction > 0);
    this.#animate(time, this.type.GROUND_FRAMES);
  }

  /** Alterna os quadros de uma animação. */
  #animate(time, frames) {
    if (time < this.#nextFrameTime) return;
    this.#nextFrameTime = time + this.type.FRAME_MS;
    this.#frameIndex = (this.#frameIndex + 1) % frames.length;
    this.setTextureIfChanged(frames[this.#frameIndex]);
  }
}
