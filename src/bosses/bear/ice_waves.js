/**
 * ice_waves.js
 * -----------------------------------------------------------------------------
 * ONDAS DE GELO do terremoto do Urso Polar: espinhos de gelo que brotam do
 * chão e correm pela arena. O jogador precisa PULAR por cima — encostar
 * machuca (é o impacto da pisada do urso).
 *
 * As ondas são reaproveitadas (pool) e somem ao sair da arena.
 * -----------------------------------------------------------------------------
 */
class IceWaves {
  #scene;
  #arena;
  #group;
  #snow;

  /**
   * @param {Phaser.Scene} scene
   * @param {BossArena} arena
   * @param {PlayerParty} players (quem encostar leva dano)
   * @param {Function} snowPuff (x, y, quantidade) → neve espirrando
   */
  constructor(scene, arena, players, snowPuff) {
    this.#scene = scene;
    this.#arena = arena;
    this.#snow = snowPuff;
    this.#group = scene.physics.add.group({ allowGravity: false });

    scene.physics.add.overlap(players.sprites, this.#group, (playerSprite, wave) => {
      if (wave.active && wave.getData('armed')) playerSprite.getData('owner').hitByContact(ProjectileEffect.NONE);
    });
  }

  /**
   * Solta uma onda.
   * @param {number} x de onde sai
   * @param {number} direction 1 = direita, -1 = esquerda
   * @param {number} speed px/s
   */
  spawn(x, direction, speed) {
    const cfg = GameSettings.POLAR_BEAR.WAVE;
    const floor = GameSettings.LEVEL.GROUND_TOP;
    const wave = this.#group.get(x, floor, FxTextureKeys.ICE_WAVE);
    if (!wave) return;

    wave.enableBody(true, x, floor, true, true);
    wave.body.setAllowGravity(false);
    wave.setOrigin(0.5, 1).setDepth(GameSettings.BOSS.DEPTH + 0.6).setFlipX(direction < 0);
    wave.body.setSize(cfg.WIDTH, cfg.HEIGHT);
    wave.setVelocityX(direction * speed);
    wave.setData('armed', true);
    wave.setData('nextPuff', 0);

    // Os espinhos "brotam" do chão e ficam tremendo enquanto correm
    wave.setScale(cfg.SCALE, 0.1);
    this.#scene.tweens.add({ targets: wave, scaleY: cfg.SCALE, duration: 120, ease: 'Back.easeOut' });
  }

  /** Move/limpa as ondas (chamar a cada frame). */
  update(now) {
    this.#group.getChildren().forEach(wave => {
      if (!wave.active) return;
      if (wave.x < this.#arena.left - 40 || wave.x > this.#arena.right + 40) {
        this.#group.killAndHide(wave);
        wave.body.enable = false;
        return;
      }
      wave.setScale(wave.scaleX, wave.scaleY * (0.97 + Math.random() * 0.06));
      if (now >= wave.getData('nextPuff')) {
        wave.setData('nextPuff', now + 70);
        this.#snow(wave.x, GameSettings.LEVEL.GROUND_TOP - 4, 2);
      }
    });
  }

  /** Some com todas as ondas (ex.: urso derrotado). */
  clear() {
    this.#group.getChildren().forEach(wave => {
      if (!wave.active) return;
      wave.setData('armed', false);
      this.#scene.tweens.add({
        targets: wave, scaleY: 0, alpha: 0, duration: 200,
        onComplete: () => { this.#group.killAndHide(wave); wave.body.enable = false; wave.setAlpha(1); }
      });
    });
  }

  destroy() {
    this.#group.destroy(true);
  }
}
