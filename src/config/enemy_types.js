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
 *   (caverna) SONIC, DROPPER, AMBUSH — veja cada um abaixo
 *   (pântano) TONGUE → sapo da língua que puxa | BULLFROG → sapo-boi do tremor
 *             SWIMMER → nada na superfície da lagoa e dá bote (jacaré, cobra-d'água)
 *             LEAPER → jacaré escondido que salta da água | LOG → jacaré-tronco
 *             TURTLE → tartaruga (casco que desliza) | HERON → garça que bica
 *             PIRANHA → pula da água | EEL → poraquê (choque) | LEECH → sanguessuga
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
  EAGLE: 'EAGLE',
  SONIC: 'SONIC',       // morcego que grita: ondas de som empurram o jogador
  DROPPER: 'DROPPER',   // aranha pendurada no teto que cai em cima do jogador
  AMBUSH: 'AMBUSH',     // besouro que finge ser pedra e investe quando o jogador chega
  TONGUE: 'TONGUE',     // sapo que puxa o jogador com a língua
  BULLFROG: 'BULLFROG', // sapo-boi: ao cair do pulo, tremor que empurra
  SWIMMER: 'SWIMMER',   // nada na superfície da lagoa e dá bote
  LEAPER: 'LEAPER',     // jacaré escondido (só os olhos) que salta da água
  LOG: 'LOG',           // jacaré que parece tronco (dá para pisar) e acorda
  TURTLE: 'TURTLE',     // tartaruga: pisou, vira casco; chutou, o casco desliza derrubando bichos
  HERON: 'HERON',       // garça parada na margem que dá bicadas
  PIRANHA: 'PIRANHA',   // peixe que pula da água num arco na direção do jogador
  EEL: 'EEL',           // poraquê: dá choque em quem está nadando perto
  LEECH: 'LEECH'        // sanguessuga: gruda em quem está nadando
});

/** Bichos que vivem no chão (nascem sobre o terreno e colidem com ele). */
const GROUND_BEHAVIORS = Object.freeze([
  EnemyBehavior.WALKER, EnemyBehavior.SNAKE, EnemyBehavior.HOPPER,
  EnemyBehavior.SHOOTER, EnemyBehavior.SPIKY, EnemyBehavior.AMBUSH,
  EnemyBehavior.TONGUE, EnemyBehavior.BULLFROG, EnemyBehavior.TURTLE, EnemyBehavior.HERON
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
  EAGLE_BLACK: 'EAGLE_BLACK',
  // bichos da caverna (fase 7)
  BAT_VAMPIRE: 'BAT_VAMPIRE',
  BAT_SONIC: 'BAT_SONIC',
  BAT_GIANT: 'BAT_GIANT',
  CENTIPEDE: 'CENTIPEDE',
  SPIDER: 'SPIDER',
  ROCK_BEETLE: 'ROCK_BEETLE',
  MOTH: 'MOTH',
  // bichos do pântano (fase 8)
  FROG_TONGUE: 'FROG_TONGUE',
  FROG_POISON: 'FROG_POISON',
  BULLFROG: 'BULLFROG',
  GATOR: 'GATOR',
  GATOR_LEAPER: 'GATOR_LEAPER',
  GATOR_LOG: 'GATOR_LOG',
  DRAGONFLY: 'DRAGONFLY',
  MOSQUITO: 'MOSQUITO',
  WATER_SNAKE: 'WATER_SNAKE',
  TURTLE: 'TURTLE',
  HERON: 'HERON',
  PIRANHA: 'PIRANHA',
  EEL: 'EEL',
  LEECH: 'LEECH'
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
    REBOUND: { RISE_SPEED: 70, PAUSE_MS: 900 }, // sobe devagarzinho, na velocidade do morcego
    // ao subir de volta solta 3 penas afiadas que caem balançando
    TRICK: { ID: 'FEATHER_DARTS', COUNT: 3, SPREAD_X: 90, SPEED_Y: 60, TEXTURE: 'aguia_pena' }
  },

  // ---------------------------------------------------------------- caverna (fase 7)
  // Vampiro: dá rasante como a vespa e a mordida deixa o jogador lento
  [EnemyTypeId.BAT_VAMPIRE]: {
    NAME: 'Morcego-Vampiro',
    BEHAVIOR: EnemyBehavior.DIVER,
    FRAMES: ['morcego_vampiro_0', 'morcego_vampiro_1'],
    FRAME_MS: 120,
    SCALE: 0.1,
    HP: 16,
    SPEED: 75,
    WAVE_AMPLITUDE: 24,
    WAVE_SPEED: 0.005,
    PATROL_RANGE: 140,
    CHASE_RANGE: 0,
    CHASE_SPEED: 0,
    DIVE_RANGE: 280,
    DIVE_WARNING_MS: 400,
    DIVE_SPEED: 380,
    DIVE_MS: 650,
    DIVE_COOLDOWN_MS: 2400,
    MELEE_REACH: 60,
    CONTACT_EFFECT: 'SLOW'      // a mordida deixa lento
  },
  // Sônico: de tempos em tempos para no ar e grita — o som empurra o jogador
  [EnemyTypeId.BAT_SONIC]: {
    NAME: 'Morcego-Sônico',
    BEHAVIOR: EnemyBehavior.SONIC,
    FRAMES: ['morcego_sonico_0', 'morcego_sonico_1'],
    FRAME_MS: 140,
    SCALE: 0.1,
    HP: 16,
    SPEED: 60,
    WAVE_AMPLITUDE: 20,
    WAVE_SPEED: 0.004,
    PATROL_RANGE: 120,
    CHASE_RANGE: 0,
    CHASE_SPEED: 0,
    MELEE_REACH: 60,
    SONIC: { EVERY_MS: 3500, SCREAM_MS: 600, RADIUS: 240, FORCE: 440 } // o grito alcança quem está no chão embaixo
  },
  // Gigante: grandão e lento; ao morrer vira dois morceguinhos
  [EnemyTypeId.BAT_GIANT]: {
    NAME: 'Morcego-Gigante',
    BEHAVIOR: EnemyBehavior.FLYER,
    FRAMES: ['morcego_gigante_0', 'morcego_gigante_1'],
    FRAME_MS: 200,
    SCALE: 0.17,
    HP: 40,
    SPEED: 50,
    WAVE_AMPLITUDE: 26,
    WAVE_SPEED: 0.003,
    PATROL_RANGE: 140,
    CHASE_RANGE: 240,
    CHASE_SPEED: 70,
    MELEE_REACH: 80,
    SPLIT: { TYPE: 'BAT', COUNT: 2 }
  },
  // Centopeia: rápida e espinhuda (pisar nela machuca, como no ouriço)
  [EnemyTypeId.CENTIPEDE]: {
    NAME: 'Centopeia',
    BEHAVIOR: EnemyBehavior.SPIKY,
    FRAMES: ['centopeia_0', 'centopeia_1'],
    FRAME_MS: 90,
    SCALE: 0.1,
    HP: 24,
    SPEED: 95,
    MELEE_REACH: 70
  },
  // Aranha: pendurada no fio lá no alto; cai quando o jogador passa embaixo
  [EnemyTypeId.SPIDER]: {
    NAME: 'Aranha',
    BEHAVIOR: EnemyBehavior.DROPPER,
    FRAMES: ['aranha_0', 'aranha_1'],
    FRAME_MS: 160,
    SCALE: 0.1,
    HP: 18,
    SPEED: 55,
    MELEE_REACH: 60,
    DROP_RANGE_X: 60,
    DROP_SPEED: 260
  },
  // Besouro-Pedra: finge ser pedra (não apanha); acorda investindo
  [EnemyTypeId.ROCK_BEETLE]: {
    NAME: 'Besouro-Pedra',
    BEHAVIOR: EnemyBehavior.AMBUSH,
    FRAMES: ['besouro_0', 'besouro_1'],
    SLEEP_FRAME: 'besouro_dormindo',
    FRAME_MS: 110,
    SCALE: 0.11,
    HP: 30,
    SPEED: 60,
    MELEE_REACH: 65,
    WAKE_RANGE_X: 170,
    CHARGE_SPEED: 300,
    CHARGE_MS: 700
  },
  // Traça: voa em zigue-zague, frágil; ao morrer solta pó que deixa lento
  [EnemyTypeId.MOTH]: {
    NAME: 'Traça',
    BEHAVIOR: EnemyBehavior.FLYER,
    FRAMES: ['traca_0', 'traca_1'],
    FRAME_MS: 80,
    SCALE: 0.09,
    HP: 6,
    SPEED: 80,
    WAVE_AMPLITUDE: 40,
    WAVE_SPEED: 0.012,
    PATROL_RANGE: 90,
    CHASE_RANGE: 220,
    CHASE_SPEED: 75,
    MELEE_REACH: 55,
    DEATH_DUST: { RADIUS: 60, MS: 1800 }
  },

  // ---------------------------------------------------------------- pântano (fase 8)
  // Sapo-Língua: a linguada puxa o jogador para perto da boca
  [EnemyTypeId.FROG_TONGUE]: {
    NAME: 'Sapo-Língua',
    BEHAVIOR: EnemyBehavior.TONGUE,
    FRAMES: ['sapo_lingua_0', 'sapo_lingua_1'],
    FRAME_MS: 300,
    SCALE: 0.1,
    HP: 22,
    SPEED: 130,
    JUMP_VELOCITY: -440,
    JUMP_INTERVAL_MS: 1700,
    JUMP_RANGE: 300,
    MELEE_REACH: 60,
    TONGUE: { RANGE_X: 150, RANGE_Y: 40, MS: 450, COOLDOWN_MS: 2200, PULL_FORCE: 300, COLOR: 0xd8607a }
  },
  // Sapo-Venenoso: pisar machuca, encostar deixa lento e ao morrer solta uma nuvem de veneno
  [EnemyTypeId.FROG_POISON]: {
    NAME: 'Sapo-Venenoso',
    BEHAVIOR: EnemyBehavior.HOPPER,
    FRAMES: ['sapo_venenoso_0', 'sapo_venenoso_1'],
    FRAME_MS: 300,
    SCALE: 0.1,
    HP: 18,
    SPEED: 170,
    JUMP_VELOCITY: -480,
    JUMP_INTERVAL_MS: 1200,
    JUMP_RANGE: 320,
    MELEE_REACH: 60,
    STOMP_HURTS: true,
    CONTACT_EFFECT: 'SLOW',
    DEATH_DUST: { RADIUS: 55, MS: 1600, TINT: [0x8ae04a, 0x5cc84a, 0xc8f070] }
  },
  // Sapo-Boi: grandão; ao cair do pulo faz um tremor que empurra quem está no chão
  [EnemyTypeId.BULLFROG]: {
    NAME: 'Sapo-Boi',
    BEHAVIOR: EnemyBehavior.BULLFROG,
    FRAMES: ['sapo_boi_0', 'sapo_boi_1'],
    FRAME_MS: 300,
    SCALE: 0.17,
    HP: 50,
    SPEED: 110,
    JUMP_VELOCITY: -560,
    JUMP_INTERVAL_MS: 2300,
    JUMP_RANGE: 360,
    MELEE_REACH: 75,
    QUAKE: { RADIUS: 170, FORCE: 380, COLOR: 0x6a5440 }
  },
  // Jacaré: comprido e mal-encarado; nada na superfície e dá bote em quem está
  // nadando — a mordida arrasta para o fundo. Pisar nas costas faz quicar (trampolim)
  [EnemyTypeId.GATOR]: {
    NAME: 'Jacaré',
    BEHAVIOR: EnemyBehavior.SWIMMER,
    FRAMES: ['jacare_0', 'jacare_1'],
    FRAME_MS: 260,
    SCALE: 0.12,
    HP: 45,
    SPEED: 45,
    FLOAT_Y: 3,                 // só os olhos e as escamas para fora (passa por baixo das vitórias-régias)
    WAVE_AMPLITUDE: 1.5,
    WAVE_SPEED: 0.003,
    MELEE_REACH: 90,
    HITBOX: { TOP: 0.3, HEIGHT: 0.5, WIDTH: 0.9 }, // as escamas de cima e as patas não contam
    BOUNCY_BACK: true,
    // bote só em quem está NADANDO (RANGE_Y: o jogador abaixo deste tanto acima da água)
    LUNGE: { RANGE_X: 190, RANGE_Y: 15, SPEED: 230, MS: 600, COOLDOWN_MS: 1800, FRAME: 'jacare_bote' },
    DRAG: { SPEED: 170, MS: 700 } // mordida: arrasta para o fundo girando
  },
  // Jacaré-Saltador: só os olhos para fora; salta quando o jogador passa por cima
  [EnemyTypeId.GATOR_LEAPER]: {
    NAME: 'Jacaré-Saltador',
    BEHAVIOR: EnemyBehavior.LEAPER,
    FRAMES: ['jacare_bote'],    // saltando de boca aberta
    EYES_FRAME: 'jacare_olhos', // escondido
    FRAME_MS: 1000,
    SCALE: 0.12,
    HP: 35,
    SPEED: 55,                  // seguindo o jogador por baixo d'água
    HIDE_Y: -5,                 // o olho fica logo acima da água
    LEAP_RANGE_X: 55,
    LEAP_HEIGHT: 170,           // só salta se o jogador estiver até esta altura acima da água
    LEAP_VELOCITY: -460,        // salto baixo (dá para acertar)
    REST_MS: 1600,
    MELEE_REACH: 75
  },
  // Jacaré-Tronco: parece um tronco (dá para pisar), mas acorda, afunda e morde
  [EnemyTypeId.GATOR_LOG]: {
    NAME: 'Jacaré-Tronco',
    BEHAVIOR: EnemyBehavior.LOG,
    FRAMES: ['jacare_acordado'],
    LOG_FRAME: 'jacare_tronco',
    FRAME_MS: 1000,
    SCALE: 0.15,
    HP: 40,
    SPEED: 22,                  // tronco indo e voltando devagar
    DRIFT_RANGE: 40,
    FLOAT_Y: 3,
    AWAKE_FLOAT_Y: 10,          // acordado: afunda (só a cabeça para fora)
    WAVE_AMPLITUDE: 1.5,
    WAVE_SPEED: 0.0025,
    WAKE_WARNING_MS: 900,       // treme este tempo antes de afundar
    AWAKE_MS: 2600,
    HUNT_SPEED: 75,             // um pouco mais rápido que o jogador nadando
    MELEE_REACH: 80,
    STOMP_HURTS: true           // acordado: quem afunda em cima dele leva mordida
  },
  // Libélula: rasantes curtinhos e muito rápidos
  [EnemyTypeId.DRAGONFLY]: {
    NAME: 'Libélula',
    BEHAVIOR: EnemyBehavior.DIVER,
    FRAMES: ['libelula_0', 'libelula_1'],
    FRAME_MS: 50,
    SCALE: 0.1,
    HP: 10,
    SPEED: 90,
    WAVE_AMPLITUDE: 10,
    WAVE_SPEED: 0.01,
    PATROL_RANGE: 140,
    CHASE_RANGE: 0,
    CHASE_SPEED: 0,
    DIVE_RANGE: 260,
    DIVE_WARNING_MS: 220,
    DIVE_SPEED: 520,
    DIVE_MS: 280,
    DIVE_COOLDOWN_MS: 1300,
    MELEE_REACH: 55
  },
  // Mosquito: em nuvens; a picada deixa lento
  [EnemyTypeId.MOSQUITO]: {
    NAME: 'Mosquito',
    BEHAVIOR: EnemyBehavior.FLYER,
    FRAMES: ['mosquito_0', 'mosquito_1'],
    FRAME_MS: 40,
    SCALE: 0.09,
    HP: 4,
    SPEED: 70,
    WAVE_AMPLITUDE: 18,
    WAVE_SPEED: 0.015,
    PATROL_RANGE: 70,
    CHASE_RANGE: 230,
    CHASE_SPEED: 85,
    MELEE_REACH: 50,
    CONTACT_EFFECT: 'SLOW'
  },
  // Cobra-d'água: nada rapidinho na superfície e dá bote
  [EnemyTypeId.WATER_SNAKE]: {
    NAME: "Cobra-d'água",
    BEHAVIOR: EnemyBehavior.SWIMMER,
    FRAMES: ['cobra_agua_0', 'cobra_agua_1'],
    FRAME_MS: 180,
    SCALE: 0.11,
    HP: 16,
    SPEED: 80,
    FLOAT_Y: 6,
    WAVE_AMPLITUDE: 2,
    WAVE_SPEED: 0.006,
    MELEE_REACH: 60,
    LUNGE: { RANGE_X: 160, RANGE_Y: 15, SPEED: 260, MS: 450, COOLDOWN_MS: 1500 }
  },
  // Tartaruga: pisou, vira casco; encostou no casco, ele sai deslizando e derruba os bichos
  [EnemyTypeId.TURTLE]: {
    NAME: 'Tartaruga',
    BEHAVIOR: EnemyBehavior.TURTLE,
    FRAMES: ['tartaruga_0', 'tartaruga_1'],
    FRAME_MS: 260,
    SCALE: 0.1,
    HP: 30,
    SPEED: 35,
    MELEE_REACH: 65,
    SHELL: { FRAME: 'tartaruga_casco', HIDE_MS: 5000, KICK_SPEED: 340, SLIDE_MS: 4500 }
  },
  // Garça: parada na margem numa perna só; bica quem chega perto
  [EnemyTypeId.HERON]: {
    NAME: 'Garça',
    BEHAVIOR: EnemyBehavior.HERON,
    FRAMES: ['garca_0', 'garca_1'],
    FRAME_MS: 700,              // sobe e desce a cabeça devagar
    SCALE: 0.11,
    HP: 30,
    SPEED: 0,
    MELEE_REACH: 70,
    BODY: { WIDTH: 230, HEIGHT: 360, OFFSET_X: 210, OFFSET_Y: 40 }, // só o corpo, sem o bico (em px da arte)
    PECK: { RANGE_X: 95, RANGE_Y: 50, SPEED: 300, MS: 150, COOLDOWN_MS: 1300, TILT_DEG: 20 }
  },
  // Piranha: nada escondida e pula da água num arco na direção do jogador
  [EnemyTypeId.PIRANHA]: {
    NAME: 'Piranha',
    BEHAVIOR: EnemyBehavior.PIRANHA,
    FRAMES: ['piranha_0', 'piranha_1'],
    FRAME_MS: 160,
    SCALE: 0.08,
    HP: 8,
    SPEED: 60,
    SWIM_DEPTH: 22,             // nada um pouco abaixo da superfície
    MELEE_REACH: 55,
    JUMP: { EVERY_MS: 2600, RANGE_X: 220, VELOCITY: -560, MAX_SPEED_X: 220 }
  },
  // Poraquê (peixe-elétrico): de tempos em tempos dá CHOQUE em quem está nadando perto
  [EnemyTypeId.EEL]: {
    NAME: 'Poraquê',
    BEHAVIOR: EnemyBehavior.EEL,
    FRAMES: ['poraque_0', 'poraque_1'],
    FRAME_MS: 260,
    SCALE: 0.09,
    HP: 30,
    SPEED: 30,
    SWIM_DEPTH: 50,             // no meio da lagoa
    MELEE_REACH: 70,
    SHOCK: { EVERY_MS: 4200, CHARGE_MS: 800, RADIUS: 120, COLOR: 0xfff27a }
  },
  // Sanguessuga: gruda em quem está nadando, deixa lento e chupa um coração
  [EnemyTypeId.LEECH]: {
    NAME: 'Sanguessuga',
    BEHAVIOR: EnemyBehavior.LEECH,
    FRAMES: ['sanguessuga_0', 'sanguessuga_1'],
    FRAME_MS: 220,
    SCALE: 0.09,
    HP: 6,
    SPEED: 45,
    SENSE_RANGE: 200,           // nada atrás de quem está na água até esta distância
    DRAIN_MS: 2200,             // grudada este tempo: chupa um coração e cai
    MELEE_REACH: 60
  }
});
