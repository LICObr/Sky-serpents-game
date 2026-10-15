/**
 * walker_enemy.js
 * -----------------------------------------------------------------------------
 * Bicho que anda no chão (slime). Vai e volta: vira ao bater em algo ou
 * ao chegar na beirada de um buraco/plataforma.
 * -----------------------------------------------------------------------------
 */
class WalkerEnemy extends Enemy {
  #levelMap;
  #direction = -1; // começa andando na direção do jogador (esquerda)

  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {object} type
   * @param {MatchConfig} match
   * @param {Phaser.Events.EventEmitter} eventBus
   * @param {LevelMap} levelMap usado para enxergar as beiradas
   */
  constructor(scene, x, y, type, match, eventBus, levelMap) {
    super(scene, x, y, type, match, eventBus);
    this.#levelMap = levelMap;
  }

  /** @override */
  behave() {
    const body = this.sprite.body;

    if (body.blocked.left) this.#direction = 1;
    else if (body.blocked.right) this.#direction = -1;
    else if (body.blocked.down && this.#isAtLedge(body)) this.#direction *= -1;

    this.sprite.setVelocityX(this.#direction * this.speed);
    this.sprite.setFlipX(this.#direction > 0);
  }

  /** Não há chão logo à frente? */
  #isAtLedge(body) {
    const lookahead = GameSettings.ENEMY.LEDGE_LOOKAHEAD;
    const aheadX = this.#direction > 0 ? body.right + lookahead : body.left - lookahead;
    return !this.#levelMap.hasFloorAt(aheadX, body.bottom);
  }
}
