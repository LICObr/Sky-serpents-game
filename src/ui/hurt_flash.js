/**
 * hurt_flash.js
 * -----------------------------------------------------------------------------
 * Perdeu um coração: as BORDAS da tela piscam em vermelho, bem de leve (o
 * meio continua limpo), para o jogador perceber na hora que se machucou.
 * -----------------------------------------------------------------------------
 */
class HurtFlash {
  static #layers = new WeakMap(); // a camada vermelha de cada cena (criada na primeira vez)

  constructor() {
    throw new TypeError('HurtFlash é estático e não deve ser instanciado.');
  }

  /** Pisca as bordas da tela. */
  static play(scene) {
    const { PEAK_ALPHA, IN_MS, OUT_MS } = GameSettings.HUD.HURT_FLASH;
    const layer = HurtFlash.#layerOf(scene);
    scene.tweens.killTweensOf(layer);
    layer.setAlpha(0);
    scene.tweens.add({
      targets: layer, alpha: PEAK_ALPHA, duration: IN_MS, ease: 'Quad.easeOut',
      onComplete: () => scene.tweens.add({ targets: layer, alpha: 0, duration: OUT_MS, ease: 'Quad.easeIn' })
    });
  }

  /** A camada da cena (a cena é reaproveitada ao reiniciar: confere se a camada ainda existe). */
  static #layerOf(scene) {
    let layer = HurtFlash.#layers.get(scene);
    if (!layer || !layer.scene) {
      const { WIDTH, HEIGHT } = GameSettings.SCREEN;
      layer = scene.add.image(0, 0, FxTextureKeys.VIGNETTE).setOrigin(0, 0).setDisplaySize(WIDTH, HEIGHT)
        .setScrollFactor(0).setDepth(GameSettings.HUD.DEPTH - 0.5).setAlpha(0);
      HurtFlash.#layers.set(scene, layer);
    }
    return layer;
  }
}
