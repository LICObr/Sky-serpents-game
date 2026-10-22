/**
 * ui_style.js
 * -----------------------------------------------------------------------------
 * Nomes das cenas e estilos de texto compartilhados por toda a interface
 * (fonte pixelada, contorno escuro), para manter tudo com a mesma cara.
 * -----------------------------------------------------------------------------
 */
const SceneKeys = Object.freeze({
  BOOT: 'BootScene',
  TITLE: 'TitleScene',     // menu principal: 1 jogador, 2 jogadores, 1v1, opções
  OPTIONS: 'OptionsScene', // teclas dos jogadores
  MENU: 'MenuScene',       // 1 jogador: escolher o personagem
  LEVEL_SELECT: 'LevelSelectScene',
  GAME: 'GameScene',
  VERSUS_SETUP: 'VersusSetupScene', // 1v1: personagens e opções
  VERSUS: 'VersusScene',            // 1v1: a luta
  ONLINE: 'OnlineScene',            // online: criar partida (código) ou entrar com o código
  PAUSE: 'PauseScene'
});

class UiStyle {
  constructor() {
    throw new TypeError('UiStyle é estático e não deve ser instanciado.');
  }

  /**
   * Estilo de texto padrão do jogo.
   * @param {number} size tamanho da fonte em px
   * @param {string} color cor do texto
   */
  static text(size, color = '#ffffff') {
    return {
      fontFamily: GameSettings.FONT.FAMILY,
      fontSize: `${size}px`,
      color,
      stroke: '#1a1020',
      strokeThickness: Math.max(3, Math.round(size / 3)),
      align: 'center'
    };
  }

  /** Cria um texto centralizado e fixo na tela (não rola com a câmera). */
  static addFixedText(scene, x, y, content, size, color) {
    return scene.add
      .text(x, y, content, UiStyle.text(size, color))
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(GameSettings.HUD.DEPTH);
  }
}
