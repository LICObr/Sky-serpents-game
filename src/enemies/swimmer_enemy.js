/**
 * swimmer_enemy.js
 * -----------------------------------------------------------------------------
 * Bicho que NADA na superfície de uma lagoa (jacaré, cobra-d'água): vai e
 * volta de uma margem à outra boiando, só com as costas para fora d'água.
 * Quando o jogador chega perto da água — nadando ou pulando por cima — dá
 * um BOTE: avança rápido de boca aberta. Nunca sai da lagoa.
 *   BOUNCY_BACK  pisar nas costas não mata: o jogador quica, como num
 *                trampolim (dá para atravessar a lagoa pulando nos jacarés!)
 * -----------------------------------------------------------------------------
 */
class SwimmerEnemy extends Enemy {
  #lake;
  #direction = -1;
  #lunging = false;
  #lungeUntil = 0;
  #nextLungeAt = 0;

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
    this.sprite.body.setAllowGravity(false);
  }

  /**
   * Lagoa em x (ou uma de mentira em volta do x, avisando no console).
   * @returns {{left: number, right: number, surfaceY: number}}
   */
  static lakeAt(levelMap, x) {
    const lake = levelMap.waterAt(x);
    if (lake) return lake;
    console.warn(`[Pântano] Bicho de água em x=${x} fora de uma lagoa`);
    return { left: x - 100, right: x + 100, surfaceY: GameSettings.LEVEL.GROUND_TOP };
  }

  /** @override No bote mostra a boca aberta. */
  get cyclesFrames() {
    return !this.#lunging;
  }

  /** @override Nada de margem a margem; dá o bote quando o jogador chega perto. */
  behave(time, player) {
    if (this.#lunging && time >= this.#lungeUntil) this.#endLunge();
    if (!this.#lunging) {
      this.#patrol();
      if (time >= this.#nextLungeAt && this.#playerInReach(player)) this.#lunge(time, player);
    }
    this.#keepInLake();
    this.#float(time);
    this.sprite.setFlipX(this.#direction > 0); // a arte olha para a esquerda
  }

  /** @override Fora da câmera fica parado boiando. */
  sleep() {
    if (this.isActive) this.sprite.setVelocity(0, 0);
  }

  /** @override BOUNCY_BACK: pisar nas costas faz o jogador quicar (e o bicho afunda um pouquinho). */
  onPlayerContact(player) {
    const fromAbove = player.isFalling && player.feetY <= this.sprite.body.top + GameSettings.ENEMY.STOMP_TOLERANCE;
    if (this.type.BOUNCY_BACK && fromAbove && this.canHurt) {
      player.bounce();
      this.sprite.y += 6;
      return;
    }
    super.onPlayerContact(player);
  }

  /** Vai e volta entre as margens. */
  #patrol() {
    const margin = this.sprite.displayWidth / 2;
    if (this.x <= this.#lake.left + margin) this.#direction = 1;
    else if (this.x >= this.#lake.right - margin) this.#direction = -1;
    this.sprite.setVelocityX(this.#direction * this.speed);
  }

  /** O jogador está sobre a lagoa, perto, e na altura da água (nadando ou logo acima)? */
  #playerInReach(player) {
    const cfg = this.type.LUNGE;
    const overLake = player.x > this.#lake.left && player.x < this.#lake.right;
    return overLake && Math.abs(player.x - this.x) < cfg.RANGE_X && player.y > this.#lake.surfaceY - cfg.RANGE_Y;
  }

  /** Bote: avança rápido na direção do jogador, de boca aberta. */
  #lunge(time, player) {
    const cfg = this.type.LUNGE;
    this.#direction = Math.sign(player.x - this.x) || this.#direction;
    this.#lunging = true;
    this.#lungeUntil = time + cfg.MS;
    this.#nextLungeAt = time + cfg.MS + cfg.COOLDOWN_MS;
    this.#show(cfg.FRAME);
    this.sprite.setVelocityX(this.#direction * cfg.SPEED);
  }

  #endLunge() {
    this.#lunging = false;
    this.#show(this.type.FRAMES[0]);
  }

  /** Nunca passa das margens. */
  #keepInLake() {
    const margin = this.sprite.displayWidth / 2;
    const vx = this.sprite.body.velocity.x;
    if ((this.x <= this.#lake.left + margin && vx < 0) || (this.x >= this.#lake.right - margin && vx > 0)) {
      this.sprite.setVelocityX(0);
    }
  }

  /** Boia na superfície, subindo e descendo de leve. */
  #float(time) {
    const type = this.type;
    const targetY = this.#lake.surfaceY + type.FLOAT_Y + Math.sin(time * type.WAVE_SPEED) * type.WAVE_AMPLITUDE;
    this.sprite.setVelocityY((targetY - this.y) * 6);
  }

  /** Troca o desenho e ajusta a área de colisão ao tamanho dele. */
  #show(key) {
    if (!key || this.sprite.texture.key === key) return;
    this.setTextureIfChanged(key);
    this.sprite.body.setSize();
  }
}
