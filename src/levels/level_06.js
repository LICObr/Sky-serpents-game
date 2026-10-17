/**
 * level_06.js — FASE 6: Montanha da Selva
 * -----------------------------------------------------------------------------
 * Chefão: Filhote de Águia (no ninho; chama a mamãe). O que cada campo
 * significa: veja level_helpers.js.
 * Morrinhos irregulares no começo e depois uma MONTANHA GIGANTE, bem mais
 * alta que a tela: a câmera sobe junto. Sobe-se por rampas e paredões de
 * 64px (pulando), com neve do meio para cima; depois uma descida longa até
 * a clareira do ninho, que aparece aos poucos no fim do percurso. Grama cor
 * de musgo bem falhada e árvores altíssimas no fundo.
 * -----------------------------------------------------------------------------
 */
const LEVEL_06 = {
  NUMBER: 6,
  NAME: 'Montanha da Selva',
  INTRO: { TEXTURE: 'eaglet_call', TITLE: 'THE EAGLET CALLS MOMMY...' }, // abertura da fase
  BACKGROUND_TEXTURE: 'bg_selva_alta', // árvores altíssimas (tools/tall_jungle_background.py)
  BACKGROUND_SEAMLESS: true,           // já emenda sozinho (fundo infinito)
  BACKGROUND_TINT: 0xffffff,
  TERRAIN: TerrainThemeId.MOSS,
  CHALLENGE: {
    ENEMY_SPEED: 1.2,
    BOSS_SPEED: 1, SHOT_CHANCE: 1, PROJECTILE_SPEED: 1, SPECIAL_INTERVAL: 1
  },
  ARENA_START_X: 7000,
  STAR_TIMES: { THREE: 210, TWO: 300, ONE: 420 }, // segundos para 3, 2 e 1 estrela
  GROUND: [
    // morrinhos irregulares
    [0, 360], [488, 152, 64], [640, 120, 112], [856, 136, 64],
    [1056, 160, 64],                    // depois do buraco
    [1376, 112, 144], [1680, 200, 48],
    // a MONTANHA: rampas e paredões de 64px para subir pulando
    [2136, 120, 176], [2256, 96, 240], [2352, 96, 304],
    [2672, 112, 416], [2784, 88, 480],
    [3128, 104, 608], [3232, 96, 672], [3328, 96, 736],
    [3680, 96, 864], [3776, 88, 928], [3864, 88, 992],
    [4144, 240, 1088],                  // pico (com neve)
    // descida: rampas longas e degraus para baixo
    [4768, 120, 896], [4888, 160, 800],
    [5432, 96, 608], [5528, 120, 512],
    [6096, 104, 288], [6200, 120, 192],
    [6704, 296]
  ],
  RAMPS: [
    [360, 128, 0, 64], [760, 96, 112, 64], [1216, 160, 64, 144], [1488, 192, 144, 48],
    [1880, 256, 48, 176], [2448, 224, 304, 416], [2872, 256, 480, 608],
    [3424, 256, 736, 864], [3952, 192, 992, 1088],
    [4384, 384, 1088, 896], [5048, 384, 800, 608], [5648, 448, 512, 288], [6320, 384, 192, 0]
  ],
  // Ilhas (y do mundo: acima da tela é negativo)
  PLATFORMS: [
    [250, 470], [1430, 330], [1780, 420], [2200, 290],
    [3176, -140], [4264, -620], [6000, 130]
  ],
  TREES: [540, 1160, 2715, 4300, 6750],
  ENEMIES: [
    ...walkers(EnemyTypeId.FROG, [600, 1300, 2700]),
    ...walkers(EnemyTypeId.FROG_ICE, [3700, 4950]),
    ...walkers(EnemyTypeId.SNAKE_FIRE, [900, 1750]),
    ...walkers(EnemyTypeId.HEDGEHOG, [1950, 6400]),
    ...walkers(EnemyTypeId.PLANT, [1420, 3360]),
    ...walkers(EnemyTypeId.SLIME_ICE, [4250, 5500]),
    ...flyers(EnemyTypeId.BAT, [
      [700, 300], [1600, 250], [2500, 60], [3000, -160],
      [3800, -520], [4600, -520], [5300, -250], [6400, 260]
    ])
  ],
  RANDOM_ENEMIES: {
    WALKERS: { TYPES: [EnemyTypeId.FROG, EnemyTypeId.SNAKE_FIRE, EnemyTypeId.HEDGEHOG], COUNT: 6 },
    FLYERS: { TYPES: [EnemyTypeId.BAT], COUNT: 4 },
    WAVES: { INTERVAL_MS: 8000, TYPES: [EnemyTypeId.BAT, EnemyTypeId.FROG], MAX_NEAR: 4 }
  },
  POTIONS: [[1430, 280], [3176, -190], [4264, -670]],
  CHECKPOINTS: [100, 1100, 2150, 3150, 4200, 5450],
  ARENA: {
    BOSS: BossTypeId.EAGLET,
    BACKDROP: 'eaglet_scene', // a clareira do ninho (vazio): aparece aos poucos no fim do percurso
    // Escadinhas dos dois lados até a beirada do ninho (de lá a espada alcança o filhote)
    PLATFORMS: [
      [80, 470], [160, 385], [80, 300], [240, 255],
      [720, 470], [640, 385], [560, 300], [440, 255]
    ],
    RANDOM_COUNT: 0,
    RANDOM_X: { MIN: 0, MAX: 0 },
    RANDOM_Y: { MIN: 0, MAX: 0 }
  }
};
