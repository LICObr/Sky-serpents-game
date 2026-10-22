/**
 * level_03.js — FASE 4 (no jogo): Santuário Místico
 * -----------------------------------------------------------------------------
 * Chefão: Dragão Rosa Místico. O que cada campo significa: veja level_helpers.js.
 * -----------------------------------------------------------------------------
 */
const LEVEL_03 = {
  NUMBER: 3,
  NAME: 'Santuário Místico',
  INTRO: { TEXTURE: 'dragon_pink_intro', TITLE: 'THE MYSTIC DRAGON ATTACKS...' }, // abertura da fase
  BACKGROUND_TINT: 0xffc8ec,  // tom mágico
  CHALLENGE: {
    ENEMY_SPEED: 1.1,
    BOSS_SPEED: 1.1,
    SHOT_CHANCE: 1.15, PROJECTILE_SPEED: 1.1, SPECIAL_INTERVAL: 0.85
  },
  TERRAIN: TerrainThemeId.MYSTIC,
  ARENA_START_X: 4000,
  STAR_TIMES: { THREE: 120, TWO: 180, ONE: 300 }, // segundos para 3, 2 e 1 estrela
  GROUND: [
    [0, 360], [360, 120, 48], [480, 120, 96], [792, 240], [1096, 200],
    [1456, 120, 80], [1640, 120, 80], [1824, 160, 80], [2144, 260],
    [2532, 200, 64], [2732, 120, 112], [3076, 200], [3340, 200], [3604, 396]
  ],
  RAMPS: [
    [600, 192, 96, 0],
    [1296, 160, 0, 80],
    [1984, 160, 80, 0],
    [2404, 128, 0, 64],
    [2852, 224, 112, 0]
  ],
  PLATFORMS: [
    [250, 470], [900, 470], [1064, 470], [1608, 390], [1792, 390], [2300, 470],
    [2632, 406], [2780, 358], [3308, 470], [3572, 470], [3750, 400]
  ],
  ENEMIES: [
    ...walkers(EnemyTypeId.SLIME_MYSTIC, [250, 520, 850, 1150, 1500, 1880, 2250, 2600, 2950, 3150, 3400, 3800]),
    ...flyers(EnemyTypeId.BAT_MYSTIC, [[800, 300], [1500, 280], [2200, 300], [2800, 280], [3400, 300]]),
    ...flyers(EnemyTypeId.GHOST, [[1200, 260], [2500, 250], [3700, 260]])
  ],
  RANDOM_ENEMIES: {
    WALKERS: { TYPES: [EnemyTypeId.SLIME_MYSTIC, EnemyTypeId.SNAKE_MYSTIC, EnemyTypeId.FROG, EnemyTypeId.HEDGEHOG, EnemyTypeId.PLANT_MYSTIC], COUNT: 7 },
    FLYERS: { TYPES: [EnemyTypeId.BAT_MYSTIC, EnemyTypeId.GHOST, EnemyTypeId.WASP], COUNT: 4 },
    SPECIALS: [{ TYPE: EnemyTypeId.EAGLE, COUNT: 3 }],
    WAVES: { INTERVAL_MS: 7000, TYPES: [EnemyTypeId.BAT_MYSTIC, EnemyTypeId.GHOST, EnemyTypeId.SLIME_MYSTIC, EnemyTypeId.SNAKE_MYSTIC, EnemyTypeId.WASP], MAX_NEAR: 5 }
  },
  POTIONS: [[2780, 310], [3750, 350]],
  CHECKPOINTS: [100, 1150, 2200],
  ARENA: {
    BOSS: BossTypeId.MYSTIC_DRAGON,
    // Escadas cruzadas (9 ilhas fixas, todas ao alcance do pulo)
    PLATFORMS: [
      [120, 470], [330, 470], [520, 470], [700, 470],   // base
      [220, 385], [610, 385],                           // 2º andar
      [330, 300], [520, 300],                           // 3º andar
      [425, 215]                                        // topo
    ],
    RANDOM_COUNT: 0,
    RANDOM_X: { MIN: 0, MAX: 0 },
    RANDOM_Y: { MIN: 0, MAX: 0 }
  }
};
