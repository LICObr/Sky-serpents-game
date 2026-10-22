/**
 * level_04.js — FASE 5 (no jogo): Selva Gelada
 * -----------------------------------------------------------------------------
 * Chefão: Urso Polar. O que cada campo significa: veja level_helpers.js.
 * -----------------------------------------------------------------------------
 */
const LEVEL_04 = {
  NUMBER: 4,
  NAME: 'Selva Gelada',
  INTRO: { TEXTURE: 'bear_intro', TITLE: 'THE BEAR ATTACKS...' }, // abertura da fase
  BACKGROUND_TEXTURE: 'bg_selva',     // fundo próprio (selva com neblina)
  BACKGROUND_SEAMLESS: true,          // já emenda sozinho (desenhado em loop por tools/jungle_background.py)
  BACKGROUND_TINT: 0xffffff,
  TERRAIN: TerrainThemeId.JUNGLE_ICE,
  CHALLENGE: {
    ENEMY_SPEED: 1.1,
    BOSS_SPEED: 1.1,
    SHOT_CHANCE: 1.15, PROJECTILE_SPEED: 1.1, SPECIAL_INTERVAL: 0.85
  },
  ARENA_START_X: 4000,
  STAR_TIMES: { THREE: 120, TWO: 180, ONE: 300 }, // segundos para 3, 2 e 1 estrela
  GROUND: [
    [0, 600], [728, 300, 64], [1156, 364], [1584, 320], [1904, 160, 48],
    [2064, 240, 96], [2496, 440], [3000, 340], [3468, 200, 64], [3796, 204]
  ],
  RAMPS: [
    [600, 128, 0, 64], [1028, 128, 64, 0], [2304, 192, 96, 0],
    [3340, 128, 0, 64], [3668, 128, 64, 0]
  ],
  // Árvores que bloqueiam o caminho: quebre com golpes para passar
  TREES: [400, 1300, 2150, 2700, 3880],
  PLATFORMS: [
    [180, 470], [830, 400], [1450, 470], [1560, 400], [1750, 470],
    [2950, 400], [3150, 470], [3300, 390], [3550, 330]
  ],
  // Todos os bichos do jogo aparecem aqui
  ENEMIES: [
    walker(EnemyTypeId.SLIME, 560), walker(EnemyTypeId.FROG, 860), walker(EnemyTypeId.SNAKE_ICE, 1420),
    walker(EnemyTypeId.HEDGEHOG, 1700), walker(EnemyTypeId.PLANT, 2240), walker(EnemyTypeId.SLIME_MYSTIC, 2580),
    walker(EnemyTypeId.FROG_ICE, 3120), walker(EnemyTypeId.SNAKE_MYSTIC, 3480), walker(EnemyTypeId.PLANT_MYSTIC, 3620),
    ...flyers(EnemyTypeId.BAT, [[1000, 300]]), ...flyers(EnemyTypeId.GHOST, [[1800, 260], [3500, 260]]),
    ...flyers(EnemyTypeId.WASP, [[2400, 280]]), ...flyers(EnemyTypeId.BAT_MYSTIC, [[3000, 300]])
  ],
  RANDOM_ENEMIES: {
    WALKERS: {
      TYPES: [EnemyTypeId.SLIME, EnemyTypeId.SLIME_ICE, EnemyTypeId.SNAKE_FIRE, EnemyTypeId.SNAKE_ICE,
        EnemyTypeId.FROG, EnemyTypeId.FROG_ICE, EnemyTypeId.HEDGEHOG, EnemyTypeId.PLANT],
      COUNT: 6
    },
    FLYERS: { TYPES: [EnemyTypeId.BAT, EnemyTypeId.GHOST, EnemyTypeId.WASP, EnemyTypeId.BAT_MYSTIC], COUNT: 4 },
    SPECIALS: [{ TYPE: EnemyTypeId.EAGLE, COUNT: 2 }],
    WAVES: {
      INTERVAL_MS: 8000,
      TYPES: [EnemyTypeId.BAT, EnemyTypeId.GHOST, EnemyTypeId.WASP, EnemyTypeId.SLIME_ICE, EnemyTypeId.SNAKE_ICE, EnemyTypeId.FROG],
      MAX_NEAR: 5
    }
  },
  POTIONS: [[1560, 350], [3550, 280]],
  CHECKPOINTS: [100, 1650, 3100],
  ARENA: {
    BOSS: BossTypeId.POLAR_BEAR,
    // Poucas ilhas, altas: o urso luta no chão e o jogador usa as ilhas
    // para fugir das ondas de gelo (todas ao alcance do pulo)
    PLATFORMS: [
      [110, 465], [690, 465],                          // laterais baixas
      [300, 395], [500, 395],                          // meio
      [400, 315]                                       // topo
    ],
    RANDOM_COUNT: 0,
    RANDOM_X: { MIN: 0, MAX: 0 },
    RANDOM_Y: { MIN: 0, MAX: 0 }
  }
};
