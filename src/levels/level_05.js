/**
 * level_05.js — FASE 5: Floresta do Mel
 * -----------------------------------------------------------------------------
 * Chefão: Colmeia → Abelha Rainha. O que cada campo significa: veja level_helpers.js.
 * Percurso cheio de morros e ilhas (dá para ir por cima ou por baixo) e só
 * VESPAS no caminho. A luta final acontece no cenário da colmeia.
 * -----------------------------------------------------------------------------
 */
const LEVEL_05 = {
  NUMBER: 5,
  NAME: 'Floresta do Mel',
  INTRO: { TEXTURE: 'hive', TITLE: 'THE HIVE ATTACKS...' }, // abertura da fase
  BACKGROUND_TEXTURE: 'bg_mel',       // floresta com mel (tools/honey_background.py)
  BACKGROUND_SEAMLESS: true,          // já emenda sozinho (fundo infinito)
  BACKGROUND_TINT: 0xffffff,
  TERRAIN: TerrainThemeId.HONEY,
  CHALLENGE: {
    ENEMY_SPEED: 1.15,
    BOSS_SPEED: 1.1,
    SHOT_CHANCE: 1.15, PROJECTILE_SPEED: 1.1, SPECIAL_INTERVAL: 0.85
  },
  ARENA_START_X: 4400,
  GROUND: [
    [0, 440], [568, 220, 64], [788, 200, 128], [1148, 180, 48],
    [1392, 200], [1592, 160, 64], [1752, 140, 128], [1956, 200, 96],
    [2348, 300], [2712, 160, 48], [2872, 140, 112], [3076, 220, 64],
    [3424, 260], [3684, 180, 64], [3992, 408]
  ],
  RAMPS: [
    [440, 128, 0, 64],        // subida para o primeiro morro
    [988, 160, 128, 48],      // descida do morro alto
    [2156, 192, 96, 0],       // descida longa
    [3296, 128, 64, 0],
    [3864, 128, 64, 0]        // descida antes da arena
  ],
  // Ilhas em várias alturas: caminho de cima (mais alto) ou de baixo
  PLATFORMS: [
    [250, 470], [660, 400], [760, 320], [1360, 440], [1820, 335], [1900, 255],
    [2400, 470], [2480, 385], [2560, 300], [2640, 215], [2800, 390], [3044, 420],
    [3500, 470], [3600, 390], [4100, 470], [4250, 400]
  ],
  // Só vespas nesta fase
  ENEMIES: [
    ...flyers(EnemyTypeId.WASP, [
      [700, 300], [1150, 280], [1500, 320], [1900, 230], [2300, 300],
      [2600, 200], [3000, 280], [3350, 300], [3750, 260], [4150, 300]
    ])
  ],
  RANDOM_ENEMIES: {
    WALKERS: { TYPES: [], COUNT: 0 },
    FLYERS: { TYPES: [EnemyTypeId.WASP], COUNT: 5 },
    WAVES: { INTERVAL_MS: 7000, TYPES: [EnemyTypeId.WASP], MAX_NEAR: 4 }
  },
  POTIONS: [[1900, 205], [2640, 165]],
  CHECKPOINTS: [100, 1450, 2400, 3450],
  ARENA: {
    BOSS: BossTypeId.HIVE,
    BACKDROP: 'hive_scene',   // a clareira da colmeia (sem ela): aparece aos poucos no fim do percurso
    // Ilhas dos lados (a colmeia fica no meio, do teto quase até o chão)
    PLATFORMS: [
      [100, 470], [170, 385], [100, 300], [170, 215],
      [700, 470], [670, 385], [700, 300], [670, 215]
    ],
    RANDOM_COUNT: 0,
    RANDOM_X: { MIN: 0, MAX: 0 },
    RANDOM_Y: { MIN: 0, MAX: 0 }
  }
};
