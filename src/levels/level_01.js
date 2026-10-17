/**
 * level_01.js — FASE 1: Campos de Fogo
 * -----------------------------------------------------------------------------
 * Chefão: Dragão Vermelho. O que cada campo significa: veja level_helpers.js.
 * -----------------------------------------------------------------------------
 */
const LEVEL_01 = {
  NUMBER: 1,
  NAME: 'Campos de Fogo',
  INTRO: { TEXTURE: 'dragon_red_intro', TITLE: 'THE RED DRAGON ATTACKS...' }, // abertura da fase
  BACKGROUND_TINT: 0xffffff,  // cenário original
  CHALLENGE: {
    ENEMY_SPEED: 0.9,
    BOSS_SPEED: 0.9,
    SHOT_CHANCE: 0.75, PROJECTILE_SPEED: 0.9, SPECIAL_INTERVAL: 1.25
  },
  TERRAIN: TerrainThemeId.MEADOW,
  ARENA_START_X: 4000,
  STAR_TIMES: { THREE: 120, TWO: 180, ONE: 300 }, // segundos para 3, 2 e 1 estrela
  GROUND: [
    [0, 520], [680, 260, 64], [1068, 292],
    [1424, 220], [1644, 200, 48], [1844, 240, 96],
    [2276, 260], [2600, 300], [3028, 200, 64], [3292, 180, 64], [3600, 400]
  ],
  RAMPS: [
    [520, 160, 0, 64],        // subida para o primeiro morro
    [940, 128, 64, 0],        // descida
    [2084, 192, 96, 0],       // descida longa do morro alto
    [2900, 128, 0, 64],       // subida
    [3472, 128, 64, 0]        // descida antes da arena
  ],
  PLATFORMS: [
    [380, 470], [520, 390], [700, 310], [1150, 470], [1290, 400], [1530, 470],
    [1950, 375], [2400, 470], [2520, 400], [2700, 470], [3260, 400], [3700, 470], [3850, 390]
  ],
  ENEMIES: [
    ...walkers(EnemyTypeId.SLIME, [300, 760, 1150, 1500, 1750, 1950, 2350, 2700, 3100, 3380, 3700, 3850]),
    ...flyers(EnemyTypeId.BAT, [[1300, 330], [2000, 300], [2600, 320], [3000, 300], [3500, 330], [3800, 280]])
  ],
  RANDOM_ENEMIES: {
    WALKERS: { TYPES: [EnemyTypeId.SLIME, EnemyTypeId.SNAKE_FIRE, EnemyTypeId.FROG, EnemyTypeId.HEDGEHOG, EnemyTypeId.PLANT], COUNT: 5 },
    FLYERS: { TYPES: [EnemyTypeId.BAT, EnemyTypeId.WASP], COUNT: 3 },
    SPECIALS: [{ TYPE: EnemyTypeId.EAGLE, COUNT: 2 }],
    WAVES: { INTERVAL_MS: 9000, TYPES: [EnemyTypeId.BAT, EnemyTypeId.SLIME, EnemyTypeId.WASP, EnemyTypeId.SNAKE_FIRE, EnemyTypeId.FROG], MAX_NEAR: 4 }
  },
  POTIONS: [[700, 260], [3850, 340]],
  CHECKPOINTS: [100, 1450, 2650],
  ARENA: {
    BOSS: BossTypeId.FIRE_DRAGON,
    // 10 ilhas FIXAS em degraus (cada andar ~85px acima do anterior,
    // dentro do alcance do pulo) — dá para chegar em todas
    PLATFORMS: [
      [120, 470], [400, 470], [680, 470],   // 1º andar (pula do chão)
      [260, 385], [540, 385],               // 2º andar
      [120, 300], [400, 300], [680, 300],   // 3º andar
      [260, 215], [540, 215]                // 4º andar (topo)
    ],
    RANDOM_COUNT: 0,
    RANDOM_X: { MIN: 0, MAX: 0 },
    RANDOM_Y: { MIN: 0, MAX: 0 }
  }
};
