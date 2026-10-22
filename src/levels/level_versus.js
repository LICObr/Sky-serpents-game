/**
 * level_versus.js — ARENA do 1v1 (não é uma fase da lista)
 * -----------------------------------------------------------------------------
 * Uma tela só — a câmera fica afastada e mostra tudo (veja VersusScene) — na
 * mesma TEMPESTADE da Costa da Tempestade: chuva forte, escuridão, relâmpagos,
 * raios no chão, rajadas de vento e o chão verde quase preto.
 * Cheia de ILHAS flutuantes em andares (cada andar ~85px acima do outro,
 * dentro do alcance do pulo, e os de 3 ilhas desencontrados dos de 2 para
 * dar para subir na diagonal) e uma ilha sozinha lá no alto.
 * Cada jogador começa num canto do chão. O formato dos campos é o das fases
 * (level_helpers.js); os bichos (se ligados) saem de MOBS.
 * -----------------------------------------------------------------------------
 */
const LEVEL_VERSUS = {
  NUMBER: 'VS',
  NAME: 'Arena da Tempestade',
  BACKGROUND_TEXTURE: LEVEL_09.BACKGROUND_TEXTURE,
  BACKGROUND_TINT: LEVEL_09.BACKGROUND_TINT,
  TERRAIN: TerrainThemeId.STORM,
  ARENA_START_X: 343,                  // mundo de 343 + 800 (ARENA_WIDTH) = 1143px: cabe na tela com o zoom
  GROUND: [[0, 343]],                  // chão inteiro, sem buracos
  RAMPS: [],
  PLATFORMS: [
    [220, 470], [571, 470], [922, 470],  // 1º andar (pula do chão)
    [395, 385], [747, 385],              // 2º
    [220, 300], [571, 300], [922, 300],  // 3º
    [395, 215], [747, 215],              // 4º
    [220, 130], [571, 130], [922, 130],  // 5º
    [395, 45], [747, 45],                // 6º
    [571, -40]                           // o topo, no meio
  ],
  ENEMIES: [],
  POTIONS: [],
  SPAWN_X: [80, 1063],                 // jogador 1 à esquerda, jogador 2 à direita
  // Bichos da noite (se ligados na tela do 1v1): de chão nascem no chão, voadores no ar
  MOBS: {
    WALKERS: [EnemyTypeId.SLIME, EnemyTypeId.FROG, EnemyTypeId.HEDGEHOG],
    FLYERS: [EnemyTypeId.BAT, EnemyTypeId.GHOST, EnemyTypeId.BAT_VAMPIRE, EnemyTypeId.MOTH],
    FLYER_Y: { MIN: -150, MAX: 320 }
  },
  STORM: LEVEL_09.STORM                // a mesma tempestade da Fase 10
};
