/**
 * swimmer_enemy.js
 * -----------------------------------------------------------------------------
 * Bicho que NADA na superfície de uma lagoa (jacaré, cobra-d'água): vai e
 * volta de uma margem à outra boiando, só com os olhos e as costas para
 * fora d'água (passa por baixo das vitórias-régias sem incomodar quem está
 * em cima). Quando o jogador cai na água perto dele, dá um BOTE: avança
 * rápido de boca aberta, mergulhando atrás dele. Nunca sai da lagoa.
 *   BOUNCY_BACK  pisar nas costas não mata: o jogador quica, como num
 *                trampolim (dá para atravessar a lagoa pulando nos jacarés!)
 *   DRAG         a mordida em quem está nadando AGARRA e arrasta para o
 *                fundo da lagoa, girando (o "rolo da morte" do jacaré)
 *   HITBOX       parte do desenho que machuca (as escamas de cima não contam)
 * -----------------------------------------------------------------------------
 */
class SwimmerEnemy extends Enemy {
  #lake;
  #direction = -1;
  #lunging = false;
  #lungeUntil = 0;
  #nextLungeAt = 0;
  #rollUntil = 0;   // arrastando alguém para o fundo

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
    this.#fitBody();
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

  /** @override Nada de margem a margem; dá o bote quando o jogador cai na água perto. */
  behave(time, player) {
    if (time < this.#rollUntil) {
      // girando com o jogador na boca, descendo até o fundo
      this.sprite.setVelocity(0, (this.#bottomY() - this.y) * 6);
      return;
    }
    if (this.#lunging && time >= this.#lungeUntil) this.#endLunge();
    if (!this.#lunging) {
      this.#patrol();
      if (time >= this.#nextLungeAt && this.#playerInReach(player)) this.#lunge(time, player);
    }
    this.#keepInLake();
    this.#float(time, this.#lunging ? player : null);
    this.sprite.setFlipX(this.#direction > 0); // a arte olha para a esquerda
  }

  /** @override Fora da câmera fica parado boiando. */
  sleep() {
    if (this.isActive) this.sprite.setVelocity(0, 0);
  }

  /**
   * @override BOUNCY_BACK: pisar nas costas faz quicar. DRAG: a mordida em quem
   * está nadando arrasta para o fundo.
   */
  onPlayerContact(player) {
    const fromAbove = player.isFalling && player.feetY <= this.sprite.body.top + GameSettings.ENEMY.STOMP_TOLERANCE;
    if (this.type.BOUNCY_BACK && fromAbove && this.canHurt) {
      player.bounce();
      this.sprite.y += 6; // afunda um pouquinho com o peso
      return;
    }
    if (this.type.DRAG && this.canHurt && player.status.isSwimming) {
      if (this.scene.time.now < this.#rollUntil) return;
      const hearts = player.health.hearts;
      player.hitByContact(this.contactEffect);
      if (player.health.hearts < hearts && !player.health.isDead) this.#dragDown(player);
      return;
    }
    super.onPlayerContact(player);
  }

  /** Fundo da lagoa (para o bicho, sem atravessar o chão). */
  #bottomY() {
    return GameSettings.LEVEL.LAKE_BED_Y - this.sprite.displayHeight / 2;
  }

  /** Vai e volta entre as margens. */
  #patrol() {
    const margin = this.sprite.displayWidth / 2;
    if (this.x <= this.#lake.left + margin) this.#direction = 1;
    else if (this.x >= this.#lake.right - margin) this.#direction = -1;
    this.sprite.setVelocityX(this.#direction * this.speed);
  }

  /** O jogador está na lagoa, perto, e dentro da água (nadando)? */
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

  /** Agarra o jogador e gira arrastando ele para o fundo. */
  #dragDown(player) {
    const cfg = this.type.DRAG;
    this.#rollUntil = this.scene.time.now + cfg.MS;
    player.dragDown(cfg.SPEED, cfg.MS);
    this.#show(this.type.LUNGE.FRAME);
    this.#lunging = true;
    this.#lungeUntil = this.#rollUntil;
    const sprite = this.sprite;
    this.scene.tweens.add({
      targets: sprite, angle: this.#direction > 0 ? 360 : -360, duration: cfg.MS,
      onComplete: () => { if (sprite.active) sprite.setAngle(0); }
    });
  }

  /** Nunca passa das margens. */
  #keepInLake() {
    const margin = this.sprite.displayWidth / 2;
    const vx = this.sprite.body.velocity.x;
    if ((this.x <= this.#lake.left + margin && vx < 0) || (this.x >= this.#lake.right - margin && vx > 0)) {
      this.sprite.setVelocityX(0);
    }
  }

  /**
   * Boia na superfície, subindo e descendo de leve. No bote mergulha até a
   * altura do jogador (sem passar do fundo da lagoa).
   * @param {Player|null} prey quem ele está mordendo (null = só boiando)
   */
  #float(time, prey) {
    const type = this.type;
    const floatY = this.#lake.surfaceY + type.FLOAT_Y;
    const targetY = prey
      ? Phaser.Math.Clamp(prey.y, floatY, this.#bottomY())
      : floatY + Math.sin(time * type.WAVE_SPEED) * type.WAVE_AMPLITUDE;
    this.sprite.setVelocityY((targetY - this.y) * 6);
  }

  /** Troca o desenho e ajusta a área de colisão ao tamanho dele. */
  #show(key) {
    if (!key || this.sprite.texture.key === key) return;
    this.setTextureIfChanged(key);
    this.#fitBody();
  }

  /** Área que machuca: o quadro inteiro ou só a parte HITBOX dele. */
  #fitBody() {
    const body = this.sprite.body;
    const hitbox = this.type.HITBOX;
    const { width, height } = this.sprite.frame;
    if (!hitbox) {
      body.setSize(width, height);
      return;
    }
    body.setSize(width * hitbox.WIDTH, height * hitbox.HEIGHT, false);
    body.setOffset(width * (1 - hitbox.WIDTH) / 2, height * hitbox.TOP);
  }
}
