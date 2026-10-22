/**
 * level_02.js — FASE 3 (no jogo): Pico Congelado
 * -----------------------------------------------------------------------------
 * Chefão: Serpente Glacial. O que cada campo significa: veja level_helpers.js.
 * -----------------------------------------------------------------------------
 */
const LEVEL_02 = {
  NUMBER: 2,
  NAME: 'Pico Congelado',
  INTRO: { TEXTURE: 'serpent_intro', TITLE: 'THE ICE SERPENT ATTACKS...' }, // abertura da fase
  BACKGROUND_TINT: 0xc8dcff,  // tom gelado
  CHALLENGE: {
    ENEMY_SPEED: 1,
    BOSS_SPEED: 1,
    SHOT_CHANCE: 1, PROJECTILE_SPEED: 1, SPECIAL_INTERVAL: 1
  },
  TERRAIN: TerrainThemeId.ICE,
  ARENA_START_X: 4000,
  STAR_TIMES: { THREE: 120, TWO: 180, ONE: 300 }, // segundos para 3, 2 e 1 estrela
  GROUND: [
    [0, 400], [528, 200, 64], [792, 160, 64], [1080, 240, 128],
    [1576, 236], [1876, 200], [2076, 160, 56], [2300, 200, 56],
    [2612, 280], [3052, 200, 80], [3412, 120], [3596, 404]
  ],
  RAMPS: [
    [400, 128, 0, 64],
    [952, 128, 64, 128],      // sobe até o pico
    [1320, 256, 128, 0],      // descida longa do pico
    [2500, 112, 56, 0],
    [2892, 160, 0, 80],
    [3252, 160, 80, 0]
  ],
  PLATFORMS: [
    [300, 470], [640, 400], [760, 400], [1180, 340], [1700, 470], [1840, 400],
    [2268, 410], [2750, 470], [3150, 390], [3564, 470], [3800, 470]
  ],
  ENEMIES: [
    ...walkers(EnemyTypeId.SLIME_ICE, [300, 600, 870, 1150, 1650, 1950, 2150, 2350, 2700, 3100, 3450, 3750]),
    ...flyers(EnemyTypeId.BAT, [[900, 300], [1500, 300], [2300, 300], [3000, 300], [3500, 300]]),
    ...flyers(EnemyTypeId.GHOST, [[1900, 260], [2900, 250], [3700, 270]])
  ],
  RANDOM_ENEMIES: {
    WALKERS: { TYPES: [EnemyTypeId.SLIME_ICE, EnemyTypeId.SNAKE_ICE, EnemyTypeId.FROG_ICE, EnemyTypeId.HEDGEHOG, EnemyTypeId.PLANT], COUNT: 6 },
    FLYERS: { TYPES: [EnemyTypeId.BAT, EnemyTypeId.GHOST, EnemyTypeId.WASP], COUNT: 4 },
    SPECIALS: [{ TYPE: EnemyTypeId.EAGLE, COUNT: 3 }],
    WAVES: { INTERVAL_MS: 8000, TYPES: [EnemyTypeId.BAT, EnemyTypeId.GHOST, EnemyTypeId.SLIME_ICE, EnemyTypeId.SNAKE_ICE, EnemyTypeId.FROG_ICE, EnemyTypeId.WASP], MAX_NEAR: 5 }
  },
  POTIONS: [[1180, 290], [3150, 340]],
  CHECKPOINTS: [100, 1650, 2650],
  ARENA: {
    BOSS: BossTypeId.ICE_SERPENT,
    // Pirâmide (10 ilhas fixas, todas ao alcance do pulo)
    PLATFORMS: [
      [90, 470], [290, 470], [510, 470], [710, 470],   // base
      [190, 385], [400, 385], [610, 385],               // 2º andar
      [300, 300], [500, 300],                           // 3º andar
      [400, 215]                                        // topo
    ],
    RANDOM_COUNT: 0,
    RANDOM_X: { MIN: 0, MAX: 0 },
    RANDOM_Y: { MIN: 0, MAX: 0 }
  }
};
