/**
 * bear_brain.js
 * -----------------------------------------------------------------------------
 * "Cérebro" do Urso Polar: uma MÁQUINA DE ESTADOS que decide o que o urso faz
 * e qual animação ele mostra em cada momento.
 *
 *   INTRO   → ruge ao começar a luta (tela treme)
 *   WALK    → anda atrás do jogador; VIRA de frente ao trocar de lado
 *   CROUCH  → agacha (aviso piscando) antes da investida ou do pulo
 *   DASH    → mini investidas rápidas (2, ou 3 quando bravo) e DERRAPA no fim
 *   JUMP    → pula em direção ao jogador; ao cair, a terra treme
 *   REAR    → levanta nas patas traseiras... → STOMP: PISA NO CHÃO e solta
 *             ondas de gelo para os dois lados (bravo: duas levas + pinos do céu)
 *   SLAM    → bate a pata: uma onda rápida só na direção do jogador
 *   THROW   → garrada que arremessa bolas de gelo (congelam o jogador)
 *   ROAR    → abaixo de metade da vida ele ruge e fica BRAVO (mais rápido e
 *             começam a cair pinos de gelo do céu)
 *
 * O dano só acontece no contato físico (encostar no urso / nas ondas).
 * -----------------------------------------------------------------------------
 */
const BearState = Object.freeze({
  INTRO: 'INTRO', IDLE: 'IDLE', WALK: 'WALK', TURN: 'TURN', CROUCH: 'CROUCH',
  DASH: 'DASH', DASH_PAUSE: 'DASH_PAUSE', SKID: 'SKID', JUMP: 'JUMP', LAND: 'LAND',
  REAR: 'REAR', STOMP: 'STOMP', SLAM: 'SLAM', THROW: 'THROW', ROAR: 'ROAR'
});

class BearBrain {
  #bear;
  #state = null;
  #stateStart = 0;
  #afterCrouch = null;     // o que fazer depois de agachar (DASH ou JUMP)
  #dashesLeft = 0;
  #nextActionAt = 0;
  #fired = {};             // gatilhos de "uma vez por estado" (onda, arremesso...)
  #angry = false;
  #lastAction = null;

  /** @param {PolarBearBoss} bear */
  constructor(bear) {
    this.#bear = bear;
    this.#enter(BearState.INTRO);
  }

  get state()   { return this.#state; }
  get isAngry() { return this.#angry; }

  /** Lógica do frame. */
  update(now) {
    const bear = this.#bear;
    const cfg = GameSettings.POLAR_BEAR;
    const t = now - this.#stateStart; // tempo no estado atual

    // Ficou bravo: ruge assim que estiver no chão
    if (!this.#angry && bear.health.ratio <= cfg.ANGRY_HP_RATIO && bear.isOnGround &&
        ![BearState.JUMP, BearState.STOMP, BearState.REAR].includes(this.#state)) {
      this.#angry = true;
      this.#enter(BearState.ROAR);
      return;
    }

    switch (this.#state) {
      case BearState.INTRO:
      case BearState.ROAR:
        bear.stop();
        if (this.#once('roar')) bear.roar();
        if (t >= cfg.ROAR_MS) this.#enter(BearState.IDLE);
        break;

      case BearState.IDLE:
        bear.stop();
        if (t >= cfg.IDLE_MS) this.#enter(BearState.WALK);
        break;

      case BearState.WALK:
        if (bear.wantsToTurn()) { this.#enter(BearState.TURN); break; }
        bear.walk(this.#speed());
        if (now >= this.#nextActionAt && bear.isOnGround) this.#chooseAction();
        break;

      case BearState.TURN:
        bear.stop();
        if (t >= cfg.TURN_MS) { bear.faceTarget(); this.#enter(BearState.WALK); }
        break;

      case BearState.CROUCH:
        bear.stop();
        if (t >= cfg.CROUCH_MS) {
          bear.setWarning(false);
          this.#enter(this.#afterCrouch);
        }
        break;

      case BearState.DASH:
        bear.dash(this.#speed() * cfg.DASH.SPEED_MULTIPLIER);
        if (t >= cfg.DASH.DURATION_MS) {
          this.#dashesLeft--;
          this.#enter(this.#dashesLeft > 0 ? BearState.DASH_PAUSE : BearState.SKID);
        }
        break;

      case BearState.DASH_PAUSE:
        bear.brake(0.6);
        if (t >= cfg.DASH.PAUSE_MS) { bear.faceTarget(); this.#enter(BearState.DASH); }
        break;

      case BearState.SKID:
        bear.brake(0.9);
        bear.skidSpray();
        if (t >= cfg.DASH.SKID_MS) this.#enter(BearState.IDLE);
        break;

      case BearState.JUMP:
        bear.updateJumpPose();
        if (t > 120 && bear.isOnGround) this.#enter(BearState.LAND);
        break;

      case BearState.LAND:
        bear.stop();
        if (this.#once('land')) bear.landImpact(this.#angry);
        if (t >= cfg.JUMP.LAND_MS) this.#enter(BearState.IDLE);
        break;

      case BearState.REAR:
        bear.stop();
        if (t >= cfg.QUAKE.REAR_MS) this.#enter(BearState.STOMP);
        break;

      case BearState.STOMP:
        bear.stop();
        if (t >= cfg.QUAKE.WAVE_AT_MS && this.#once('quake')) {
          bear.setWarning(false);
          bear.quake(this.#waveSpeed(), this.#angry);
        }
        if (this.#angry && t >= cfg.QUAKE.WAVE_AT_MS + cfg.QUAKE.SECOND_WAVE_MS && this.#once('quake2')) {
          bear.quake(this.#waveSpeed() * 1.2, false);
        }
        if (t >= cfg.QUAKE.STOMP_MS + (this.#angry ? cfg.QUAKE.SECOND_WAVE_MS : 0)) this.#enter(BearState.IDLE);
        break;

      case BearState.SLAM:
        bear.stop();
        if (t >= cfg.SLAM.WAVE_AT_MS && this.#once('slam')) {
          bear.slam(this.#waveSpeed() * cfg.SLAM.WAVE_SPEED_MULTIPLIER);
        }
        if (t >= cfg.SLAM.DURATION_MS) this.#enter(BearState.IDLE);
        break;

      case BearState.THROW:
        bear.stop();
        if (t >= cfg.THROW.RELEASE_AT_MS && this.#once('throw')) {
          bear.throwIceBalls(this.#angry ? cfg.THROW.ANGRY_BALLS : cfg.THROW.BALLS);
        }
        if (t >= cfg.THROW.DURATION_MS) this.#enter(BearState.IDLE);
        break;
    }
  }

  /** Sorteia o próximo golpe (pesos mudam conforme a posição do jogador). */
  #chooseAction() {
    const bear = this.#bear;
    const weights = { ...GameSettings.POLAR_BEAR.ACTION_WEIGHTS };
    const dx = Math.abs(bear.target.x - bear.x);
    const playerAbove = bear.target.y < bear.y - 70;

    if (dx > 320) { weights.THROW *= 1.6; weights.DASH *= 1.4; weights.SLAM *= 1.3; }
    if (dx < 140) { weights.QUAKE *= 1.5; weights.JUMP *= 0.6; }
    if (playerAbove) { weights.JUMP *= 2.2; weights.THROW *= 1.5; weights.DASH *= 0.4; }
    if (this.#lastAction) weights[this.#lastAction] *= 0.35; // evita repetir demais

    const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
    let roll = Math.random() * total;
    const action = Object.keys(weights).find(name => (roll -= weights[name]) < 0) || 'DASH';
    this.#lastAction = action;
    this.#start(action);
  }

  #start(action) {
    const cfg = GameSettings.POLAR_BEAR;
    const bear = this.#bear;
    bear.faceTarget();
    switch (action) {
      case 'DASH':
        this.#dashesLeft = this.#angry ? cfg.DASH.ANGRY_COUNT : cfg.DASH.COUNT;
        this.#afterCrouch = BearState.DASH;
        bear.setWarning(true);
        this.#enter(BearState.CROUCH);
        break;
      case 'JUMP':
        this.#afterCrouch = BearState.JUMP;
        this.#enter(BearState.CROUCH);
        break;
      case 'QUAKE':
        bear.setWarning(true);
        this.#enter(BearState.REAR);
        break;
      case 'SLAM':
        this.#enter(BearState.SLAM);
        break;
      default:
        this.#enter(BearState.THROW);
    }
  }

  /** Troca de estado e toca a animação dele. */
  #enter(state) {
    const bear = this.#bear;
    const cfg = GameSettings.POLAR_BEAR;
    this.#state = state;
    this.#stateStart = bear.scene.time.now;
    this.#fired = {};

    const clips = {
      INTRO: 'rugindo', ROAR: 'rugindo', IDLE: 'parado', WALK: 'andando', CROUCH: 'agachado',
      DASH: 'correndo', DASH_PAUSE: 'parado', SKID: 'derrapando', LAND: 'pouso', REAR: 'levantando',
      STOMP: 'impacto', SLAM: 'batendo', THROW: 'atacando'
    };
    if (state === BearState.TURN) bear.play(bear.facingRight ? 'virando_dir' : 'virando_esq');
    else if (state === BearState.JUMP) bear.leapAtTarget(cfg.JUMP.VELOCITY_Y, cfg.JUMP.MAX_SPEED_X * this.#speedScale());
    else if (clips[state]) bear.play(clips[state]);

    if (state === BearState.WALK && this.#nextActionAt < this.#stateStart) {
      const { MIN, MAX } = cfg.ACTION_DELAY_MS;
      this.#nextActionAt = this.#stateStart + Phaser.Math.Between(MIN, MAX) * (this.#angry ? cfg.ANGRY_DELAY : 1);
    }
  }

  /** true só na primeira vez que for chamado com esse nome no estado atual. */
  #once(name) {
    if (this.#fired[name]) return false;
    this.#fired[name] = true;
    return true;
  }

  #speedScale() { return this.#angry ? GameSettings.POLAR_BEAR.ANGRY_SPEED : 1; }
  #speed()      { return this.#bear.stats.SPEED * this.#speedScale(); }
  #waveSpeed()  { return GameSettings.POLAR_BEAR.WAVE.SPEED * this.#speedScale(); }
}
