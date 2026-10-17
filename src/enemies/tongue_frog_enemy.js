/**
 * tongue_frog_enemy.js
 * -----------------------------------------------------------------------------
 * Sapo-Língua (pântano): pula como o sapo de sempre, mas quando o jogador
 * fica na frente dele, perto e na mesma altura, para e dá uma LINGUADA: a
 * língua rosada estica e, se pegar o jogador, PUXA ele para perto do sapo
 * (direto para a boca!). A língua não tira coração — encostar no sapo, sim.
 * -----------------------------------------------------------------------------
 */
class TongueFrogEnemy extends HopperEnemy {
  #tongue;
  #lashStartedAt = 0; // 0 = língua guardada
  #nextLashAt = 0;
  #caught = false;

  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {object} type
   * @param {MatchConfig} match
   * @param {Phaser.Events.EventEmitter} eventBus
   */
  constructor(scene, x, y, type, match, eventBus) {
    super(scene, x, y, type, match, eventBus);
    this.#tongue = scene.add.graphics().setDepth(GameSettings.ENEMY.DEPTH + 0.1);
  }

  /** @override Com a língua para fora fica parado; senão, pula como sapo. */
  behave(time, player) {
    if (this.#lashStartedAt) {
      this.#lash(time, player);
      return;
    }
    const cfg = this.type.TONGUE;
    const dx = player.x - this.x;
    const inReach = Math.abs(dx) < cfg.RANGE_X && Math.abs(player.y - this.y) < cfg.RANGE_Y;
    if (inReach && this.sprite.body.blocked.down && time >= this.#nextLashAt) {
      this.#lashStartedAt = time;
      this.#caught = false;
      this.sprite.setVelocityX(0);
      this.sprite.setFlipX(dx > 0); // a arte olha para a esquerda
      this.setTextureIfChanged(this.type.FRAMES[0]);
      return;
    }
    super.behave(time, player);
  }

  /** @override Fora da câmera: guarda a língua. */
  sleep() {
    this.#putTongueAway();
    super.sleep();
  }

  /** @override Se morreu, a língua some junto. */
  takeHit(source, damage) {
    super.takeHit(source, damage);
    if (!this.isActive) this.#putTongueAway();
  }

  /** @override */
  destroy() {
    this.#tongue.destroy();
    super.destroy();
  }

  /** A língua estica até o alcance e volta; se tocar no jogador, puxa ele. */
  #lash(time, player) {
    const cfg = this.type.TONGUE;
    const progress = (time - this.#lashStartedAt) / cfg.MS;
    if (progress >= 1) {
      this.#putTongueAway();
      this.#nextLashAt = time + cfg.COOLDOWN_MS;
      return;
    }
    const direction = this.sprite.flipX ? 1 : -1;
    const mouthX = this.x + direction * this.sprite.displayWidth * 0.3;
    const mouthY = this.y + this.sprite.displayHeight * 0.1;
    const tipX = mouthX + direction * Math.sin(progress * Math.PI) * cfg.RANGE_X; // estica e volta
    this.#tongue.clear()
      .lineStyle(4, cfg.COLOR, 1).lineBetween(mouthX, mouthY, tipX, mouthY)
      .fillStyle(cfg.COLOR, 1).fillCircle(tipX, mouthY, 4);

    const touches = Math.abs(player.x - tipX) < 14 && Math.abs(player.y - mouthY) < cfg.RANGE_Y;
    if (!this.#caught && touches) {
      this.#caught = true;
      player.pushBack(-direction, cfg.PULL_FORCE); // puxa para a boca do sapo
    }
  }

  #putTongueAway() {
    this.#lashStartedAt = 0;
    this.#tongue.clear();
  }
}
