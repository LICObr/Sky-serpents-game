/**
 * leech_enemy.js
 * -----------------------------------------------------------------------------
 * Sanguessuga (pântano): fica ondulando no fundo da lagoa e nada atrás de
 * quem cai na água. Encostou, GRUDA: vai junto com o jogador deixando ele
 * lento e, depois de um tempinho, chupa um coração e cai (estourando de tão
 * cheia). Sair da água faz ela soltar; dá para tirar com a espada.
 * -----------------------------------------------------------------------------
 */
class LeechEnemy extends Enemy {
  #lake;
  #homeY;
  #host = null;      // jogador onde ela está grudada
  #attachedAt = 0;
  #nextSlowAt = 0;
  #offsetX = 0;

  /**
   * @param {Phaser.Scene} scene
   * @param {number} x precisa estar sobre uma lagoa (WATER)
   * @param {number} y (ignorado: fica perto do fundo)
   * @param {object} type
   * @param {MatchConfig} match
   * @param {Phaser.Events.EventEmitter} eventBus
   * @param {LevelMap} levelMap onde fica a lagoa
   */
  constructor(scene, x, y, type, match, eventBus, levelMap) {
    const lake = SwimmerEnemy.lakeAt(levelMap, x);
    const homeY = GameSettings.LEVEL.LAKE_BED_Y - 14;
    super(scene, x, homeY, type, match, eventBus);
    this.#lake = lake;
    this.#homeY = homeY;
    this.sprite.body.setAllowGravity(false);
  }

  /** @override */
  behave(time, player) {
    if (this.#host) {
      this.#cling(time);
      return;
    }
    const type = this.type;
    const sprite = this.sprite;
    const hunting = player.status.isSwimming && this.distanceFrom(player) < type.SENSE_RANGE;
    if (hunting) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
      sprite.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
    } else {
      sprite.setVelocity(Math.sin(time * 0.002) * 12, (this.#homeY - this.y) * 2);
    }
    // sempre dentro d'água
    const lake = this.#lake;
    sprite.x = Phaser.Math.Clamp(sprite.x, lake.left + 8, lake.right - 8);
    sprite.y = Phaser.Math.Clamp(sprite.y, lake.surfaceY + 10, this.#homeY);
    if (Math.abs(sprite.body.velocity.x) > 2) sprite.setFlipX(sprite.body.velocity.x > 0); // a arte olha para a esquerda
  }

  /** @override Não machuca ao encostar: gruda em quem está nadando. */
  onPlayerContact(player) {
    if (!this.isActive || this.#host || !player.status.isSwimming) return;
    this.#host = player;
    this.#attachedAt = this.scene.time.now;
    this.#offsetX = Phaser.Math.Clamp(this.x - player.x, -8, 8);
  }

  /** @override Fora da câmera fica parada (grudada, continua grudada). */
  sleep() {
    if (this.isActive && !this.#host) this.sprite.setVelocity(0, 0);
  }

  /** Grudada: vai junto, deixa lento e, depois de um tempo, chupa um coração e cai. */
  #cling(time) {
    const host = this.#host;
    if (!host.status.isSwimming || host.isKnockedOut) {
      this.#host = null;
      this.vanish(); // fora d'água ela não aguenta
      return;
    }
    this.sprite.body.reset(host.x + this.#offsetX, host.y + 6);
    this.sprite.setAngle(Math.sin(time * 0.02) * 12); // se mexendo, chupando
    if (time >= this.#nextSlowAt) {
      host.status.apply(ProjectileEffect.SLOW);
      this.#nextSlowAt = time + 500;
    }
    if (time - this.#attachedAt < this.type.DRAIN_MS) return;
    host.hitByContact(ProjectileEffect.NONE);
    this.#host = null;
    this.vanish(); // estourou de tão cheia
  }
}
