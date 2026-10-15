/**
 * levels.js
 * -----------------------------------------------------------------------------
 * Campanha. Cada fase é um percurso com rolagem lateral:
 *   - GROUND:      trechos de chão [inícioX, largura, elevação]
 *                  elevação 0 = chão normal; > 0 = morro (sobe em px)
 *                  Os espaços sem chão nem rampa são BURACOS (cair = perder
 *                  um coração e voltar ao checkpoint).
 *   - RAMPS:       subidas/descidas [inícioX, largura, elevaçãoInicial, elevaçãoFinal]
 *                  (máximo 4px de altura a cada 8px de largura)
 *   - PLATFORMS:   ilhas flutuantes [x, y] (atravessáveis por baixo)
 *   - ENEMIES:     bichos pequenos { TYPE, X, Y? } (quem anda nasce no chão)
 *   - RANDOM_ENEMIES: bichos EXTRAS sorteados a cada partida:
 *       WALKERS/FLYERS → tipos e quantidade espalhados pelo percurso
 *       SPECIALS       → bichos raros com quantidade própria (ex.: águia)
 *       WAVES          → de tempos em tempos surge um bicho à frente do
 *                        jogador (até um limite de bichos perto da câmera)
 *   - POTIONS:     poções de vida [x, y]
 *   - CHECKPOINTS: pontos de renascimento (x)
 *   - ARENA:       tela final com o CHEFÃO (plataformas em coordenadas
 *                  relativas ao início da arena)
 *   - CHALLENGE:   progressão da fase (multiplicadores sobre os valores base
 *                  do CHEFÃO e da velocidade dos bichos), subindo aos poucos
 *                  de uma fase para a outra. A VIDA dos bichos NÃO muda entre
 *                  fases: cada tipo de bicho tem sempre a mesma vida.
 *
 * Medidas úteis para criar fases (com a física atual):
 *   - o pulo alcança ~100px de altura e ~85px de distância
 *   - paredões de até ~64px dão para subir pulando
 *   - chão nível 0 fica em y = 540; uma ilha em y = (topo do chão - 70)
 *     dá para alcançar pulando
 *
 * Para criar uma fase nova basta adicionar um objeto nesta lista.
 * -----------------------------------------------------------------------------
 */

/** Atalhos para deixar as listas de inimigos mais legíveis. */
const walker = (type, x) => ({ TYPE: type, X: x });
const flyer = (type, x, y) => ({ TYPE: type, X: x, Y: y });
const walkers = (type, xs) => xs.map(x => walker(type, x));
const flyers = (type, points) => points.map(([x, y]) => flyer(type, x, y));

const LEVELS = deepFreeze([
  {
    NUMBER: 1,
    NAME: 'Campos de Fogo',
    BACKGROUND_TINT: 0xffffff,  // cenário original
    CHALLENGE: {
      ENEMY_SPEED: 0.9,
      BOSS_HP: 0.8, BOSS_SPEED: 0.9,
      SHOT_CHANCE: 0.75, PROJECTILE_SPEED: 0.9, SPECIAL_INTERVAL: 1.25
    },
    TERRAIN: TerrainThemeId.MEADOW,
    ARENA_START_X: 4000,
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
  },
  {
    NUMBER: 2,
    NAME: 'Pico Congelado',
    BACKGROUND_TINT: 0xc8dcff,  // tom gelado
    CHALLENGE: {
      ENEMY_SPEED: 1,
      BOSS_HP: 1, BOSS_SPEED: 1,
      SHOT_CHANCE: 1, PROJECTILE_SPEED: 1, SPECIAL_INTERVAL: 1
    },
    TERRAIN: TerrainThemeId.ICE,
    ARENA_START_X: 4000,
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
  },
  {
    NUMBER: 3,
    NAME: 'Santuário Místico',
    BACKGROUND_TINT: 0xffc8ec,  // tom mágico
    CHALLENGE: {
      ENEMY_SPEED: 1.1,
      BOSS_HP: 1.1, BOSS_SPEED: 1.1,
      SHOT_CHANCE: 1.15, PROJECTILE_SPEED: 1.1, SPECIAL_INTERVAL: 0.85
    },
    TERRAIN: TerrainThemeId.MYSTIC,
    ARENA_START_X: 4000,
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
  },
  {
    NUMBER: 4,
    NAME: 'Selva Gelada',
    INTRO: { TEXTURE: 'bear_intro', TITLE: 'THE BEAR ATTACKS...' }, // abertura da fase
    BACKGROUND_TEXTURE: 'bg_selva',     // fundo próprio (selva com neblina)
    BACKGROUND_SEAMLESS: true,          // já emenda sozinho (desenhado em loop por tools/jungle_background.py)
    BACKGROUND_TINT: 0xffffff,
    TERRAIN: TerrainThemeId.JUNGLE_ICE,
    CHALLENGE: {
      ENEMY_SPEED: 1.1,
      BOSS_HP: 1.15, BOSS_SPEED: 1.1,
      SHOT_CHANCE: 1.15, PROJECTILE_SPEED: 1.1, SPECIAL_INTERVAL: 0.85
    },
    ARENA_START_X: 4000,
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
  }
]);
