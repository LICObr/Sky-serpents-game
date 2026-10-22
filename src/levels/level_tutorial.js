/**
 * level_tutorial.js — FASE 1: Tutorial
 * -----------------------------------------------------------------------------
 * Sem chefão (termina na bandeira de chegada). O que cada campo significa:
 * veja level_helpers.js.
 * Um campo curtinho e tranquilo para aprender os controles, quase sem texto:
 * conforme o jogador anda aparecem as TECLAS configuradas (TUTORIAL.HINTS:
 * andar, pular, bater, especial, agachar/escudo) e, quando um bicho novo
 * aparece, o jogo dá uma pausinha com o cartão dele (TUTORIAL.MOBS).
 * Tem um degrau para pular, um buraquinho e uma árvore para quebrar batendo.
 *
 * NUMBER é só o identificador do progresso guardado (0); o número que aparece
 * no jogo é a posição na lista de levels.js (o tutorial é a Fase 1).
 * -----------------------------------------------------------------------------
 */
const LEVEL_TUTORIAL = {
  NUMBER: 0,
  NAME: 'Tutorial',
  BACKGROUND_TINT: 0xffffff,
  TERRAIN: TerrainThemeId.MEADOW,
  CHALLENGE: {
    ENEMY_SPEED: 0.8,
    BOSS_SPEED: 1, SHOT_CHANCE: 1, PROJECTILE_SPEED: 1, SPECIAL_INTERVAL: 1
  },
  ARENA_START_X: 3000,                 // começo da reta da bandeira
  STAR_TIMES: { THREE: 60, TWO: 100, ONE: 180 }, // segundos para 3, 2 e 1 estrela
  GROUND: [
    [0, 640],                          // só andar
    [640, 300, 48],                    // degrau: pular
    [1004, 1996]                       // depois do buraquinho, até o fim
  ],
  RAMPS: [],
  PLATFORMS: [[2250, 470], [2390, 400]],
  TREES: [1250],                       // árvore no caminho: quebre batendo
  ENEMIES: [
    walker(EnemyTypeId.SLIME, 1900),
    flyer(EnemyTypeId.BAT, 2550, 380),
    walker(EnemyTypeId.SLIME, 2800)
  ],
  POTIONS: [[2390, 340]],
  CHECKPOINTS: [100, 1040, 2000],
  TUTORIAL: {
    // a partir de X aparece a dica (as teclas configuradas das ações + uma palavra)
    HINTS: [
      { X: 0, ACTIONS: ['LEFT', 'RIGHT'], TEXT: 'andar' },
      { X: 360, ACTIONS: ['JUMP'], TEXT: 'pular' },
      { X: 1040, ACTIONS: ['ATTACK'], TEXT: 'bater' },
      { X: 1420, ACTIONS: ['SPECIAL'], TEXT: 'especial' },
      { X: 2150, ACTIONS: ['DUCK'], TEXT: 'agachar = escudo' }
    ],
    // quando o bicho aparece na tela: pausinha com o cartão dele
    MOBS: [
      { TYPE: EnemyTypeId.SLIME, X: 1900, TIP: 'pule em cima dele ou bata', ACTIONS: ['ATTACK'] },
      { TYPE: EnemyTypeId.BAT, X: 2550, TIP: 'voa atrás de você: bata nele!', ACTIONS: ['ATTACK'] }
    ]
  }
};
