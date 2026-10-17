/**
 * log_gator_enemy.js
 * -----------------------------------------------------------------------------
 * Jacaré-Tronco (pântano): boia na lagoa igualzinho a um TRONCO com musgo,
 * indo e voltando devagar — e dá para usar de ponte, pisando em cima. Mas
 * pisar nele ACORDA o bicho: abre os olhos e treme (hora de pular fora!),
 * depois afunda de repente, derrubando quem estiver em cima na água, e sai
 * nadando atrás do jogador mordendo. Um tempo depois volta a dormir.
 * Dormindo (tronco) nada acerta nele e encostar não machuca.
 *
 *   TRONCO ──(pisaram)──▶ ACORDANDO ──(aviso)──▶ ACORDADO ──(tempo)──▶ TRONCO
 * -----------------------------------------------------------------------------
 */
const LogGatorState = Object.freeze({
  LOG: 'LOG',
  WAKING: 'WAKING',
  AWAKE: 'AWAKE'
});

class LogGatorEnemy extends Enemy {
  #lake;
  #homeX;
  #direction = 1;
  #state = LogGatorState.LOG;
  #stateEndsAt = 0;

  /**
   * @param {Phaser.Scene} scene
   * @param {number} x precisa estar sobre uma lagoa (WATER)
   * @param {number} y (ignorado: boia na superfície)
   * @param {object} type
   * @param {MatchConfig} match
   * @param {Phaser.Events.EventEmitter} eventBus
   * @param {LevelMap} levelMap onde fica a lagoa
   */
  constructor(scene, x, y, type, match, eventBus, levelMap) {
    const lake = SwimmerEnemy.lakeAt(levelMap, x);
    super(scene, x, lake.surfaceY + type.FLOAT_Y, type, match, eventBus);
    this.#lake = lake;
    this.#homeX = x;
    this.setTextureIfChanged(type.LOG_FRAME);
    const body = this.sprite.body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    // pisável só por cima, como uma ilha (por baixo e dos lados passa)
    body.checkCollision.down = false;
    body.checkCollision.left = false;
    body.checkCollision.right = false;
  }

  /** @override O desenho depende do estado (tronco / acordado). */
  get cyclesFrames() {
    return false;
  }

  /** Dá para ficar em pé em cima? (só enquanto ele parece um tronco) */
  get isStandable() {
    return this.isActive && this.#state !== LogGatorState.AWAKE;
  }

  /** @override Tronco não apanha (e encostar não machuca). */
  get canBeHit() {
    return super.canBeHit && this.#state === LogGatorState.AWAKE;
  }

  /** Alguém pisou no tronco: ele acorda (abre os olhos e treme antes de afundar). */
  onStoodOn() {
    if (this.#state !== LogGatorState.LOG) return;
    this.#state = LogGatorState.WAKING;
    this.#stateEndsAt = this.scene.time.now + this.type.WAKE_WARNING_MS;
    this.setTextureIfChanged(this.type.FRAMES[0]);
  }

  /** @override */
  behave(time, player) {
    switch (this.#state) {
      case LogGatorState.LOG:
        this.#drift();
        break;
      case LogGatorState.WAKING:
        this.sprite.setVelocityX(0);
        this.sprite.setAngle(Math.sin(time * 0.06) * 4); // tremendo
        if (time >= this.#stateEndsAt) this.#wake(time);
        break;
      case LogGatorState.AWAKE:
        this.#hunt(player);
        if (time >= this.#stateEndsAt) this.#fallAsleep();
        break;
    }
    this.#float(time);
  }

  /** @override Fora da câmera fica parado boiando. */
  sleep() {
    if (this.isActive) this.sprite.setVelocity(0, 0);
  }

  /** Tronco: vai e volta devagar em volta do lugar onde nasceu. */
  #drift() {
    const range = this.type.DRIFT_RANGE;
    if (this.x <= this.#homeX - range) this.#direction = 1;
    else if (this.x >= this.#homeX + range) this.#direction = -1;
    this.sprite.setVelocityX(this.#direction * this.speed);
  }

  /** Afunda de repente (quem estava em cima cai na água) e sai mordendo. */
  #wake(time) {
    this.#state = LogGatorState.AWAKE;
    this.#stateEndsAt = time + this.type.AWAKE_MS;
    this.sprite.setAngle(0);
    WaterSplash.at(this.scene, this.x, this.#lake.surfaceY, 16);
  }

  /** Acordado: nada atrás do jogador (sem sair da lagoa). */
  #hunt(player) {
    const margin = this.sprite.displayWidth / 2;
    const targetX = Phaser.Math.Clamp(player.x, this.#lake.left + margin, this.#lake.right - margin);
    const toTarget = targetX - this.x;
    this.sprite.setVelocityX(Math.abs(toTarget) > 6 ? Math.sign(toTarget) * this.type.HUNT_SPEED : 0);
    if (Math.abs(toTarget) > 6) this.sprite.setFlipX(toTarget > 0); // a arte olha para a esquerda
  }

  /** Volta a ser tronco (e a boiar na altura de antes). */
  #fallAsleep() {
    this.#state = LogGatorState.LOG;
    this.setTextureIfChanged(this.type.LOG_FRAME);
    this.sprite.setFlipX(false);
  }

  /** Boia: tronco na superfície; acordado, mais fundo (só a cabeça para fora). */
  #float(time) {
    const type = this.type;
    const floatY = this.#state === LogGatorState.AWAKE ? type.AWAKE_FLOAT_Y : type.FLOAT_Y;
    const targetY = this.#lake.surfaceY + floatY + Math.sin(time * type.WAVE_SPEED) * type.WAVE_AMPLITUDE;
    this.sprite.setVelocityY((targetY - this.y) * 6);
  }
}
