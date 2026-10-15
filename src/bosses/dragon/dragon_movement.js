/**
 * dragon_movement.js
 * -----------------------------------------------------------------------------
 * Voo do dragão (mesma lógica do protótipo original):
 *   - muda de direção aleatoriamente de tempos em tempos (fica mais rápido
 *     conforme perde vida);
 *   - vira o sprite para o lado em que está voando;
 *   - é empurrado de volta quando chega perto das bordas da arena;
 *   - foge do jogador quando é atingido.
 * -----------------------------------------------------------------------------
 */
class DragonMovement {
  #dragon;
  #wanderTimer = new FrameTimer(GameSettings.DRAGON.WANDER_INTERVAL_FRAMES);

  /** @param {DragonBoss} dragon dono deste componente */
  constructor(dragon) {
    this.#dragon = dragon;
  }

  /** Movimentação do frame. */
  update() {
    const sprite = this.#dragon.sprite;
    this.#wander(sprite);
    this.#updateFacing(sprite);
    this.#keepInsideBounds(sprite);
  }

  /**
   * Afasta o dragão de quem o atacou.
   * @param {number} fromX posição do atacante
   * @param {number} fromY posição do atacante
   */
  fleeFrom(fromX, fromY) {
    const { FLEE_SPEED_X, FLEE_SPEED_Y } = GameSettings.DRAGON;
    const sprite = this.#dragon.sprite;
    const dx = sprite.x - fromX;
    const dy = sprite.y - fromY;
    const length = Math.hypot(dx, dy);

    // Evita divisão por zero (no original isso gerava velocidade NaN)
    if (length === 0) return;

    sprite.setVelocity((dx / length) * FLEE_SPEED_X, (dy / length) * FLEE_SPEED_Y);
  }

  /** Sorteia uma nova velocidade a cada intervalo. */
  #wander(sprite) {
    if (!this.#wanderTimer.tick()) return;

    const speed = this.#dragon.stats.SPEED;
    const speedBoost = 1 + this.#dragon.health.lostRatio * GameSettings.DRAGON.MAX_SPEED_BOOST;

    sprite.setVelocity(
      Phaser.Math.Between(-speed, speed) * speedBoost,
      Phaser.Math.Between(-speed, speed) * speedBoost
    );
  }

  /** Olha para o lado em que está voando (a animação cuida do espelhamento). */
  #updateFacing(sprite) {
    const vx = sprite.body.velocity.x;
    if (vx < 0) this.#dragon.setFacing(false);
    else if (vx > 0) this.#dragon.setFacing(true);
  }

  /** Empurra o dragão de volta para dentro da arena. */
  #keepInsideBounds(sprite) {
    const { BOUNDS, BOUNDS_PUSH_SPEED } = GameSettings.DRAGON;
    const arena = this.#dragon.arena;

    if (sprite.y < BOUNDS.MIN_Y) sprite.setVelocityY(BOUNDS_PUSH_SPEED);
    if (sprite.y > BOUNDS.MAX_Y) sprite.setVelocityY(-BOUNDS_PUSH_SPEED);
    if (sprite.x < arena.toWorldX(BOUNDS.MIN_X)) sprite.setVelocityX(BOUNDS_PUSH_SPEED);
    if (sprite.x > arena.toWorldX(BOUNDS.MAX_X)) sprite.setVelocityX(-BOUNDS_PUSH_SPEED);
  }
}
