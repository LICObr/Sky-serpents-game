/**
 * main.js
 * -----------------------------------------------------------------------------
 * Ponto de entrada: espera a fonte pixelada carregar (para os textos não
 * aparecerem com a fonte errada), monta a configuração do Phaser e inicia
 * o jogo. Deve ser o ÚLTIMO script carregado no index.html.
 * -----------------------------------------------------------------------------
 */
const gameConfig = {
  type: Phaser.AUTO,
  width: GameSettings.SCREEN.WIDTH,
  height: GameSettings.SCREEN.HEIGHT,
  backgroundColor: GameSettings.SCREEN.BACKGROUND_COLOR,
  parent: document.body,
  // Ajusta o jogo ao tamanho da janela mantendo a proporção 800x600
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: GameSettings.PHYSICS.GRAVITY_Y },
      debug: GameSettings.PHYSICS.DEBUG
    }
  },
  scene: [BootScene, MenuScene, LevelSelectScene, GameScene]
};

/** Espera a fonte (no máximo 1,5 s — sem internet usa a fonte padrão). */
function waitForFont() {
  const timeout = new Promise(resolve => setTimeout(resolve, 1500));
  const font = document.fonts ? document.fonts.load('16px "Press Start 2P"') : Promise.resolve();
  return Promise.race([font, timeout]).catch(() => {});
}

waitForFont().then(() => {
  window.game = new Phaser.Game(gameConfig);
});
