/**
 * level_08.js — FASE 8: Pântano dos Jacarés
 * -----------------------------------------------------------------------------
 * Sem chefão (termina na bandeira de chegada). O que cada campo significa:
 * veja level_helpers.js.
 * Um pântano escuro (fundo infinito feito com a arte do pântano) cortado por
 * LAGOAS compridas (WATER): dá para nadar nelas — mais devagar, afundando
 * devagarzinho e dando braçadas — ou atravessar por cima pulando nas
 * VITÓRIAS-RÉGIAS (LILY_PADS), que afundam se alguém ficar em cima. Trechos
 * de LAMA (MUD) deixam o andar lento e o pulo mais baixo.
 * Os bichos são todos do pântano:
 *   sapos — língua (puxa o jogador), venenoso (não dá para pisar; solta
 *           veneno ao morrer), boi (grandão; o tombo dele empurra)
 *   jacarés — o que nada e dá bote (pisar nas costas faz quicar), o
 *             saltador (só os olhos para fora; salta em quem passa por cima)
 *             e o tronco (dá para pisar... até ele acordar e afundar)
 *   libélulas (rasantes rápidos), nuvens de mosquitos (a picada deixa lento)
 *   e cobras-d'água
 * -----------------------------------------------------------------------------
 */
const LEVEL_08 = {
  NUMBER: 8,
  NAME: 'Pântano dos Jacarés',
  BACKGROUND_TEXTURE: 'bg_pantano',    // o pântano espelhado (tools/swamp_background.py)
  BACKGROUND_SEAMLESS: true,           // já emenda sozinho (fundo infinito)
  BACKGROUND_TINT: 0xffffff,
  TERRAIN: TerrainThemeId.SWAMP,
  CHALLENGE: {
    ENEMY_SPEED: 1.3,
    BOSS_SPEED: 1, SHOT_CHANCE: 1, PROJECTILE_SPEED: 1, SPECIAL_INTERVAL: 1
  },
  ARENA_START_X: 6400,                 // começo da reta da bandeira
  STAR_TIMES: { THREE: 150, TWO: 230, ONE: 360 }, // segundos para 3, 2 e 1 estrela
  // Margens um pouco mais altas que a água (elevação 64; a água fica na 40)
  GROUND: [
    [0, 560, 64],
    [880, 300, 64], [1180, 140, 104], [1400, 160, 64],
    [2120, 260, 64], [2380, 120, 120], [2612, 140, 64],
    [3192, 420, 64], [3612, 120, 112],
    [4332, 300, 64], [4728, 200, 112], [5024, 120, 64],
    [5624, 520, 64], [6272, 128, 0]
  ],
  RAMPS: [
    [1320, 80, 104, 64], [2500, 112, 120, 64],
    [4632, 96, 64, 112], [4928, 96, 112, 64],
    [6144, 128, 64, 0]
  ],
  // Lagoas [inícioX, largura, elevação da superfície (padrão 40)]
  WATER: [
    [560, 320], [1560, 560], [2752, 440], [3732, 600], [5144, 480]
  ],
  // Vitórias-régias (x de cada folha, sobre uma lagoa)
  LILY_PADS: [
    650, 790,
    1650, 1785, 1920, 2055,
    2975,
    3830, 3990, 4150,
    5240, 5530
  ],
  // Lama [inícioX, largura]
  MUD: [
    [940, 160], [3240, 300], [4380, 140], [5700, 180]
  ],
  PLATFORMS: [
    [3290, 410], [3430, 410],          // por cima da lama (pule antes de entrar nela!)
    [4268, 470]                        // ilha de musgo no fim da lagoa grande
  ],
  ENEMIES: [
    // sapos
    ...walkers(EnemyTypeId.FROG_TONGUE, [440, 2690, 4560, 5980]),
    ...walkers(EnemyTypeId.FROG_POISON, [1120, 3300, 3480, 5800]),
    ...walkers(EnemyTypeId.BULLFROG, [2250, 4830, 6060]),
    // bichos da água (o x precisa estar sobre uma lagoa)
    walker(EnemyTypeId.WATER_SNAKE, 720),
    walker(EnemyTypeId.GATOR_LEAPER, 1850),
    ...walkers(EnemyTypeId.GATOR_LOG, [2840, 3110]),
    walker(EnemyTypeId.GATOR, 3000),
    walker(EnemyTypeId.GATOR_LEAPER, 3880),
    walker(EnemyTypeId.GATOR, 4050),
    walker(EnemyTypeId.WATER_SNAKE, 4200),
    walker(EnemyTypeId.WATER_SNAKE, 5300),
    walker(EnemyTypeId.GATOR_LOG, 5385),
    walker(EnemyTypeId.GATOR_LEAPER, 5530),
    // voadores
    ...flyers(EnemyTypeId.DRAGONFLY, [[1700, 380], [1950, 360], [3000, 380], [3950, 360], [4250, 340], [5400, 370]]),
    // nuvens de mosquitos
    ...flyers(EnemyTypeId.MOSQUITO, [
      [3330, 400], [3360, 380], [3390, 410], [3420, 390],
      [5850, 400], [5880, 380], [5910, 410]
    ])
  ],
  RANDOM_ENEMIES: {
    WALKERS: { TYPES: [EnemyTypeId.FROG_POISON, EnemyTypeId.FROG_TONGUE], COUNT: 3 },
    FLYERS: { TYPES: [EnemyTypeId.MOSQUITO, EnemyTypeId.DRAGONFLY], COUNT: 4 },
    WAVES: { INTERVAL_MS: 12000, TYPES: [EnemyTypeId.MOSQUITO, EnemyTypeId.DRAGONFLY, EnemyTypeId.FROG_TONGUE], MAX_NEAR: 3 }
  },
  POTIONS: [[1250, 360], [3430, 340], [4268, 400], [5900, 420]],
  CHECKPOINTS: [100, 1420, 2630, 3220, 4360, 5650]
};
