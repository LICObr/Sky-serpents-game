/**
 * serpent_movement.js
 * -----------------------------------------------------------------------------
 * Movimento da serpente, como uma pequena máquina de estados:
 *
 *   ROAM ──(intervalo)──▶ TELEGRAPH ──(aviso)──▶ CHARGE ──(duração)──▶ ROAM
 *
 *   ROAM:      "nada" pela arena fazendo curvas suaves até pontos sorteados
 *   TELEGRAPH: freia e a cabeça pisca em vermelho (aviso para o jogador)
 *   CHARGE:    investida em linha reta na direção onde o jogador estava
 * -----------------------------------------------------------------------------
 */
const SerpentState = Object.freeze({
  ROAM: 'ROAM',
  TELEGRAPH: 'TELEGRAPH',
  CHARGE: 'CHARGE'
});

class SerpentMovement {
  #serpent;
  #state = SerpentState.ROAM;
  #stateEndsAt = 0;
  #nextChargeAt;
  #velocity;
  #waypoint;

  /** @param {SerpentBoss} serpent dono deste componente */
  constructor(serpent) {
    this.#serpent = serpent;
    this.#velocity = new Phaser.Math.Vector2(-serpent.stats.SPEED, 0);
    this.#waypoint = this.#randomWaypoint();
    this.#nextChargeAt = serpent.scene.time.now + serpent.stats.CHARGE.INTERVAL_MS;
  }

  get state() { return this.#state; }

  /**
   * Movimento do frame.
   * @param {number} deltaMs tempo desde o último frame
   */
  update(deltaMs) {
    const now = this.#serpent.scene.time.now;

    switch (this.#state) {
      case SerpentState.ROAM:      this.#roam(now); break;
      case SerpentState.TELEGRAPH: this.#telegraph(now); break;
      case SerpentState.CHARGE:    this.#charge(now); break;
    }

    this.#integrate(deltaMs / 1000);
  }

  /** Nada até o ponto sorteado; de tempos em tempos prepara a investida. */
  #roam(now) {
    const serpent = this.#serpent;
    if (Phaser.Math.Distance.Between(serpent.x, serpent.y, this.#waypoint.x, this.#waypoint.y) < GameSettings.SERPENT.WAYPOINT_REACHED) {
      this.#waypoint = this.#randomWaypoint();
    }

    // Fica mais rápida conforme perde vida
    const speed = serpent.stats.SPEED * (1 + serpent.health.lostRatio * 0.6);
    this.#steerTowards(this.#waypoint, speed, GameSettings.SERPENT.STEERING);

    if (now > this.#nextChargeAt) {
      this.#state = SerpentState.TELEGRAPH;
      this.#stateEndsAt = now + serpent.stats.CHARGE.TELEGRAPH_MS;
    }
  }

  /** Freia e pisca antes de avançar. */
  #telegraph(now) {
    this.#velocity.scale(0.9);
    this.#serpent.setWarning(Math.floor(now / 100) % 2 === 0);

    if (now > this.#stateEndsAt) {
      const { CHARGE } = this.#serpent.stats;
      const target = this.#serpent.target;
      const angle = Phaser.Math.Angle.Between(this.#serpent.x, this.#serpent.y, target.x, target.y);
      this.#velocity.setToPolar(angle, CHARGE.SPEED);
      this.#serpent.setWarning(false);
      this.#state = SerpentState.CHARGE;
      this.#stateEndsAt = now + CHARGE.DURATION_MS;
    }
  }

  /** Avança em linha reta até o tempo acabar. */
  #charge(now) {
    if (now > this.#stateEndsAt) {
      this.#state = SerpentState.ROAM;
      this.#nextChargeAt = now + this.#serpent.stats.CHARGE.INTERVAL_MS;
      this.#waypoint = this.#randomWaypoint();
    }
  }

  /** Curva suave: aproxima a velocidade atual da velocidade desejada. */
  #steerTowards(point, speed, steering) {
    const serpent = this.#serpent;
    const desired = new Phaser.Math.Vector2(point.x - serpent.x, point.y - serpent.y).setLength(speed);
    this.#velocity.lerp(desired, steering);
  }

  /** Move a cabeça, mantém dentro da arena e gira na direção do movimento. */
  #integrate(dt) {
    const { BOUNDS } = GameSettings.SERPENT;
    const arena = this.#serpent.arena;
    const head = this.#serpent.sprite;

    let x = head.x + this.#velocity.x * dt;
    let y = head.y + this.#velocity.y * dt;

    // Bate nas bordas da arena e volta
    const minX = arena.toWorldX(BOUNDS.MIN_X);
    const maxX = arena.toWorldX(BOUNDS.MAX_X);
    if (x < minX || x > maxX) { this.#velocity.x *= -1; x = Phaser.Math.Clamp(x, minX, maxX); }
    if (y < BOUNDS.MIN_Y || y > BOUNDS.MAX_Y) { this.#velocity.y *= -1; y = Phaser.Math.Clamp(y, BOUNDS.MIN_Y, BOUNDS.MAX_Y); }

    head.setPosition(x, y);
    if (this.#velocity.lengthSq() > 1) {
      const angle = this.#velocity.angle();
      head.setRotation(angle);
      head.setFlipY(Math.cos(angle) < 0); // não fica de cabeça para baixo
    }
  }

  /** Ponto aleatório dentro da arena. */
  #randomWaypoint() {
    const { BOUNDS } = GameSettings.SERPENT;
    const arena = this.#serpent.arena;
    return {
      x: arena.toWorldX(Phaser.Math.Between(BOUNDS.MIN_X, BOUNDS.MAX_X)),
      y: Phaser.Math.Between(BOUNDS.MIN_Y, BOUNDS.MAX_Y)
    };
  }
}
