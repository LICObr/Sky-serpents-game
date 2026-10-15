/**
 * boot_scene.js
 * -----------------------------------------------------------------------------
 * Primeira cena: carrega todas as imagens e sons mostrando uma barra de
 * progresso e depois abre o menu.
 * -----------------------------------------------------------------------------
 */
class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKeys.BOOT });
  }

  preload() {
    const { WIDTH, HEIGHT } = GameSettings.SCREEN;
    const barWidth = 360;
    const x = (WIDTH - barWidth) / 2;
    const y = HEIGHT / 2;

    this.add.text(WIDTH / 2, y - 40, 'CARREGANDO...', UiStyle.text(14)).setOrigin(0.5);
    this.add.rectangle(x, y, barWidth, 16, 0x2a1d3a).setOrigin(0, 0.5);
    const bar = this.add.rectangle(x, y, 0, 16, 0xffe066).setOrigin(0, 0.5);

    this.load.on('progress', progress => { bar.width = barWidth * progress; });
    AssetLoader.load(this, [...DragonSpriteSheets.manifestEntries(), ...BearSpriteSheet.manifestEntries()]);
  }

  create() {
    // Texturas de efeitos (brilho e faíscas das bolas de fogo)
    FxTextures.createAll(this);

    // Folhas de animação dos dragões (voar, atacar, morrer...)
    DragonSpriteSheets.registerAll(this);
    // ...e do Urso Polar (andar, pular, pisar no chão, morrer...)
    BearSpriteSheet.registerAll(this);

    // Fundos que rolam: gera versões sem corte na emenda (loop infinito)
    const { DEFAULT_TEXTURE, PHASES, SEAMLESS_BLEND } = GameSettings.BACKGROUND;
    // (fundos marcados como BACKGROUND_SEAMLESS já emendam sozinhos)
    const levelBackgrounds = LEVELS
      .filter(level => level.BACKGROUND_TEXTURE && !level.BACKGROUND_SEAMLESS)
      .map(level => level.BACKGROUND_TEXTURE);
    new Set([DEFAULT_TEXTURE, ...PHASES.map(p => p.TEXTURE), ...levelBackgrounds]).forEach(key =>
      SeamlessTexture.makeSeamless(this, key, SEAMLESS_BLEND));

    this.scene.start(SceneKeys.MENU);
  }
}
