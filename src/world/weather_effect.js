/**
 * weather_effect.js
 * -----------------------------------------------------------------------------
 * Efeito de CLIMA da fase, preso à tela (não rola com a câmera):
 *   SNOW     → flocos de neve caindo devagar, balançando com o vento
 *   EMBERS   → brasas e vaga-lumes alaranjados subindo do chão
 *   SPARKLES → brilhos mágicos rosa/lilás que surgem e piscam no ar
 *   LIGHT_SNOW → poucos flocos de neve
 *   FOG      → grandes bancos de neblina atravessando a tela devagar
 * Uma fase pode combinar vários (ex.: neve fraca + neblina).
 *
 * Feito com partículas (textura fx_spark, colorida com "tint").
 * -----------------------------------------------------------------------------
 */
class WeatherEffect {
  /**
   * @param {Phaser.Scene} scene
   * @param {string[]} types valores de WeatherType
   */
  constructor(scene, types) {
    types.forEach(type => {
      const config = WeatherEffect.#configs()[type];
      if (!config) return;
      // A neblina usa o brilho grande e macio; o resto, a faísca pequena
      const texture = type === WeatherType.FOG ? FxTextureKeys.GLOW : FxTextureKeys.SPARK;
      const particles = scene.add.particles(texture);
      particles.setDepth(GameSettings.HUD.DEPTH - 1);
      // No Phaser 3.55 quem "não rola com a câmera" é o emissor (não o gerenciador)
      particles.createEmitter(config).setScrollFactor(0);
    });
  }

  /** Configuração das partículas de cada clima. */
  static #configs() {
    const { WIDTH, HEIGHT } = GameSettings.SCREEN;
    return {
      [WeatherType.SNOW]: {
        x: { min: -40, max: WIDTH + 40 },
        y: -10,
        lifespan: 9000,
        speedY: { min: 30, max: 75 },
        speedX: { min: -25, max: 15 },
        accelerationX: { min: -6, max: 6 },   // vento balançando os flocos
        scale: { min: 0.25, max: 0.6 },
        alpha: { start: 0.95, end: 0.6 },
        rotate: { min: 0, max: 360 },
        tint: [0xffffff, 0xeaf6ff, 0xd8ecff],
        frequency: 70,
        quantity: 1
      },
      [WeatherType.EMBERS]: {
        x: { min: 0, max: WIDTH },
        y: HEIGHT + 10,
        lifespan: { min: 4000, max: 7000 },
        speedY: { min: -55, max: -20 },
        speedX: { min: -12, max: 12 },
        accelerationX: { min: -8, max: 8 },
        scale: { start: 0.45, end: 0 },
        alpha: { start: 0.9, end: 0 },
        tint: [0xffd27f, 0xffa040, 0xff6a20, 0xfff2b0],
        blendMode: 'ADD',
        frequency: 260,
        quantity: 1
      },
      [WeatherType.LIGHT_SNOW]: {
        x: { min: -40, max: WIDTH + 40 },
        y: -10,
        lifespan: 10000,
        speedY: { min: 25, max: 55 },
        speedX: { min: -15, max: 10 },
        accelerationX: { min: -5, max: 5 },
        scale: { min: 0.2, max: 0.45 },
        alpha: { start: 0.85, end: 0.5 },
        tint: [0xffffff, 0xeaf6ff],
        frequency: 220,
        quantity: 1
      },
      [WeatherType.FOG]: {
        x: -200,
        y: { min: HEIGHT * 0.35, max: HEIGHT - 40 },
        lifespan: 26000,
        speedX: { min: 30, max: 55 },
        speedY: { min: -3, max: 3 },
        scale: { min: 4, max: 7 },       // bancos de névoa grandes
        alpha: { start: 0.18, end: 0.08 },
        tint: [0xe6f2ee, 0xd6e8e2],
        frequency: 1400,
        quantity: 1
      },
      [WeatherType.SPARKLES]: {
        x: { min: 0, max: WIDTH },
        y: { min: 40, max: HEIGHT - 80 },
        lifespan: { min: 900, max: 1800 },
        speedY: { min: -12, max: 12 },
        speedX: { min: -12, max: 12 },
        scale: { start: 0, end: 0.7, ease: 'Sine.easeOut' },
        alpha: { start: 1, end: 0 },
        tint: [0xff9ad9, 0xffd6f2, 0xc89aff, 0xffffff],
        blendMode: 'ADD',
        frequency: 110,
        quantity: 1
      }
    };
  }
}
