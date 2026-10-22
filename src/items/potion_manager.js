/**
 * potion_manager.js
 * -----------------------------------------------------------------------------
 * Poções de vida:
 *   - no percurso: ficam em lugares fixos definidos no arquivo da fase;
 *   - na arena do chefão: surgem sobre uma plataforma depois de um tempo
 *     sorteado (raras), se a anterior já tiver sido pega.
 * Ao coletar, o jogador recupera um coração.
 * -----------------------------------------------------------------------------
 */
class PotionManager {
  #scene;
  #group;
  #arenaStarted = false;
  #arenaPotion = null;   // poção da arena (independente das do percurso)

  /**
   * @param {Phaser.Scene} scene
   * @param {number[][]} positions poções fixas [x, y]
   */
  constructor(scene, positions) {
    this.#scene = scene;
    this.#group = scene.physics.add.group({ allowGravity: false });
    positions.forEach(([x, y]) => this.#create(x, y));
  }

  /** Grupo de física (usado para registrar a coleta na cena). */
  get group() {
    return this.#group;
  }

  /**
   * Começa a gerar poções na arena: cada uma surge depois de um tempo
   * SORTEADO (raro), numa plataforma qualquer — se não houver outra poção
   * da arena esperando para ser pega.
   * @param {Phaser.GameObjects.GameObject[]} arenaPlatforms
   * @param {{MIN: number, MAX: number}} delayMs intervalo sorteado (depende da dificuldade)
   */
  startArenaSpawning(arenaPlatforms, delayMs) {
    if (this.#arenaStarted || arenaPlatforms.length === 0) return;
    this.#arenaStarted = true;

    const scheduleNext = () => {
      this.#scene.time.delayedCall(Phaser.Math.Between(delayMs.MIN, delayMs.MAX), () => {
        const waiting = this.#arenaPotion && this.#arenaPotion.active;
        if (!waiting) {
          const platform = Phaser.Utils.Array.GetRandom(arenaPlatforms);
          this.#arenaPotion = this.#create(platform.x, platform.y + GameSettings.POTION.ARENA_OFFSET_Y, true);
        }
        scheduleNext();
      });
    };
    scheduleNext();
  }

  /** Chamado quando um jogador encosta na poção (ele recupera um coração). */
  collect(potion, player) {
    if (!potion.active) return;
    SoundFx.play(potion.scene, SoundKeys.POTION);
    potion.destroy();
    player.health.heal();
  }

  /**
   * Cria uma poção flutuando levemente.
   * @param {boolean} popIn aparece com um "pulinho" (poções da arena)
   */
  #create(x, y, popIn = false) {
    const cfg = GameSettings.POTION;
    const potion = this.#group.create(x, y, cfg.TEXTURE).setScale(cfg.SCALE);
    potion.body.setAllowGravity(false);

    if (popIn) {
      potion.setScale(0);
      this.#scene.tweens.add({ targets: potion, scale: cfg.SCALE, duration: 350, ease: 'Back.easeOut' });
    }
    this.#scene.tweens.add({
      targets: potion,
      y: y - cfg.FLOAT_AMPLITUDE,
      duration: cfg.FLOAT_DURATION_MS,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    return potion;
  }
}
