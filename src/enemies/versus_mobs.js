/**
 * versus_mobs.js
 * -----------------------------------------------------------------------------
 * Bichos do 1v1: mantém `count` bichos da noite na arena (de chão e
 * voadores, sorteados de MOBS da arena). Eles atacam quem estiver mais perto
 * — os dois jogadores. Quando um morre (ou some), outro aparece depois de um
 * tempinho, num lugar longe dos jogadores, com um brilho avisando.
 * -----------------------------------------------------------------------------
 */
class VersusMobs {
  #scene;
  #enemies;
  #party;
  #arena;
  #count;
  #alive = new Set();

  /**
   * @param {Phaser.Scene} scene
   * @param {EnemyManager} enemies quem cria e atualiza os bichos
   * @param {PlayerParty} party para nascer longe dos jogadores
   * @param {object} arena LEVEL_VERSUS (MOBS e o tamanho do mundo)
   * @param {number} count quantos bichos ao mesmo tempo
   */
  constructor(scene, enemies, party, arena, count) {
    this.#scene = scene;
    this.#enemies = enemies;
    this.#party = party;
    this.#arena = arena;
    this.#count = count;
    for (let i = 0; i < count; i++) this.#schedule(1200 + i * 700);
  }

  /** Bicho que morreu (ou foi embora) dá lugar a outro (chamar a cada frame). */
  update() {
    this.#alive.forEach(enemy => {
      if (enemy.isActive) return;
      this.#alive.delete(enemy);
      const { MIN, MAX } = GameSettings.VERSUS.MOB_RESPAWN_MS;
      this.#schedule(Phaser.Math.Between(MIN, MAX));
    });
  }

  #schedule(delay) {
    this.#scene.time.delayedCall(delay, () => this.#spawn());
  }

  /** Um bicho novo: de chão no chão, voador no ar, longe dos jogadores. */
  #spawn() {
    if (this.#alive.size >= this.#count) return;
    const { WALKERS, FLYERS, FLYER_Y } = this.#arena.MOBS;
    const flies = Phaser.Math.Between(0, 1) === 1;
    const x = this.#freeX();
    const spawn = flies
      ? { TYPE: Phaser.Utils.Array.GetRandom(FLYERS), X: x, Y: Phaser.Math.Between(FLYER_Y.MIN, FLYER_Y.MAX) }
      : { TYPE: Phaser.Utils.Array.GetRandom(WALKERS), X: x };
    const enemy = this.#enemies.spawnEnemy(spawn);
    this.#alive.add(enemy);
    const glow = this.#scene.add.image(enemy.x, enemy.y, FxTextureKeys.GLOW)
      .setTint(0xb8a0ff).setScale(0.3).setDepth(GameSettings.ENEMY.DEPTH + 0.5);
    this.#scene.tweens.add({ targets: glow, scale: 1, alpha: 0, duration: 420, onComplete: () => glow.destroy() });
  }

  /** Um x longe dos dois jogadores (se não achar, o meio da arena). */
  #freeX() {
    const width = this.#arena.ARENA_START_X + GameSettings.LEVEL.ARENA_WIDTH;
    const { MOB_SAFE_DISTANCE } = GameSettings.VERSUS;
    for (let i = 0; i < 12; i++) {
      const x = Phaser.Math.Between(60, width - 60);
      if (this.#party.inGame.every(player => Math.abs(player.x - x) > MOB_SAFE_DISTANCE)) return x;
    }
    return width / 2;
  }
}
