/**
 * piranha_enemy.js
 * -----------------------------------------------------------------------------
 * Piranha (pântano): nada escondida debaixo d'água, de uma margem à outra.
 * De tempos em tempos, se o jogador estiver perto da lagoa, ela PULA para
 * fora d'água num arco na direção dele, dentuça, e cai de volta com um
 * respingo (dá para rebater com a espada ou pisar nela no ar). Nadando
 * perto dela, mordida.
 * -----------------------------------------------------------------------------
 */
class PiranhaEnemy extends Enemy {
  #lake;
  #swimY;
  #direction = -1;
  #jumping = false;
  #nextJumpAt;

  /**
   * @param {Phaser.Scene} scene
   * @param {number} x precisa estar sobre uma lagoa (WATER)
   * @param {number} y (ignorado: nada debaixo d'água)
   * @param {object} type
   * @param {MatchConfig} match
   * @param {Phaser.Events.EventEmitter} eventBus
   * @param {LevelMap} levelMap onde fica a lagoa
   */
  constructor(scene, x, y, type, match, eventBus, levelMap) {
    const lake = SwimmerEnemy.lakeAt(levelMap, x);
    const swimY = lake.surfaceY + type.SWIM_DEPTH;
    super(scene, x, swimY, type, match, eventBus);
    this.#lake = lake;
    this.#swimY = swimY;
    this.sprite.body.setAllowGravity(false);
    this.#nextJumpAt = scene.time.now + Phaser.Math.Between(400, type.JUMP.EVERY_MS);
  }

  /** @override */
  behave(time, player) {
    if (this.#jumping) {
      this.#fly(time);
      return;
    }
    const margin = this.sprite.displayWidth / 2;
    if (this.x <= this.#lake.left + margin) this.#direction = 1;
    else if (this.x >= this.#lake.right - margin) this.#direction = -1;
    this.sprite.setVelocity(this.#direction * this.speed, (this.#swimY + Math.sin(time * 0.004) * 3 - this.y) * 6);
    this.sprite.setFlipX(this.#direction > 0); // a arte olha para a esquerda

    if (time >= this.#nextJumpAt && Math.abs(player.x - this.x) < this.type.JUMP.RANGE_X) this.#jump(player);
  }

  /** @override Subindo (vem de baixo) sempre morde; caindo de volta, dá para pisar nela. */
  onPlayerContact(player) {
    if (this.#jumping && this.sprite.body.velocity.y < 0) {
      if (this.canHurt) player.hitByContact(this.contactEffect);
      return;
    }
    super.onPlayerContact(player);
  }

  /** @override Fora da câmera fica parada (no meio do pulo, continua caindo). */
  sleep() {
    if (this.isActive && !this.#jumping) this.sprite.setVelocity(0, 0);
  }

  /** Pula num arco que termina perto do jogador (sem sair da lagoa). */
  #jump(player) {
    const cfg = this.type.JUMP;
    const airtime = 2 * -cfg.VELOCITY / GameSettings.PHYSICS.GRAVITY_Y; // sobe e volta para a mesma altura
    const margin = this.sprite.displayWidth;
    const targetX = Phaser.Math.Clamp(player.x, this.#lake.left + margin, this.#lake.right - margin);
    const vx = Phaser.Math.Clamp((targetX - this.x) / airtime, -cfg.MAX_SPEED_X, cfg.MAX_SPEED_X);
    this.#jumping = true;
    this.sprite.body.setAllowGravity(true);
    this.sprite.setVelocity(vx, cfg.VELOCITY);
    this.sprite.setFlipX(vx > 0);
    WaterSplash.at(this.scene, this.x, this.#lake.surfaceY, 8);
  }

  /** No ar: gira acompanhando o arco; ao voltar para a água, mergulha. */
  #fly(time) {
    const sprite = this.sprite;
    const vy = sprite.body.velocity.y;
    const facing = sprite.flipX ? -1 : 1;
    sprite.setAngle(Phaser.Math.Clamp(-vy / 12, -60, 60) * facing); // subindo: boca para cima
    if (vy <= 0 || this.y < this.#swimY) return;

    this.#jumping = false;
    sprite.body.setAllowGravity(false);
    sprite.setVelocity(0, 0).setAngle(0);
    sprite.y = this.#swimY;
    this.#nextJumpAt = time + this.type.JUMP.EVERY_MS;
    WaterSplash.at(this.scene, this.x, this.#lake.surfaceY, 8);
  }
}
