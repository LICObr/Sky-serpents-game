/**
 * goal_flag.js
 * -----------------------------------------------------------------------------
 * Bandeira de CHEGADA, usada nas fases que ainda não têm chefão: quando o
 * jogador alcança a bandeira, a fase termina. A bandeira balança ao vento e
 * dá um pulinho de comemoração quando é alcançada.
 * -----------------------------------------------------------------------------
 */
class GoalFlag {
  #scene;
  #sprite;
  #reached = false;
  #onReached;

  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} groundY altura do chão
   * @param {Function} onReached chamado uma vez, quando o jogador chega
   */
  constructor(scene, x, groundY, onReached) {
    const cfg = GameSettings.GOAL_FLAG;
    this.#scene = scene;
    this.#onReached = onReached;
    this.#sprite = scene.add.image(x, groundY, cfg.TEXTURE)
      .setOrigin(0.1, 1)
      .setScale(cfg.SCALE)
      .setDepth(GameSettings.ENEMY.DEPTH);

    // Balançando ao vento
    scene.tweens.add({ targets: this.#sprite, scaleX: cfg.SCALE * 0.92, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  /** Confere se o jogador chegou (chamar a cada frame). */
  update(player) {
    if (this.#reached || player.x < this.#sprite.x - 10) return;
    this.#reached = true;
    this.#scene.tweens.add({ targets: this.#sprite, y: this.#sprite.y - 20, duration: 160, yoyo: true });
    this.#onReached();
  }
}
