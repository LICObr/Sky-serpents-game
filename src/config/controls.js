/**
 * controls.js
 * -----------------------------------------------------------------------------
 * TECLAS dos jogadores. Cada ação tem uma tecla por jogador; elas podem ser
 * trocadas na tela de OPÇÕES (a escolha fica guardada por KeyBindings).
 *   - jogando SOZINHO valem as teclas dos dois jogadores (WASD ou setas...);
 *   - com DOIS jogadores cada um usa só as suas.
 * Os nomes das teclas são os de Phaser.Input.Keyboard.KeyCodes.
 * -----------------------------------------------------------------------------
 */
const ControlAction = Object.freeze({
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
  JUMP: 'JUMP',
  DUCK: 'DUCK',
  ATTACK: 'ATTACK',
  SPECIAL: 'SPECIAL'
});

const CONTROLS = deepFreeze({
  // Nome de cada ação na tela de opções (na ordem em que aparecem)
  ACTION_LABELS: {
    [ControlAction.LEFT]: 'Esquerda',
    [ControlAction.RIGHT]: 'Direita',
    [ControlAction.JUMP]: 'Pular',
    [ControlAction.DUCK]: 'Agachar',
    [ControlAction.ATTACK]: 'Atacar',
    [ControlAction.SPECIAL]: 'Especial'
  },
  // Teclas padrão: jogador 1 no lado esquerdo do teclado, jogador 2 no direito
  DEFAULTS: [
    { LEFT: 'A', RIGHT: 'D', JUMP: 'W', DUCK: 'S', ATTACK: 'SPACE', SPECIAL: 'G' },
    { LEFT: 'LEFT', RIGHT: 'RIGHT', JUMP: 'UP', DUCK: 'DOWN', ATTACK: 'K', SPECIAL: 'L' }
  ],
  // Teclas a mais quando joga sozinho (passador de slides)
  SOLO_EXTRAS: { JUMP: ['PAGE_UP'], DUCK: ['PAGE_DOWN'] },
  // Teclas da pausa e das telas de fim: não podem virar controle
  RESERVED: ['ESC', 'ENTER', 'P', 'R', 'F', 'M'],
  // Nome mostrado na tela para as teclas que não são letras
  KEY_LABELS: {
    SPACE: 'ESPAÇO', LEFT: 'SETA ESQ', RIGHT: 'SETA DIR', UP: 'SETA CIMA', DOWN: 'SETA BAIXO',
    COMMA: ',', PERIOD: '.', FORWARD_SLASH: '/', BACK_SLASH: '\\', SEMICOLON: ';', MINUS: '-',
    PLUS: '=', QUOTES: "'", BACKTICK: '`', OPEN_BRACKET: '[', CLOSED_BRACKET: ']',
    BACKSPACE: 'APAGAR', DELETE: 'DEL', CAPS_LOCK: 'CAPS', PAGE_UP: 'PG UP', PAGE_DOWN: 'PG DOWN'
  },
  STORAGE_KEY: 'skySerpents.controls'
});
