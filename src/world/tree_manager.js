/**
 * tree_manager.js
 * -----------------------------------------------------------------------------
 * Cria as árvores quebráveis de uma fase (TREES em levels.js), coloca-as no
 * combate (para espada e flechas acertarem) e guarda um grupo para as
 * colisões (jogador e bichos esbarram nelas). Também é dono do efeito de
 * lascas de madeira.
 * -----------------------------------------------------------------------------
 */
class TreeManager {
  #group;

  /**
   * @param {Phaser.Scene} scene
   * @param {number[]} positions posições x das árvores
   * @param {LevelMap} levelMap para apoiar cada árvore no chão
   * @param {CombatRegistry} combat
   */
  constructor(scene, positions, levelMap, combat) {
    this.#group = scene.add.group();

    const chips = scene.add.particles(FxTextureKeys.SPARK)
      .setDepth(GameSettings.TREE.DEPTH + 0.1)
      .createEmitter({
        on: false,                                // só solta quando "explode"
        speed: { min: 80, max: 220 },
        angle: { min: 200, max: 340 },            // para cima e para os lados
        gravityY: 600,
        lifespan: 700,
        scale: { start: 0.45, end: 0.1 },
        tint: [0x8a5a2b, 0x6b4423, 0xb07a40, 0x4f8a4f]
      });

    positions.forEach(x => {
      const groundY = levelMap.surfaceYAt(x) ?? GameSettings.LEVEL.GROUND_TOP;
      const tree = new BreakableTree(scene, x, groundY, chips, broken => {
        combat.unregister(broken);
        this.#group.remove(broken.sprite);
      });
      this.#group.add(tree.sprite);
      combat.register(tree, false); // atingível, mas encostar não machuca
    });
  }

  /** Grupo das árvores (para colisões). */
  get group() {
    return this.#group;
  }
}
