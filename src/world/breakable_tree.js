/**
 * breakable_tree.js
 * -----------------------------------------------------------------------------
 * Árvore que BLOQUEIA o caminho (alta demais para pular). É preciso
 * quebrá-la com golpes de espada ou flechas:
 *   - a cada golpe ela pisca, balança, solta lascas e a tela treme um pouco;
 *   - com metade da vida ela fica RACHADA;
 *   - ao quebrar, tomba para o lado e some, liberando a passagem.
 *
 * Herda de GameEntity e entra no combate como um alvo (CombatRegistry),
 * então espada e flechas funcionam nela sem nenhum código especial.
 * -----------------------------------------------------------------------------
 */
class BreakableTree extends GameEntity {
  #hp;
  #chips;
  #onBroken;
  #broken = false;

  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} groundY altura do chão (a árvore fica apoiada nele)
   * @param {Phaser.GameObjects.Particles.ParticleEmitter} chips emissor de lascas
   * @param {Function} onBroken chamado quando a árvore quebra
   */
  constructor(scene, x, groundY, chips, onBroken) {
    const cfg = GameSettings.TREE;
    const sprite = scene.physics.add.image(x, groundY, cfg.TEXTURES[0])
      .setOrigin(0.5, 1)          // apoiada no chão (e tomba girando pela base)
      .setScale(cfg.SCALE)
      .setDepth(cfg.DEPTH);

    super(scene, sprite);
    this.#hp = cfg.HP;
    this.#chips = chips;
    this.#onBroken = onBroken;

    // Corpo "parede": só o tronco, da base até a copa; não cai nem é empurrado
    const body = sprite.body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.moves = false;
    body.setSize(sprite.frame.realWidth * cfg.TRUNK_WIDTH_RATIO, sprite.frame.realHeight, true);
  }

  /** @override Alcance da espada (a árvore é larga). */
  get meleeReach() {
    return GameSettings.TREE.MELEE_REACH;
  }

  /** @override */
  get canBeHit() {
    return this.isAlive && !this.#broken;
  }

  /** @override Distância até o meio do tronco (não até a base). */
  distanceFrom(other) {
    const middleY = this.y - this.sprite.displayHeight / 2;
    return Phaser.Math.Distance.Between(this.x, middleY, other.x, other.y) * 0.6;
  }

  /** @override Leva um golpe. */
  takeHit(source, damage) {
    if (!this.canBeHit) return;
    const cfg = GameSettings.TREE;
    this.#hp -= damage;

    // Pisca, balança, solta lascas e a tela treme
    const sprite = this.sprite;
    sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(70, () => { if (sprite.active) sprite.clearTint(); });
    const side = Math.sign(this.x - source.x) || 1;
    this.scene.tweens.add({ targets: sprite, angle: side * 4, duration: 60, yoyo: true, repeat: 1 });
    this.#chips.explode(cfg.CHIPS_PER_HIT, this.x, this.y - sprite.displayHeight * 0.3);
    this.scene.cameras.main.shake(cfg.HIT_SHAKE.DURATION_MS, cfg.HIT_SHAKE.INTENSITY);

    if (this.#hp <= cfg.HP / 2) this.setTextureIfChanged(cfg.TEXTURES[1]); // rachada
    if (this.#hp <= 0) this.#break(side);
  }

  /** Tomba para o lado do golpe e some, liberando a passagem. */
  #break(side) {
    const cfg = GameSettings.TREE;
    this.#broken = true;
    this.sprite.body.enable = false;
    this.#chips.explode(cfg.CHIPS_ON_BREAK, this.x, this.y - this.sprite.displayHeight * 0.4);
    this.#onBroken(this);

    this.scene.tweens.add({
      targets: this.sprite,
      angle: side * 85,
      alpha: 0,
      duration: cfg.FALL_MS,
      ease: 'Quad.easeIn',
      onComplete: () => this.destroy()
    });
  }
}
