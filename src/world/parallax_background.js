/**
 * parallax_background.js
 * -----------------------------------------------------------------------------
 * Fundo fixo na tela que rola sozinho e acompanha a câmera mais devagar
 * (efeito parallax). Cada fase tem um tom de cor próprio, e na luta contra
 * o chefão a imagem muda conforme a vida dele cai (80% / 40%).
 *
 * Troca com FADE: são duas camadas. A imagem nova aparece por cima da
 * antiga, ficando opaca aos poucos; quando termina, vira a camada de baixo.
 *
 * Cada imagem é ESCALADA para ocupar a altura inteira da tela, assim ela
 * só se repete na horizontal — sem corte na emenda (as ferramentas já geram
 * os fundos espelhados; os que não vêm assim passam pelo SeamlessTexture).
 * -----------------------------------------------------------------------------
 */
class ParallaxBackground {
  static DEPTH = -2; // atrás de tudo (o céu dos relâmpagos fica entre ele e o chão)

  #scene;
  #base;      // camada de baixo (fundo atual)
  #overlay;   // camada de cima (fundo novo aparecendo durante o fade)
  #targetTexture;
  #lightLayers = []; // camadas extras por cima (ex.: o fundo iluminado do relâmpago)
  #fadeTween = null;
  #scrolledPixels = 0; // quanto o fundo já andou, em pixels de TELA

  /**
   * @param {Phaser.Scene} scene
   * @param {number} tint cor aplicada ao fundo (0xffffff = sem tom)
   * @param {string} [texture] fundo próprio da fase (padrão: vale dos castelos)
   */
  constructor(scene, tint, texture = GameSettings.BACKGROUND.DEFAULT_TEXTURE) {
    this.#scene = scene;
    this.#base = this.#createLayer(texture, tint);
    this.#overlay = this.#createLayer(texture, tint).setAlpha(0).setVisible(false);
    this.#targetTexture = texture;
  }

  /** Atualiza a rolagem das duas camadas (chamar a cada frame). */
  update() {
    const { SCROLL_SPEED, PARALLAX } = GameSettings.BACKGROUND;
    this.#scrolledPixels += SCROLL_SPEED;
    const screenOffset = this.#scrolledPixels + this.#scene.cameras.main.scrollX * PARALLAX;

    // tilePosition é medido em pixels da IMAGEM: converte da tela para a imagem
    [this.#base, this.#overlay, ...this.#lightLayers].forEach(layer => {
      layer.tilePositionX = screenOffset / layer.tileScaleX;
    });
  }

  /**
   * Camada por cima do fundo, transparente, que rola junto com ele (ex.: o
   * mesmo cenário iluminado pelo relâmpago). Quem chamou controla a opacidade.
   * @param {string} texture
   * @returns {Phaser.GameObjects.TileSprite}
   */
  addLightLayer(texture) {
    const layer = this.#createLayer(texture, 0xffffff).setAlpha(0).setDepth(ParallaxBackground.DEPTH + 0.1);
    this.#lightLayers.push(layer);
    return layer;
  }

  /**
   * Escolhe o fundo de acordo com a porcentagem de vida do chefão.
   * @param {number} hpRatio vida atual / vida máxima (0 a 1)
   */
  updatePhase(hpRatio) {
    const { PHASES, DEFAULT_TEXTURE } = GameSettings.BACKGROUND;
    const phase = PHASES.find(p => hpRatio <= p.MAX_HP_RATIO);
    this.#fadeTo(phase ? phase.TEXTURE : DEFAULT_TEXTURE);
  }

  /** Faz a imagem nova aparecer suavemente por cima da atual. */
  #fadeTo(texture) {
    if (texture === this.#targetTexture) return;
    this.#targetTexture = texture;

    // Se ainda estava num fade anterior, conclui ele na hora
    if (this.#fadeTween) {
      this.#fadeTween.stop();
      this.#finishFade();
    }

    ParallaxBackground.#applyTexture(this.#overlay, texture);
    this.#overlay.setAlpha(0).setVisible(true);
    this.#fadeTween = this.#scene.tweens.add({
      targets: this.#overlay,
      alpha: 1,
      duration: GameSettings.BACKGROUND.PHASE_FADE_MS,
      ease: 'Sine.easeInOut',
      onComplete: () => this.#finishFade()
    });
  }

  /** A camada de baixo passa a ser a imagem nova; a de cima some. */
  #finishFade() {
    ParallaxBackground.#applyTexture(this.#base, this.#targetTexture);
    this.#overlay.setAlpha(0).setVisible(false);
    this.#fadeTween = null;
  }

  #createLayer(texture, tint) {
    const { WIDTH, HEIGHT } = GameSettings.SCREEN;
    const layer = this.#scene.add
      .tileSprite(0, 0, WIDTH, HEIGHT, texture)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(ParallaxBackground.DEPTH)
      .setTint(tint);
    ParallaxBackground.#applyTexture(layer, texture);
    return layer;
  }

  /** Troca a imagem e ajusta a escala para cobrir a altura da tela. */
  static #applyTexture(layer, texture) {
    layer.setTexture(texture);
    // displayFrame = a imagem original (frame é o canvas interno do TileSprite)
    const scale = GameSettings.SCREEN.HEIGHT / layer.displayFrame.realHeight;
    layer.setTileScale(scale, scale);
    layer.tilePositionY = 0;
  }
}
