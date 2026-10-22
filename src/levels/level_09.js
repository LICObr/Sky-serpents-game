/**
 * level_09.js — FASE 10 (no jogo): Costa da Tempestade
 * -----------------------------------------------------------------------------
 * Sem chefão (termina na bandeira de chegada). O que cada campo significa:
 * veja level_helpers.js.
 * De noite, na costa dos castelos, no meio de uma TEMPESTADE (STORM, veja
 * world/thunderstorm.js): chuva muito forte, escuridão, relâmpagos que
 * iluminam tudo (o tornado lá no fundo brilha), raios que caem no chão perto
 * do jogador (o lugar brilha antes — saia dali!) e rajadas de vento que
 * empurram. O chão é verde bem escuro, quase preto.
 * Bichos da noite: fantasmas, morcegos (o comum, o vampiro e o gigante),
 * traças, aranhas, e jacarés nas poças da costa. Nada de águias (é noite).
 * -----------------------------------------------------------------------------
 */
const LEVEL_09 = {
  NUMBER: 9,
  NAME: 'Costa da Tempestade',
  BACKGROUND_TEXTURE: 'bg_tempestade', // a costa de noite com o tornado (tools/castle_background.py)
  BACKGROUND_SEAMLESS: true,           // já emenda sozinho (fundo infinito)
  BACKGROUND_TINT: 0xffffff,
  TERRAIN: TerrainThemeId.STORM,
  CHALLENGE: {
    ENEMY_SPEED: 1.3,
    BOSS_SPEED: 1, SHOT_CHANCE: 1, PROJECTILE_SPEED: 1, SPECIAL_INTERVAL: 1
  },
  ARENA_START_X: 5000,                 // começo da reta da bandeira
  STAR_TIMES: { THREE: 150, TWO: 220, ONE: 340 }, // segundos para 3, 2 e 1 estrela
  // Margens um pouco mais altas que a água das poças (elevação 64; a água fica na 40)
  GROUND: [
    [0, 520, 64],
    [880, 260, 64], [1140, 140, 112], [1376, 300, 64],
    [1740, 412, 64],                   // depois de um buraco
    [2632, 300, 64], [2932, 120, 120], [3164, 300, 64],
    [3964, 400, 64], [4492, 508]
  ],
  RAMPS: [
    [1280, 96, 112, 64], [3052, 112, 120, 64], [4364, 128, 64, 0]
  ],
  // Poças da costa (com jacarés)
  WATER: [
    [520, 360], [2152, 480], [3464, 500]
  ],
  PLATFORMS: [
    [640, 470], [800, 470],            // pedras na primeira poça
    [2240, 470], [2560, 470],          // na segunda (no meio, o jacaré-tronco)
    [3560, 470], [3720, 430], [3880, 470],
    [1520, 400], [4180, 400]
  ],
  ENEMIES: [
    // bichos da noite
    ...flyers(EnemyTypeId.GHOST, [[700, 330], [1500, 300], [2800, 320], [4200, 300]]),
    ...flyers(EnemyTypeId.BAT, [[1000, 280], [1900, 260], [3300, 280], [4600, 260]]),
    ...flyers(EnemyTypeId.BAT_VAMPIRE, [[1300, 250], [3100, 240]]),
    ...flyers(EnemyTypeId.BAT_GIANT, [[2400, 220], [4300, 200]]),
    ...flyers(EnemyTypeId.MOTH, [[1800, 300], [1840, 280], [1880, 310], [3800, 290], [3840, 270]]),
    ...flyers(EnemyTypeId.SPIDER, [[1600, 110], [4100, 100]]),
    ...walkers(EnemyTypeId.FROG_TONGUE, [1450, 2750]),
    ...walkers(EnemyTypeId.TURTLE, [1950, 4700]),
    // jacarés nas poças (o x precisa estar sobre uma poça)
    walker(EnemyTypeId.GATOR, 700),
    walker(EnemyTypeId.GATOR_LEAPER, 2250),
    walker(EnemyTypeId.GATOR_LOG, 2400),
    walker(EnemyTypeId.WATER_SNAKE, 3600),
    walker(EnemyTypeId.GATOR, 3750)
  ],
  RANDOM_ENEMIES: {
    WALKERS: { TYPES: [EnemyTypeId.SLIME, EnemyTypeId.FROG_TONGUE, EnemyTypeId.TURTLE, EnemyTypeId.CENTIPEDE], COUNT: 4 },
    FLYERS: { TYPES: [EnemyTypeId.BAT, EnemyTypeId.GHOST, EnemyTypeId.MOTH], COUNT: 4 },
    WAVES: { INTERVAL_MS: 11000, TYPES: [EnemyTypeId.BAT, EnemyTypeId.GHOST, EnemyTypeId.BAT_VAMPIRE], MAX_NEAR: 3 }
  },
  POTIONS: [[1450, 380], [2560, 400], [3720, 360], [4700, 440]],
  CHECKPOINTS: [100, 1400, 2650, 3990],
  // A tempestade (world/thunderstorm.js)
  STORM: {
    LIT_TEXTURE: 'bg_tempestade_raio', // o mesmo fundo iluminado pelo relâmpago (o tornado brilha)
    DARKNESS: { COLOR: 0x050a18, ALPHA: 0.34 },
    RAIN: { SPEED: 950, EVERY_MS: 10, PER_TICK: 6, SPLASHES_PER_FRAME: 3 },
    LIGHTNING: {
      FIRST_MS: 2500,
      EVERY_MS: { MIN: 3500, MAX: 7500 },
      THUNDER_DELAY_MS: { MIN: 250, MAX: 900 },  // a luz chega antes do barulho
      FADE_MS: 520,
      GROUND_CHANCE: 30,                          // % dos raios que caem no chão perto de um jogador
      GROUND: { WARNING_MS: 900, SPREAD_X: 70, RADIUS: 30 }
    },
    WIND: {
      BASE: -140,                                 // a chuva cai sempre um pouco inclinada
      EVERY_MS: { MIN: 9000, MAX: 15000 },
      WARNING_MS: 1300,                           // folhas voando e a chuva deitando antes do empurrão
      GUST_MS: 2600,
      GUST_RAIN: 420,
      PUSH: 70                                    // o vento soma isto na velocidade dos jogadores
    }
  }
};
