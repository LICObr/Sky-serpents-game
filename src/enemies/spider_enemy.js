/**
 * spider_enemy.js
 * -----------------------------------------------------------------------------
 * Aranha (caverna): fica PENDURADA num fio de teia lá no alto, balançando.
 * Quando o jogador passa por baixo, ela CAI em cima dele e depois anda pelo
 * chão como os outros bichos (WalkerEnemy).
 * -----------------------------------------------------------------------------
 */
class SpiderEnemy extends WalkerEnemy {
  #hanging = true;
  #homeY;
  #thread;

  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y altura em que fica pendurada
   * @param {object} type
   * @param {MatchConfig} match
   * @param {Phaser.Events.EventEmitter} eventBus
   * @param {LevelMap} levelMap
   */
  constructor(scene, x, y, type, match, eventBus, levelMap) {
    super(scene, x, y, type, match, eventBus, levelMap);
    this.#homeY = y;
    this.sprite.body.setAllowGravity(false);
    this.#thread = scene.add.graphics().setDepth(GameSettings.ENEMY.DEPTH - 0.1);
    this.#drawThread();
  }

  /** @override Pendurada: balança e espera o jogador passar embaixo. */
  behave(time, player) {
    if (!this.#hanging) {
      super.behave(time, player);
      return;
    }
    const targetY = this.#homeY + Math.sin(time * 0.003) * 6;
    this.sprite.setVelocity(0, (targetY - this.y) * 4);
    this.#drawThread();
    const below = player.y > this.y && Math.abs(player.x - this.x) < this.type.DROP_RANGE_X;
    if (below) this.#drop();
  }

  /** @override Fora da câmera: pendurada fica parada no ar. */
  sleep() {
    if (this.#hanging) this.sprite.setVelocity(0, 0);
    else super.sleep();
  }

  /** @override Leva o fio junto. */
  destroy() {
    this.#thread.destroy();
    super.destroy();
  }

  /** Solta o fio e despenca. */
  #drop() {
    this.#hanging = false;
    this.#thread.clear();
    this.sprite.body.setAllowGravity(true);
    this.sprite.setVelocity(0, this.type.DROP_SPEED);
  }

  /** Fio de teia do alto da tela até as costas da aranha. */
  #drawThread() {
    const top = this.scene.cameras.main.worldView.top - 10;
    this.#thread.clear()
      .lineStyle(1.5, 0xdddddd, 0.7)
      .lineBetween(this.x, top, this.x, this.y - this.sprite.displayHeight / 2);
  }
}
