/**
 * zoomed_cameras.js
 * -----------------------------------------------------------------------------
 * Câmera AFASTADA (zoom menor que 1) para caber uma arena inteira na tela
 * (1v1) sem encolher o fundo nem a interface. São três câmeras,
 * desenhadas nesta ordem:
 *   fundo  → o que fica preso na tela ATRÁS de tudo (o fundo, o céu dos raios);
 *   mundo  → o cenário, os personagens e os bichos, com o zoom. Ela vira a
 *            câmera principal: tremidas e worldView continuam valendo;
 *   frente → o que fica preso na tela NA FRENTE (chuva, escuridão, HUD, avisos).
 * A cada quadro cada objeto é mandado para a câmera certa: preso na tela
 * (scrollFactor 0 — nas partículas, quem diz é o emissor) vai para o fundo
 * (profundidade negativa) ou para a frente; o resto é do mundo.
 * -----------------------------------------------------------------------------
 */
class ZoomedCameras {
  #scene;
  #back;
  #world;
  #front;

  /**
   * @param {Phaser.Scene} scene
   * @param {number} zoom ex.: 0.7 = mostra 1/0.7 da tela em cada direção
   * @param {number} centerX ponto do mundo no meio da tela
   * @param {number} centerY
   */
  constructor(scene, zoom, centerX, centerY) {
    const { WIDTH, HEIGHT } = GameSettings.SCREEN;
    this.#scene = scene;
    this.#back = scene.cameras.main; // a primeira: desenhada antes das outras
    this.#world = scene.cameras.add(0, 0, WIDTH, HEIGHT, true).setZoom(zoom).centerOn(centerX, centerY);
    this.#front = scene.cameras.add(0, 0, WIDTH, HEIGHT);
    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.#route, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.#route, this));
    this.#route();
  }

  /** Cada objeto só é desenhado pela câmera dele. */
  #route() {
    const all = this.#back.id | this.#world.id | this.#front.id;
    this.#scene.children.list.forEach(object => {
      object.cameraFilter = all & ~this.#cameraFor(object).id;
    });
  }

  #cameraFor(object) {
    if (!ZoomedCameras.#fixedOnScreen(object)) return this.#world;
    return object.depth < 0 ? this.#back : this.#front;
  }

  static #fixedOnScreen(object) {
    if (object.type === 'ParticleEmitterManager') {
      const emitters = object.emitters.list;
      return emitters.length > 0 && emitters.every(emitter => emitter.scrollFactorX === 0);
    }
    return object.scrollFactorX === 0;
  }
}
