/**
 * level_07.js — FASE 8 (no jogo): Caverna Profunda
 * -----------------------------------------------------------------------------
 * Sem chefão (termina na bandeira de chegada). O que cada campo significa:
 * veja level_helpers.js.
 * Uma caverna escura (fundo infinito feito com a arte da caverna) com
 * buracos, degraus e ilhas de pedra. PEDRAS caem do teto o tempo todo
 * (FALLING_ROCKS: tremem e soltam poeira antes de cair). Os bichos são
 * todos da caverna:
 *   morcegos — vampiro (a mordida deixa lento), sônico (o grito empurra),
 *              gigante (vira dois morceguinhos ao morrer)
 *   rastejantes — centopeia (rápida e espinhuda), aranha (cai do teto),
 *                 besouro-pedra (finge ser pedra e investe)
 *   traças — em bandos, soltam pó que deixa lento ao morrer
 * -----------------------------------------------------------------------------
 */
const LEVEL_07 = {
  NUMBER: 7,
  NAME: 'Caverna Profunda',
  BACKGROUND_TEXTURE: 'bg_caverna',    // a caverna espelhada (tools/cave_background.py)
  BACKGROUND_SEAMLESS: true,           // já emenda sozinho (fundo infinito)
  BACKGROUND_TINT: 0xffffff,
  TERRAIN: TerrainThemeId.CAVE,
  CHALLENGE: {
    ENEMY_SPEED: 1.25,
    BOSS_SPEED: 1, SHOT_CHANCE: 1, PROJECTILE_SPEED: 1, SPECIAL_INTERVAL: 1
  },
  ARENA_START_X: 6000,                 // começo da reta da bandeira
  STAR_TIMES: { THREE: 120, TWO: 180, ONE: 300 }, // segundos para 3, 2 e 1 estrela
  GROUND: [
    [0, 420], [420, 140, 48], [560, 160, 96],
    [912, 248], [1224, 200], [1424, 120, 64], [1544, 120, 128],
    [1728, 180, 128], [2164, 300], [2464, 140, 56], [2604, 200, 112],
    [3028, 220], [3312, 260], [3572, 140, 64], [3712, 160, 128], [3872, 120, 192],
    [4376, 300], [4740, 300], [5040, 160, 64], [5328, 672]
  ],
  RAMPS: [
    [720, 192, 96, 0], [1908, 256, 128, 0], [2804, 224, 112, 0],
    [3992, 384, 192, 0], [5200, 128, 64, 0]
  ],
  PLATFORMS: [
    [250, 470], [1192, 430], [1700, 330], [2300, 470], [2380, 385],
    [3280, 430], [4200, 300], [4708, 430], [5600, 470], [5700, 385]
  ],
  ENEMIES: [
    ...flyers(EnemyTypeId.SPIDER, [[700, 110], [1500, 100], [2700, 110], [3500, 100], [4500, 110], [5500, 100]]),
    ...walkers(EnemyTypeId.ROCK_BEETLE, [1000, 2250, 3100, 4450, 5800]),
    ...walkers(EnemyTypeId.CENTIPEDE, [1800, 2200, 3400, 5100]),
    // traças em bandos de três
    ...flyers(EnemyTypeId.MOTH, [
      [1300, 280], [1340, 250], [1380, 300],
      [2900, 270], [2940, 240], [2980, 290],
      [4300, 260], [4340, 230], [4380, 280],
      [5400, 280], [5440, 250], [5480, 300]
    ]),
    ...flyers(EnemyTypeId.BAT_VAMPIRE, [[900, 220], [2500, 200], [3900, 160], [5300, 220]]),
    ...flyers(EnemyTypeId.BAT_SONIC, [[1600, 220], [3200, 230], [4800, 210]]),
    ...flyers(EnemyTypeId.BAT_GIANT, [[2000, 180], [4000, 150], [5650, 200]])
  ],
  RANDOM_ENEMIES: {
    WALKERS: { TYPES: [EnemyTypeId.CENTIPEDE, EnemyTypeId.ROCK_BEETLE], COUNT: 3 },
    FLYERS: { TYPES: [EnemyTypeId.MOTH], COUNT: 4 },
    WAVES: { INTERVAL_MS: 11000, TYPES: [EnemyTypeId.MOTH, EnemyTypeId.BAT_VAMPIRE, EnemyTypeId.CENTIPEDE], MAX_NEAR: 3 }
  },
  // Pedras caindo do teto durante a fase inteira, perto dos jogadores
  FALLING_ROCKS: {
    TEXTURE: 'pedra_caverna',
    SCALE: 0.2,
    FIRST_MS: 4000,
    EVERY_MS: { MIN: 2500, MAX: 5000 },
    WARNING_MS: 800,                   // treme e solta poeira antes de cair
    FALL_SPEED: 380,
    SPREAD_X: 180,                     // cai até esta distância do jogador
    START_Y: 20                        // altura em que aparece, a partir do alto da tela
  },
  POTIONS: [[1700, 280], [3280, 380], [5650, 335]],
  CHECKPOINTS: [100, 1430, 3030, 4380]
};
