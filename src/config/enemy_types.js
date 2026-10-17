/**
 * enemy_types.js
 * -----------------------------------------------------------------------------
 * Bichos pequenos espalhados pelas fases. BEHAVIOR define qual classe
 * controla o bicho (veja enemy_factory.js):
 *   WALKER → anda no chão e vira nas beiradas (slime)
 *   FLYER  → voa ondulando e persegue o jogador quando está perto (morcego)
 *   GHOST  → voa como o FLYER, mas fica intangível de tempos em tempos
 *   SNAKE  → cobrinha: rasteja com o corpo em segmentos (mini-serpente)
 *   HOPPER → sapo: espera e pula em arco na direção do jogador
 *   SHOOTER→ planta: fica parada e cospe sementes quando o jogador chega perto
 *   DIVER  → vespa: paira, treme avisando e dá um rasante no jogador
 *   SPIKY  → ouriço: anda como o slime, mas NÃO dá para pisar nele
 *   EAGLE  → águia: voa bem alto, mergulha no jogador e depois fica andando
 *            no chão, fraquinha (morre fácil)
 *
 * Dá para matar pisando em cima (como no Mario) ou atacando — menos o ouriço.
 * TINT (opcional) pinta o bicho de outra cor (variações de fase).
 * Cada tipo (inclusive cada variação, ex.: slime de gelo) tem a SUA vida,
 * que é a mesma em qualquer fase.
 * -----------------------------------------------------------------------------
 */
const EnemyBehavior = Object.freeze({
  WALKER: 'WALKER',
  FLYER: 'FLYER',
  GHOST: 'GHOST',
  SNAKE: 'SNAKE',
  HOPPER: 'HOPPER',
  SHOOTER: 'SHOOTER',
  DIVER: 'DIVER',
  SPIKY: 'SPIKY',
  EAGLE: 'EAGLE'
});

/** Bichos que vivem no chão (nascem sobre o terreno e colidem com ele). */
const GROUND_BEHAVIORS = Object.freeze([
  EnemyBehavior.WALKER, EnemyBehavior.SNAKE, EnemyBehavior.HOPPER,
  EnemyBehavior.SHOOTER, EnemyBehavior.SPIKY
]);

const EnemyTypeId = Object.freeze({
  SLIME: 'SLIME',
  SLIME_ICE: 'SLIME_ICE',
  SLIME_MYSTIC: 'SLIME_MYSTIC',
  BAT: 'BAT',
  BAT_MYSTIC: 'BAT_MYSTIC',
  GHOST: 'GHOST',
  SNAKE_FIRE: 'SNAKE_FIRE',
  SNAKE_ICE: 'SNAKE_ICE',
  SNAKE_MYSTIC: 'SNAKE_MYSTIC',
  FROG: 'FROG',
  FROG_ICE: 'FROG_ICE',
  PLANT: 'PLANT',
  PLANT_MYSTIC: 'PLANT_MYSTIC',
  WASP: 'WASP',
  HEDGEHOG: 'HEDGEHOG',
  EAGLE: 'EAGLE',
  // variações da águia (fase 6)
  EAGLE_SHARP: 'EAGLE_SHARP',
  EAGLE_GOLD: 'EAGLE_GOLD',
  EAGLE_FAN: 'EAGLE_FAN',
  EAGLE_WIDE: 'EAGLE_WIDE',
  EAGLE_BLACK: 'EAGLE_BLACK'
});

/** Quadros de uma variação da águia (tools/eagle_variants.py). */
const eagleFrames = name => ({
  FRAMES: [`aguia_${name}_0`, `aguia_${name}_1`],
  DIVE_FRAME: `aguia_${name}_mergulho`,
  GROUND_FRAMES: [`aguia_${name}_chao_0`, `aguia_${name}_chao_1`]
});

/** Águia original: as variações (fase 6) partem dela. */
const EAGLE_BASE = deepFreeze({
  NAME: 'Águia',
  BEHAVIOR: EnemyBehavior.EAGLE,
  FRAMES: ['aguia_0', 'aguia_1'],              // voando (asas cima/baixo)
  DIVE_FRAME: 'aguia_mergulho',                 // asas fechadas no mergulho
  GROUND_FRAMES: ['aguia_chao_0', 'aguia_chao_1'], // andando no chão
  FRAME_MS: 170,
  SCALE: 0.085,               // um pouco maior que a vespa
  HP: 30,
  SPEED: 70,                  // voando lá no alto
  SOAR_Y: { MIN: 60, MAX: 120 },
  PATROL_RANGE: 220,
  DIVE_CHECK_MS: 1300,        // de quanto em quanto tempo "pensa" em mergulhar
  DIVE_CHANCE_PERCENT: 40,    // ...e a chance de mergulhar (do nada!)
  DIVE_TRIGGER_X: 280,        // só mergulha se o jogador estiver perto (na horizontal)
  DIVE_WARNING_MS: 300,       // grito/pisca antes de mergulhar
  DIVE_SPEED: 440,
  DIVE_MAX_MS: 1600,
  GROUND_SPEED: 35,           // no chão anda devagar e desajeitada
  GROUND_HP: 1,               // no chão morre com um golpe
  MELEE_REACH: 60,
  // Ovos soltos enquanto voa (param depois do mergulho)
  EGG: {
    TEXTURE: 'aguia_ovo',
    INTERVAL_MS: { MIN: 5000, MAX: 7000 }, // ~1 a cada 6 segundos
    SCALE: 0.09,
    GRAVITY: 110,             // cai devagarzinho...
    MAX_FALL_SPEED: 150,      // ...e nunca rápido demais
    KEEP_MOMENTUM: 0.8        // continua parte do embalo horizontal do voo
  }
});

const ENEMY_TYPES = deepFreeze({
  [EnemyTypeId.SLIME]: {
    NAME: 'Slime',
    BEHAVIOR: EnemyBehavior.WALKER,
    FRAMES: ['slime_0', 'slime_1'],
    FRAME_MS: 280,
    SCALE: 0.1,
    HP: 15,
    SPEED: 45,
    MELEE_REACH: 60
  },
  [EnemyTypeId.SLIME_ICE]: {
    NAME: 'Slime de Gelo',
    BEHAVIOR: EnemyBehavior.WALKER,
    FRAMES: ['slime_gelo_0', 'slime_gelo_1'],
    FRAME_MS: 240,
    SCALE: 0.11,
    HP: 27,
    SPEED: 60,
    MELEE_REACH: 60,
    CONTACT_EFFECT: 'SLOW'      // encostar deixa o jogador lento
  },
  [EnemyTypeId.SLIME_MYSTIC]: {
    NAME: 'Slime Místico',
    BEHAVIOR: EnemyBehavior.WALKER,
    FRAMES: ['slime_rosa_0', 'slime_rosa_1'],
    FRAME_MS: 200,
    SCALE: 0.11,
    HP: 30,
    SPEED: 80,
    MELEE_REACH: 60
  },
  [EnemyTypeId.BAT]: {
    NAME: 'Morcego',
    BEHAVIOR: EnemyBehavior.FLYER,
    FRAMES: ['morcego_0', 'morcego_1'],
    FRAME_MS: 140,
    SCALE: 0.1,
    HP: 12,
    SPEED: 70,
    WAVE_AMPLITUDE: 30,
    WAVE_SPEED: 0.004,
    PATROL_RANGE: 120,
    CHASE_RANGE: 260,
    CHASE_SPEED: 95,
    MELEE_REACH: 60
  },
  [EnemyTypeId.BAT_MYSTIC]: {
    NAME: 'Morcego Místico',
    BEHAVIOR: EnemyBehavior.FLYER,
    FRAMES: ['morcego_rosa_0', 'morcego_rosa_1'],
    FRAME_MS: 110,
    SCALE: 0.11,
    HP: 20,
    SPEED: 90,
    WAVE_AMPLITUDE: 40,
    WAVE_SPEED: 0.005,
    PATROL_RANGE: 160,
    CHASE_RANGE: 320,
    CHASE_SPEED: 125,
    MELEE_REACH: 60
  },
  [EnemyTypeId.GHOST]: {
    NAME: 'Fantasminha',
    BEHAVIOR: EnemyBehavior.GHOST,
    FRAMES: ['fantasma_0', 'fantasma_1'],
    FRAME_MS: 300,
    SCALE: 0.11,
    HP: 24,
    SPEED: 50,
    WAVE_AMPLITUDE: 20,
    WAVE_SPEED: 0.003,
    PATROL_RANGE: 90,
    CHASE_RANGE: 300,
    CHASE_SPEED: 70,
    MELEE_REACH: 60,
    // Some (intangível) por um tempo e volta
    VISIBLE_MS: 2600,
    FADED_MS: 1400,
    FADED_ALPHA: 0.25
  },

  // --- Cobrinhas (mini-serpentes) -------------------------------------------
  [EnemyTypeId.SNAKE_FIRE]: {
    NAME: 'Cobrinha de Fogo',
    BEHAVIOR: EnemyBehavior.SNAKE,
    FRAMES: ['serpent_head'],
    FRAME_MS: 1000,
    SCALE: 0.065,
    TINT: 0xff9a50,
    HP: 18,
    SPEED: 55,
    SEGMENTS: 4,
    SEGMENT_SPACING: 9,
    WIGGLE: 3,                  // ondulação do corpo (px)
    MELEE_REACH: 60
  },
  [EnemyTypeId.SNAKE_ICE]: {
    NAME: 'Cobrinha Glacial',
    BEHAVIOR: EnemyBehavior.SNAKE,
    FRAMES: ['serpent_head'],
    FRAME_MS: 1000,
    SCALE: 0.065,
    HP: 24,
    SPEED: 65,
    SEGMENTS: 5,
    SEGMENT_SPACING: 9,
    WIGGLE: 3,
    MELEE_REACH: 60,
    CONTACT_EFFECT: 'SLOW'
  },
  [EnemyTypeId.SNAKE_MYSTIC]: {
    NAME: 'Cobrinha Mística',
    BEHAVIOR: EnemyBehavior.SNAKE,
    FRAMES: ['serpent_head'],
    FRAME_MS: 1000,
    SCALE: 0.07,
    TINT: 0xff8ad8,
    HP: 30,
    SPEED: 80,
    SEGMENTS: 6,
    SEGMENT_SPACING: 9,
    WIGGLE: 4,
    MELEE_REACH: 60
  },

  // --- Sapos saltadores -----------------------------------------------------
  [EnemyTypeId.FROG]: {
    NAME: 'Sapo Saltador',
    BEHAVIOR: EnemyBehavior.HOPPER,
    FRAMES: ['sapo_0', 'sapo_1'],   // [sentado, pulando]
    FRAME_MS: 300,
    SCALE: 0.1,
    HP: 20,
    SPEED: 140,                 // velocidade horizontal do pulo
    JUMP_VELOCITY: -460,
    JUMP_INTERVAL_MS: 1500,
    JUMP_RANGE: 320,            // só pula se o jogador estiver perto
    MELEE_REACH: 60
  },
  [EnemyTypeId.FROG_ICE]: {
    NAME: 'Sapo da Neve',
    BEHAVIOR: EnemyBehavior.HOPPER,
    FRAMES: ['sapo_0', 'sapo_1'],
    FRAME_MS: 300,
    SCALE: 0.1,
    TINT: 0x9fe0ff,
    HP: 26,
    SPEED: 160,
    JUMP_VELOCITY: -500,
    JUMP_INTERVAL_MS: 1300,
    JUMP_RANGE: 340,
    MELEE_REACH: 60,
    CONTACT_EFFECT: 'SLOW'
  },

  // --- Plantas cuspidoras ---------------------------------------------------
  [EnemyTypeId.PLANT]: {
    NAME: 'Planta Cuspidora',
    BEHAVIOR: EnemyBehavior.SHOOTER,
    FRAMES: ['planta_0', 'planta_1'], // [fechada, cuspindo]
    FRAME_MS: 1000,
    SCALE: 0.11,
    HP: 22,
    SPEED: 0,
    SHOOT_RANGE: 380,
    SHOOT_INTERVAL_MS: 2200,
    SHOOT_WINDUP_MS: 350,       // abre a boca antes de cuspir
    SEED_SPEED: 230,
    MELEE_REACH: 60
  },
  [EnemyTypeId.PLANT_MYSTIC]: {
    NAME: 'Planta Mística',
    BEHAVIOR: EnemyBehavior.SHOOTER,
    FRAMES: ['planta_0', 'planta_1'],
    FRAME_MS: 1000,
    SCALE: 0.12,
    TINT: 0xd890ff,
    HP: 30,
    SPEED: 0,
    SHOOT_RANGE: 420,
    SHOOT_INTERVAL_MS: 1700,
    SHOOT_WINDUP_MS: 300,
    SEED_SPEED: 260,
    MELEE_REACH: 60
  },

  // --- Vespa mergulhadora ---------------------------------------------------
  [EnemyTypeId.WASP]: {
    NAME: 'Vespa',
    BEHAVIOR: EnemyBehavior.DIVER,
    FRAMES: ['vespa_0', 'vespa_1'],
    FRAME_MS: 70,               // asas batendo rápido
    SCALE: 0.1,
    HP: 14,
    SPEED: 60,
    WAVE_AMPLITUDE: 16,
    WAVE_SPEED: 0.006,
    PATROL_RANGE: 100,
    CHASE_RANGE: 0,             // não persegue: prefere o rasante
    CHASE_SPEED: 0,
    DIVE_RANGE: 300,
    DIVE_WARNING_MS: 450,       // treme antes do rasante
    DIVE_SPEED: 360,
    DIVE_MS: 650,
    DIVE_COOLDOWN_MS: 2200,
    MELEE_REACH: 60
  },

  // --- Ouriço espinhoso -----------------------------------------------------
  [EnemyTypeId.HEDGEHOG]: {
    NAME: 'Ouriço',
    BEHAVIOR: EnemyBehavior.SPIKY,
    FRAMES: ['ourico_0', 'ourico_1'],
    FRAME_MS: 220,
    SCALE: 0.1,
    HP: 28,
    SPEED: 40,
    MELEE_REACH: 60
  },

  // --- Águia (rara) -----------------------------------------------------------
  [EnemyTypeId.EAGLE]: EAGLE_BASE,

  // Bico de lança: mergulha mais vezes, quase sem avisar, e MUITO rápido
  [EnemyTypeId.EAGLE_SHARP]: {
    ...EAGLE_BASE, ...eagleFrames('lanca'),
    NAME: 'Águia-Bico-de-Lança',
    DIVE_CHECK_MS: 1000,
    DIVE_CHANCE_PERCENT: 65,
    DIVE_WARNING_MS: 180,
    DIVE_SPEED: 640,
    // o bico entala no chão por 2 s (hora de bater!) e depois ela dá estocadas
    TRICK: { ID: 'STUCK_BEAK', STUCK_MS: 2000, LUNGE_EVERY_MS: 2800, LUNGE_MS: 350, LUNGE_SPEED: 320, LUNGE_RANGE_X: 260 }
  },
  // Dourada: solta 3 ovos de uma vez, em leque, e com mais frequência
  [EnemyTypeId.EAGLE_GOLD]: {
    ...EAGLE_BASE, ...eagleFrames('dourada'),
    NAME: 'Águia-Dourada',
    EGG: { ...EAGLE_BASE.EGG, COUNT: 3, SPREAD_X: 70, INTERVAL_MS: { MIN: 3500, MAX: 5000 } },
    STOMP_HURTS: true           // coroa pontuda: pisar nela machuca, como no ouriço
  },
  // Rabo de leque: voa rápido em zigue-zague, subindo e descendo
  [EnemyTypeId.EAGLE_FAN]: {
    ...EAGLE_BASE, ...eagleFrames('leque'),
    NAME: 'Águia-Rabo-de-Leque',
    SPEED: 120,
    PATROL_RANGE: 300,
    SOAR_WAVE: { HEIGHT: 40, SPEED: 0.006 },
    GROUND_SPEED: 90,           // no chão anda bem mais rápido
    // no chão abana o rabo: o vento empurra o jogador para trás
    TRICK: { ID: 'TAIL_GUST', EVERY_MS: 2600, RANGE_X: 240, RANGE_Y: 90, FORCE: 520 }
  },
  // Asa larga: maior, mergulha rápido de asas ABERTAS (área maior para acertar)
  [EnemyTypeId.EAGLE_WIDE]: {
    ...EAGLE_BASE, ...eagleFrames('larga'),
    NAME: 'Águia-Asa-Larga',
    SCALE: 0.11,
    HP: 45,
    DIVE_SPEED: 560,
    DIVE_OPEN_WINGS: { SCALE: 1.4 },
    // no chão se cobre com as asas: nesse tempo nada acerta
    TRICK: { ID: 'WING_SHIELD', EVERY_MS: 4000, MS: 1600 }
  },
  // Negra: não pousa — depois do mergulho sobe de novo e volta a mergulhar
  [EnemyTypeId.EAGLE_BLACK]: {
    ...EAGLE_BASE, ...eagleFrames('negra'),
    NAME: 'Águia-Negra',
    DIVE_SPEED: 500,
    DIVE_CHANCE_PERCENT: 55,
    REBOUND: { RISE_SPEED: 260, PAUSE_MS: 900 },
    // ao subir de volta solta 3 penas afiadas que caem balançando
    TRICK: { ID: 'FEATHER_DARTS', COUNT: 3, SPREAD_X: 90, SPEED_Y: 60, TEXTURE: 'aguia_pena' }
  }
});
