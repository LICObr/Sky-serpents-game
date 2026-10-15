/**
 * combat_registry.js
 * -----------------------------------------------------------------------------
 * Cadastro central de tudo que pode ser ATINGIDO pelo jogador (bichos e
 * chefões). Mantém dois grupos do Phaser para as colisões:
 *   - hitboxes:  atingíveis por flechas/espada
 *   - hurtboxes: machucam o jogador ao encostar
 *
 * Assim o ataque do jogador não precisa saber quantos inimigos existem nem
 * de que tipo são — ele só pergunta ao registro.
 * -----------------------------------------------------------------------------
 */
class CombatRegistry {
  #entities = new Set();
  #hitboxes;
  #hurtboxes;

  /** @param {Phaser.Scene} scene */
  constructor(scene) {
    // Grupos "simples" (não-físicos) para não alterar os corpos dos sprites
    this.#hitboxes = scene.add.group();
    this.#hurtboxes = scene.add.group();
  }

  get hitboxes()  { return this.#hitboxes; }
  get hurtboxes() { return this.#hurtboxes; }

  /**
   * Registra uma entidade atingível.
   * @param {GameEntity} entity
   * @param {boolean} hurtsOnContact se encostar machuca o jogador
   */
  register(entity, hurtsOnContact) {
    this.#entities.add(entity);
    entity.hitboxSprites.forEach(sprite => {
      this.#hitboxes.add(sprite);
      if (hurtsOnContact) this.#hurtboxes.add(sprite);
    });
  }

  /** Remove a entidade (ex.: quando morre). */
  unregister(entity) {
    this.#entities.delete(entity);
    entity.hitboxSprites.forEach(sprite => {
      this.#hitboxes.remove(sprite);
      this.#hurtboxes.remove(sprite);
    });
  }

  /** Entidades vivas que podem ser atingidas agora. */
  get targets() {
    return [...this.#entities].filter(entity => entity.canBeHit);
  }
}
