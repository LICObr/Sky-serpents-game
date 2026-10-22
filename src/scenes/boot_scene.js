/**
 * boot_scene.js
 * -----------------------------------------------------------------------------
 * Primeira cena: carrega todas as imagens e sons e depois abre o menu.
 * Primeiro carrega só um fundo e um bicho sorteados (rapidinho) e monta a
 * tela de carregamento com eles (LoadingShowcase); depois carrega o resto,
 * com o bicho andando em cima da barrinha.
 * -----------------------------------------------------------------------------
 */
class BootScene extends Phaser.Scene {
  #choice;
  #showcase = null;
  #waitText;

  constructor() {
    super({ key: SceneKeys.BOOT });
  }

  /** 1º: só o fundo e o bicho sorteados para a tela de carregamento. */
  preload() {
    const { WIDTH, HEIGHT } = GameSettings.SCREEN;
    this.#waitText = this.add.text(WIDTH / 2, HEIGHT / 2, 'CARREGANDO...', UiStyle.text(14)).setOrigin(0.5);
    this.#choice = LoadingShowcase.pick();
    LoadingShowcase.preload(this, this.#choice);
  }

  /** 2º: monta a tela de carregamento e carrega o resto do jogo. */
  create() {
    this.#waitText.destroy();
    this.#showcase = new LoadingShowcase(this, this.#choice);
    this.load.on('progress', progress => this.#showcase.setProgress(progress));
    this.load.once('complete', () => this.#showcase.finish(() => this.#ready()));
    AssetLoader.load(this, [
      ...DragonSpriteSheets.manifestEntries(),
      ...BearSpriteSheet.manifestEntries(),
      ...QueenBeeSpriteSheet.manifestEntries()
    ]);
    this.load.start();
  }

  update(time, delta) {
    if (this.#showcase) this.#showcase.update(time, delta);
  }

  /** Tudo carregado: prepara texturas e animações e abre o menu. */
  #ready() {
    // Texturas de efeitos (brilho e faíscas das bolas de fogo)
    FxTextures.createAll(this);

    // Folhas de animação dos dragões (voar, atacar, morrer...)
    DragonSpriteSheets.registerAll(this);
    // ...do Urso Polar (andar, pular, pisar no chão, morrer...)
    BearSpriteSheet.registerAll(this);
    // ...e da Abelha Rainha (voando, atacando)
    QueenBeeSpriteSheet.registerAll(this);

    // Fundos que rolam: gera versões sem corte na emenda (loop infinito)
    // (o fundo padrão, os do chefão e os marcados como BACKGROUND_SEAMLESS já
    // vêm espelhados das ferramentas e emendam sozinhos)
    const levelBackgrounds = LEVELS
      .filter(level => level.BACKGROUND_TEXTURE && !level.BACKGROUND_SEAMLESS)
      .map(level => level.BACKGROUND_TEXTURE);
    new Set(levelBackgrounds).forEach(key =>
      SeamlessTexture.makeSeamless(this, key, GameSettings.BACKGROUND.SEAMLESS_BLEND));

    this.#showcase = null;
    this.scene.start(SceneKeys.TITLE);
  }
}
