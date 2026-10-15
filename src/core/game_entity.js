/**
 * game_entity.js
 * -----------------------------------------------------------------------------
 * Classe base ABSTRATA para tudo que tem um sprite com física e pode
 * participar de combate: Player, Enemy (bichos) e Boss (chefões).
 *
 * Contrato de COMBATE (usado por espada, flechas e contato):
 *   - isAlive              → ainda está no jogo?
 *   - canBeHit             → pode receber golpe agora? (ex.: fantasma sumido)
 *   - meleeReach           → alcance da espada contra esta entidade
 *   - distanceFrom(other)  → distância usada pela espada
 *   - takeHit(src, dmg)    → recebe dano (subclasses implementam)
 *   - hitboxSprites        → sprites que flechas/contato podem atingir
 * -----------------------------------------------------------------------------
 */
class GameEntity {
  #scene;
  #sprite;

  /**
   * @param {Phaser.Scene} scene
   * @param {Phaser.Physics.Arcade.Sprite} sprite sprite principal
   */
  constructor(scene, sprite) {
    if (new.target === GameEntity) {
      throw new TypeError('GameEntity é abstrata: use uma subclasse (Player, Enemy, Boss...).');
    }
    this.#scene = scene;
    this.#sprite = sprite;
    sprite.setData('owner', this); // permite achar a entidade a partir do sprite
  }

  get scene()  { return this.#scene; }
  get sprite() { return this.#sprite; }
  get x()      { return this.#sprite.x; }
  get y()      { return this.#sprite.y; }

  /** true enquanto o sprite existir e estiver ativo na cena. */
  get isAlive() {
    return this.#sprite !== null && this.#sprite.active;
  }

  /** Pode ser atingido neste momento? (subclasses podem restringir) */
  get canBeHit() {
    return this.isAlive;
  }

  /** Alcance do golpe de espada contra esta entidade (px). */
  get meleeReach() {
    return 0;
  }

  /** Sprites que podem ser atingidos por flechas/contato. */
  get hitboxSprites() {
    return this.isAlive ? [this.#sprite] : [];
  }

  /** Distância em pixels entre o centro desta entidade e de outra. */
  distanceFrom(other) {
    return Phaser.Math.Distance.Between(this.x, this.y, other.x, other.y);
  }

  /** Troca a textura somente se for diferente (evita trabalho a cada frame). */
  setTextureIfChanged(key) {
    if (this.#sprite.texture.key !== key) this.#sprite.setTexture(key);
  }

  /**
   * Recebe dano. Implementado pelas subclasses que podem apanhar.
   * @param {{x:number, y:number}} source de onde veio o golpe
   * @param {number} damage
   */
  // eslint-disable-next-line no-unused-vars
  takeHit(source, damage) {}

  /** Remove a entidade da cena. Depois disso isAlive passa a ser false. */
  destroy() {
    if (this.#sprite) {
      this.#sprite.destroy();
      this.#sprite = null;
    }
  }

  /** Lógica por frame — cada subclasse deve implementar a sua. */
  update() {
    throw new Error(`${this.constructor.name} precisa implementar update().`);
  }
}
