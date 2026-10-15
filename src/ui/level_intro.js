/**
 * level_intro.js
 * -----------------------------------------------------------------------------
 * ABERTURA de uma fase (ex.: fase 4 → "THE BEAR ATTACKS..."): uma imagem
 * no centro da tela com um título acima. Fica alguns segundos e some em fade.
 * Enquanto aparece, o mundo fica pausado (ninguém se mexe).
 *
 * Configurada na fase: INTRO: { TEXTURE, TITLE }.
 * -----------------------------------------------------------------------------
 */
class LevelIntro {
  /**
   * @param {Phaser.Scene} scene
   * @param {{TEXTURE: string, TITLE: string}} intro
   * @param {Function} onDone chamado quando a abertura termina
   */
  static play(scene, intro, onDone) {
    const cfg = GameSettings.LEVEL_INTRO;
    const { WIDTH, HEIGHT } = GameSettings.SCREEN;
    const depth = GameSettings.HUD.DEPTH + 1;

    const shade = scene.add.rectangle(0, 0, WIDTH, HEIGHT, 0x05080c, cfg.SHADE_ALPHA)
      .setOrigin(0).setScrollFactor(0).setDepth(depth);
    const image = scene.add.image(WIDTH / 2, HEIGHT / 2 + cfg.IMAGE_OFFSET_Y, intro.TEXTURE)
      .setScale(cfg.IMAGE_SCALE * 0.85).setScrollFactor(0).setDepth(depth);
    const title = UiStyle.addFixedText(scene, WIDTH / 2, image.y - image.displayHeight * 0.6 - cfg.TITLE_GAP,
      intro.TITLE, cfg.TITLE_SIZE, '#ffe066').setDepth(depth);
    const parts = [shade, image, title];

    scene.physics.pause();
    parts.forEach(p => p.setAlpha(0));
    // Entra: aparece e o urso "cresce" um pouquinho
    scene.tweens.add({ targets: parts, alpha: 1, duration: cfg.FADE_IN_MS });
    scene.tweens.add({ targets: image, scale: cfg.IMAGE_SCALE, duration: cfg.HOLD_MS, ease: 'Sine.easeOut' });
    scene.cameras.main.shake(cfg.FADE_IN_MS + 200, 0.004);

    // Sai: some em fade e o jogo começa
    scene.tweens.add({
      targets: parts,
      alpha: 0,
      delay: cfg.FADE_IN_MS + cfg.HOLD_MS,
      duration: cfg.FADE_OUT_MS,
      onComplete: () => {
        parts.forEach(p => p.destroy());
        scene.physics.resume();
        onDone();
      }
    });
  }
}
