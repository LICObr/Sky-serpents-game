/**
 * water_splash.js
 * -----------------------------------------------------------------------------
 * RESPINGO de água (gotinhas que sobem e caem) — quando alguém cai na lagoa,
 * quando o jacaré salta para fora dela e quando volta a mergulhar.
 * Um único emissor por cena, criado na primeira vez que precisa.
 * -----------------------------------------------------------------------------
 */
class WaterSplash {
  static #emitters = new WeakMap(); // cena → emissor (a cena é reaproveitada ao reiniciar)

  /**
   * Respinga no ponto (x, y).
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y superfície da água
   * @param {number} amount quantas gotinhas
   */
  static at(scene, x, y, amount = 12) {
    WaterSplash.#emitterOf(scene).explode(amount, x, y);
    SoundFx.play(scene, SoundKeys.SPLASH, { volume: Phaser.Math.Clamp(amount / 14, 0.3, 1) });
  }

  static #emitterOf(scene) {
    let emitter = WaterSplash.#emitters.get(scene);
    if (emitter) return emitter;
    emitter = scene.add.particles(FxTextureKeys.SPARK).setDepth(GameSettings.SWIM.DEPTH + 0.2)
      .createEmitter({
        on: false,
        speed: { min: 90, max: 230 },
        angle: { min: 230, max: 310 },   // para cima, abrindo
        gravityY: 700,
        lifespan: { min: 350, max: 650 },
        scale: { start: 0.55, end: 0.15 },
        alpha: { start: 0.9, end: 0 },
        tint: [0xd8f4f0, 0xa8d8d0, 0x7fb4c0]
      });
    WaterSplash.#emitters.set(scene, emitter);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => WaterSplash.#emitters.delete(scene));
    return emitter;
  }
}
