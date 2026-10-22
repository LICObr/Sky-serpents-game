/**
 * level_05.js — FASE 6 (no jogo): Floresta do Mel
 * -----------------------------------------------------------------------------
 * Chefão: Colmeia → Abelha Rainha. O que cada campo significa: veja level_helpers.js.
 * Percurso cheio de morros e ilhas (dá para ir por cima ou por baixo), uma
 * MONTANHA bem alta no fim e só VESPAS no caminho. A luta final acontece no
 * cenário da colmeia.
 * -----------------------------------------------------------------------------
 */
const LEVEL_05 = {
  NUMBER: 5,
  NAME: 'Floresta do Mel',
  INTRO: { TEXTURE: 'hive', TITLE: 'THE HIVE ATTACKS...' }, // abertura da fase
  BACKGROUND_TEXTURE: 'bg_floresta_mel', // selva dourada com colmeias e mel (tools/castle_background.py)
  BACKGROUND_SEAMLESS: true,          // já emenda sozinho (fundo infinito)
  BACKGROUND_TINT: 0xffffff,
  TERRAIN: TerrainThemeId.HONEY,
  CHALLENGE: {
    ENEMY_SPEED: 1.15,
    BOSS_SPEED: 1.1,
    SHOT_CHANCE: 1.15, PROJECTILE_SPEED: 1.1, SPECIAL_INTERVAL: 0.85
  },
  ARENA_START_X: 4400,
  STAR_TIMES: { THREE: 180, TWO: 270, ONE: 420 }, // mais longa: montanha e dois chefões
  GROUND: [
    [0, 440], [568, 220, 64], [788, 200, 128], [1148, 180, 48],
    [1392, 200], [1592, 160, 64], [1752, 140, 128], [1956, 200, 96],
    // a MONTANHA: rampa, dois paredões para subir pulando e o pico
    [2348, 100], [2704, 176, 128], [2880, 112, 192], [2992, 96, 256],
    [3216, 176, 320],         // pico
    [3776, 112, 128], [4144, 256]
  ],
  RAMPS: [
    [440, 128, 0, 64],        // subida para o primeiro morro
    [988, 160, 128, 48],      // descida do morro alto
    [2156, 192, 96, 0],       // descida longa
    [2448, 256, 0, 128],      // pé da montanha
    [3088, 128, 256, 320],    // chegada ao pico
    [3392, 384, 320, 128],    // descida do pico
    [3888, 256, 128, 0]       // descida antes da arena
  ],
  // Ilhas em várias alturas: caminho de cima (mais alto) ou de baixo
  PLATFORMS: [
    [250, 470], [660, 400], [760, 320], [1360, 440], [1820, 335], [1900, 255],
    [2400, 470], [2480, 385], [2560, 300], [2640, 215],   // escadinha até a poção
    [4180, 470], [4250, 400]
  ],
  // Só vespas nesta fase
  ENEMIES: [
    ...flyers(EnemyTypeId.WASP, [
      [700, 300], [1150, 280], [1500, 320], [1900, 230], [2300, 300],
      [2600, 200], [3000, 200], [3360, 150], [3750, 260], [4150, 300]
    ])
  ],
  RANDOM_ENEMIES: {
    WALKERS: { TYPES: [], COUNT: 0 },
    FLYERS: { TYPES: [EnemyTypeId.WASP], COUNT: 5 },
    WAVES: { INTERVAL_MS: 7000, TYPES: [EnemyTypeId.WASP], MAX_NEAR: 4 }
  },
  TREES: [1540, 2090, 2800, 3832],   // árvores amarelas (quebrar para passar)
  POTIONS: [[1900, 205], [2640, 165]],
  CHECKPOINTS: [100, 1450, 2400, 3260],   // o último fica no pico
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
