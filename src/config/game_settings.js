/**
 * game_settings.js
 * -----------------------------------------------------------------------------
 * Configurações GERAIS do jogo (valem para qualquer fase/personagem).
 *
 * Configurações específicas ficam em arquivos próprios:
 *   characters.js   → personagens jogáveis
 *   enemy_types.js  → bichos pequenos (slime, morcego, fantasma...)
 *   boss_types.js   → chefões (dragões, serpente)
 *   levels.js       → fases (chão, buracos, plataformas, inimigos, arena)
 *   difficulties.js → multiplicadores de dificuldade
 *
 * O objeto é congelado profundamente (deepFreeze) para impedir que alguma
 * classe altere configurações por engano durante a execução.
 * -----------------------------------------------------------------------------
 */

/**
 * Congela um objeto e todos os seus objetos internos (recursivamente).
 * @param {object} obj
 * @returns {object} o mesmo objeto, agora imutável
 */
function deepFreeze(obj) {
  Object.values(obj).forEach(value => {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) deepFreeze(value);
  });
  return Object.freeze(obj);
}

const GameSettings = deepFreeze({
  SCREEN: {
    WIDTH: 800,
    HEIGHT: 600,
    BACKGROUND_COLOR: '#000000'
  },

  PHYSICS: {
    GRAVITY_Y: 1600,
    DEBUG: false // true = mostra as hitboxes (útil para ajustar colisões)
  },

  FONT: {
    FAMILY: '"Press Start 2P", monospace' // fonte pixelada (Google Fonts)
  },

  AUDIO: {
    MUSIC_KEY: 'backgroundMusic',
    MUSIC_VOLUME: 0.2
  },

  CAMERA: {
    LERP: 0.12,                 // suavidade ao seguir o jogador
    DEADZONE_WIDTH: 120
  },

  BACKGROUND: {
    SCROLL_SPEED: 0.35,         // rolagem automática (pixels por frame)
    PARALLAX: 0.15,             // o fundo anda mais devagar que a câmera
    DEFAULT_TEXTURE: 'bg',
    SEAMLESS_BLEND: 0.3,        // fração da imagem usada para esconder a emenda
    PHASE_FADE_MS: 1400,        // transição suave (fade) ao trocar o fundo do chefão
    // Na luta contra o chefão o fundo muda conforme a vida dele cai
    PHASES: [
      { MAX_HP_RATIO: 0.4, TEXTURE: 'bg_phase_40' },
      { MAX_HP_RATIO: 0.8, TEXTURE: 'bg_phase_80' }
    ]
  },

  LEVEL: {
    GROUND_TOP: 540,            // altura (y) do chão "nível 0" (morros sobem a partir daqui)
    GROUND_TILE_SCALE: 0.2,     // bloco de 160px vira 32px na tela (cada "pixel" = 4px)
    TOP_STRIP_HEIGHT: 32,       // faixa de grama no topo do chão
    TERRAIN_BOTTOM: 680,        // até onde o chão desce (abaixo da tela)
    // Rampas: degraus pequenos que a física sobe sozinha (limite do Arcade ≈ 4px)
    RAMP_STEP_WIDTH: 8,
    RAMP_STEP_HEIGHT: 4,
    RAMP_GRASS_HEIGHT: 12,      // grama + contorno desenhados no topo da rampa
    HOLE_EXTRA_WIDTH: 12,       // alarga os buracos dos mapas (64px -> 76px; o pulo alcança ~85px)
    CORNER_RADIUS: 14,          // beiradas do chão arredondadas (buracos e paredões)
    PIT_Y: 680,                 // abaixo disso o jogador caiu no buraco
    RESPAWN_HEIGHT: 60,         // renasce um pouco acima do chão do checkpoint
    ARENA_WIDTH: 800,           // a arena do chefão ocupa uma tela inteira
    ARENA_TRIGGER_OFFSET: 140   // quanto entrar na arena para a luta começar
  },

  PLATFORMS: {
    SCALE: 0.25,
    BODY_HEIGHT: 50,
    BODY_OFFSET_X: 30,
    BODY_OFFSET_Y_FROM_BOTTOM: 70
  },

  PLAYER: {
    START_X: 100,
    START_Y: 450,
    DEPTH: 2,                   // desenhado na frente de inimigos e chefões
    JUMP_VELOCITY: -580,

    // "Balanço" ao caminhar
    SHAKE_FREQUENCY: 0.4,
    SHAKE_AMPLITUDE: 0.8,

    HIT_KNOCKBACK_Y: -300,
    DAMAGE_COOLDOWN_MS: 1500,   // após levar dano, fica invulnerável (piscando) por este tempo
    BLINK_INTERVAL_MS: 100,     // velocidade do piscar durante o cooldown
    BLINK_ALPHA: 0.15,          // transparência no "apagado" do piscar
    STOMP_BOUNCE_Y: -420,       // pulinho ao pisar em um inimigo
    COYOTE_TIME_MS: 110         // ainda dá para pular logo após sair do chão
  },

  // Efeito do gelo (deixa o jogador lento)
  // Bola de gelo do Urso Polar: congela (não tira coração)
  FREEZE_EFFECT: {
    DURATION_MS: 3000,
    IMMUNE_AFTER_MS: 1200,      // depois de descongelar, um tempinho sem poder congelar de novo
    TINT: 0xbfefff
  },

  SLOW_EFFECT: {
    DURATION_MS: 2000,
    SPEED_MULTIPLIER: 0.55,
    TINT: 0x9fd8ff
  },

  SWORD_ATTACK: {
    DAMAGE: 15,
    COOLDOWN_MS: 380,           // tempo mínimo entre golpes de espada
    POSE_DURATION_MS: 200
  },

  BOW_ATTACK: {
    DAMAGE: 12,
    ARROW_SPEED: 760,
    COOLDOWN_MS: 450,           // tempo mínimo entre flechas
    POSE_DURATION_MS: 200,
    ARROW_TEXTURE: 'flecha',
    ARROW_SCALE: 0.085,
    ARROW_OFFSET_X: 18,         // sai um pouco à frente da arqueira
    ARROW_OFFSET_Y: -2,
    ARROW_GRAVITY: 520,         // gravidade própria da flecha (arco suave)
    // Flecha cravada no chão/ilha/paredão vira uma plataforminha
    STUCK_EMBED: 7,             // quanto a ponta "entra" no terreno (px)
    STUCK_PLATFORM: { WIDTH: 24, HEIGHT: 6 },
    MAX_STUCK: 8                // limite de flechas cravadas (as mais antigas somem)
  },

  ENEMY: {
    DEPTH: 1,
    ACTIVATION_MARGIN: 200,     // só atualiza inimigos perto da câmera
    HIT_FLASH_MS: 90,
    HIT_SHAKE: { DURATION_MS: 110, INTENSITY: 0.004 }, // tremidinha da tela ao acertar um bicho
    KNOCKBACK_X: 160,
    DEATH_FADE_MS: 250,
    STOMP_TOLERANCE: 10,        // pés do jogador acima do topo do inimigo
    LEDGE_LOOKAHEAD: 4,         // distância extra ao procurar beirada

    // Bichos sorteados (RANDOM_ENEMIES das fases)
    RANDOM_SPAWN: {
      SAFE_START_X: 450,        // não nasce bicho perto do começo da fase
      SAFE_BEFORE_ARENA: 250,   // nem colado na arena do chefão
      MIN_DISTANCE: 70,         // distância mínima entre bichos sorteados
      FLYER_Y: { MIN: 200, MAX: 360 },
      EDGE_MARGIN: 30,          // quem anda precisa de chão firme dos dois lados
      WAVE_AHEAD_X: 80,         // a onda surge um pouco além da borda da tela
      MAX_TRIES: 30
    }
  },

  BOSS: {
    DEPTH: 1,
    HIT_COOLDOWN_FRAMES: 30,
    HIT_ALPHA: 0.5
  },

  DRAGON: {
    START_X: 700,               // relativo ao início da arena
    START_Y: 150,
    // Os quadros da folha de animação têm 130x149px; escala 2 ≈ 260x300 na tela
    SCALE: 2,
    BODY: { WIDTH: 70, HEIGHT: 80 }, // hitbox (px do quadro), centralizada
    MELEE_REACH: 150,

    WANDER_INTERVAL_FRAMES: 100,
    MAX_SPEED_BOOST: 4,         // com vida zerada voa (1 + 4)x mais rápido

    // Área em que o dragão pode voar, relativa à arena
    BOUNDS: { MIN_X: 50, MAX_X: 750, MIN_Y: 50, MAX_Y: 550 },
    BOUNDS_PUSH_SPEED: 100,

    FLEE_SPEED_X: 300,
    FLEE_SPEED_Y: 200,

    // Boca no quadro (proporção), com o dragão olhando para a DIREITA
    MOUTH: { X: 0.8, Y: 0.42 }
  },

  // Animações do dragão (veja dragon_animation.js e dragon_sprite_sheets.js)
  DRAGON_ANIMATION: {
    // Clipes da folha de animação: velocidade (quadros/s), repetição
    // (-1 = repete sempre, 0 = toca uma vez) e, se quiser, quais quadros usar
    // SOURCE = animação da sheet de onde o clipe tira os quadros (se for outra)
    CLIPS: {
      voando:      { FPS: 9,  REPEAT: -1, SOURCE: 'aproximando', FRAMES: [0, 1, 2] }, // voo de lado
      parado:      { FPS: 7,  REPEAT: -1 },
      subindo:     { FPS: 10, REPEAT: -1, FRAMES: [0, 1, 2, 3] },
      descendo:    { FPS: 10, REPEAT: -1 },
      ataque:      { FPS: 16, REPEAT: 0 },
      de_frente:   { FPS: 12, REPEAT: -1 },
      impulso:     { FPS: 18, REPEAT: 0 },
      morrendo:    { FPS: 8,  REPEAT: 0 },
      de_costas:   { FPS: 10, REPEAT: -1 },
      virando:     { FPS: 14, REPEAT: 0 },
      girando:     { FPS: 14, REPEAT: -1 },
      aproximando: { FPS: 10, REPEAT: 0 },
      planando:    { FPS: 8,  REPEAT: -1 }
    },
    // Na sprite sheet estes foram desenhados olhando para a ESQUERDA
    CLIPS_FACING_LEFT: ['voando', 'parado', 'virando', 'aproximando'],

    // Qual clipe usar em cada situação
    STATE_CLIPS: {
      FLY: 'voando',
      ASCEND: 'subindo',
      DIVE: 'descendo',
      ATTACK: 'ataque',
      SPECIAL: 'de_frente',
      HURT: 'impulso',
      DEATH: 'morrendo'
    },
    SPECIAL_MS: 750,            // quanto tempo fica "de frente" no poder especial
    VERTICAL_THRESHOLD: 70,     // velocidade vertical que define subir/mergulhar
    MIN_CLIP_MS: 350,           // tempo mínimo numa pose de voo antes de trocar
    ATTACK_HOVER_FACTOR: 0.15,  // ao atacar, reduz a velocidade (para no ar)
    HURT_SHAKE_PX: 6,
    DEATH_FADE_MS: 900          // depois da animação de morte, some aos poucos
  },

  // Abertura de fase (imagem + título no centro, some em fade)
  LEVEL_INTRO: {
    IMAGE_SCALE: 2.2,
    IMAGE_OFFSET_Y: 30,
    TITLE_SIZE: 28,
    TITLE_GAP: 18,
    SHADE_ALPHA: 0.45,
    FADE_IN_MS: 400,
    HOLD_MS: 3000,
    FADE_OUT_MS: 900
  },

  // Urso Polar (chefão da fase 4): luta no chão — veja bear_brain.js
  POLAR_BEAR: {
    START_X: 640,               // relativo ao início da arena
    BODY: { WIDTH: 64, HEIGHT: 58, FOOT_PADDING: 4 },
    MELEE_REACH: 100,
    HIT_FLASH_MS: 90,
    HIT_SHAKE: { DURATION_MS: 120, INTENSITY: 0.005 },
    ROAR_MS: 1400,
    IDLE_MS: 350,
    TURN_MS: 170,
    CROUCH_MS: 380,             // agachado (aviso) antes de investir/pular
    ACTION_DELAY_MS: { MIN: 900, MAX: 1800 }, // tempo andando entre um golpe e outro
    ANGRY_HP_RATIO: 0.5,        // abaixo disso ele ruge e fica bravo
    ANGRY_SPEED: 1.25,
    ANGRY_DELAY: 0.65,
    // Chance de cada golpe (ajustada pela distância/altura do jogador)
    ACTION_WEIGHTS: { DASH: 30, JUMP: 22, QUAKE: 24, SLAM: 12, THROW: 22 },
    DASH: { SPEED_MULTIPLIER: 3.4, DURATION_MS: 300, PAUSE_MS: 220, COUNT: 2, ANGRY_COUNT: 3, SKID_MS: 420 },
    JUMP: { VELOCITY_Y: -760, MAX_SPEED_X: 380, LAND_MS: 420 },
    QUAKE: {
      REAR_MS: 640,             // levantando nas patas traseiras
      WAVE_AT_MS: 300,          // momento da pisada dentro da animação de impacto
      STOMP_MS: 680,
      SECOND_WAVE_MS: 480,      // bravo: segunda leva de ondas
      SHAKE_MS: 380,
      SHAKE_INTENSITY: 0.014,
      ICICLES: 4                // bravo: a pisada também derruba pinos de gelo
    },
    // Pinos de gelo caindo do céu — SÓ quando bravo (abaixo de 50% da vida)
    ICICLES: {
      INTERVAL_MS: { MIN: 3000, MAX: 6000 },  // chuvas de pinos de tempos em tempos
      PER_RAIN: { MIN: 2, MAX: 4 },
      STAGGER_MS: 220,          // tempo entre um pino e outro da mesma chuva
      WARNING_MS: 650,          // tremendo lá em cima antes de cair
      FALL_SPEED: 120,          // velocidade inicial (a gravidade acelera)
      START_Y: 0,
      SCALE: 1.3
    },
    SLAM: { WAVE_AT_MS: 360, DURATION_MS: 600, WAVE_SPEED_MULTIPLIER: 1.45 },
    THROW: { RELEASE_AT_MS: 290, DURATION_MS: 600, BALLS: 1, ANGRY_BALLS: 3 },
    WAVE: { SPEED: 250, WIDTH: 26, HEIGHT: 26, SCALE: 1 },
    // Depois de perder 20% da vida, chama morceguinhos (os lentos da fase 1)
    // e slimezinhos de gelo (FLYING = entra voando; senão, pelo chão)
    MINIONS: {
      HP_RATIO: 0.8,
      TYPES: [{ TYPE: 'BAT', FLYING: true }, { TYPE: 'SLIME_ICE', FLYING: false }],
      INTERVAL_MS: { MIN: 4000, MAX: 9000 },  // momentos aleatórios
      PER_CALL: { MIN: 1, MAX: 2 },
      MAX_ALIVE: 4,
      Y: { MIN: 120, MAX: 260 }
    },
    SNOWBALL_SCALE: 1.6,
    DEFEAT_PAUSE_MS: 1200,      // tempo olhando a bola de neve antes da vitória
    // Clipes da folha (tools/bear_sheet.py): quadros/s, repetição e, se
    // quiser, SOURCE (animação de onde tirar os quadros) e FRAMES
    CLIPS: {
      parado:       { FPS: 7,  REPEAT: -1 },
      andando:      { FPS: 9,  REPEAT: -1 },
      correndo:     { FPS: 18, REPEAT: -1 },
      batendo:      { FPS: 14, REPEAT: 0 },
      pulando_sobe: { FPS: 14, REPEAT: 0, SOURCE: 'pulando', FRAMES: [0, 1, 2, 3] },
      pulando_desce:{ FPS: 10, REPEAT: 0, SOURCE: 'pulando', FRAMES: [4, 5, 6] },
      pouso:        { FPS: 12, REPEAT: 0, SOURCE: 'pulando', FRAMES: [7, 7, 7, 7] },
      impacto:      { FPS: 12, REPEAT: 0 },
      derrapando:   { FPS: 18, REPEAT: 0 },
      agachado:     { FPS: 20, REPEAT: 0 },
      levantando:   { FPS: 14, REPEAT: 0 },
      atacando:     { FPS: 14, REPEAT: 0 },
      virando_esq:  { FPS: 24, REPEAT: 0, FRAMES: [0, 1, 2, 3] },
      virando_dir:  { FPS: 24, REPEAT: 0, FRAMES: [0, 1, 2, 3] },
      rugindo:      { FPS: 6,  REPEAT: 1 },
      morrendo:     { FPS: 7,  REPEAT: 0 },
      enrolado:     { FPS: 4,  REPEAT: 0 }
    }
  },

  SERPENT: {
    START_X: 650,               // relativo ao início da arena
    START_Y: 200,
    MELEE_REACH: 70,            // alcance da espada até qualquer parte do corpo
    BOUNDS: { MIN_X: 70, MAX_X: 730, MIN_Y: 80, MAX_Y: 470 },
    PATH_POINT_SPACING: 4,      // px entre pontos do rastro da cabeça
    WAYPOINT_REACHED: 40,
    STEERING: 0.06,             // quão rápido a serpente faz curvas (0 a 1)
    HIT_FLASH_MS: 100,
    HIT_SHAKE: { DURATION_MS: 140, INTENSITY: 0.006 }  // igual à do dragão
  },

  FIREBALL: {
    SCALE: 0.07,                // 30% menores que antes (0.1)
    BODY_SIZE: 140,
    // Efeitos: brilho pulsante + chama tremulando + rastro de faíscas
    FLICKER_SCALE: 0.08,        // variação de tamanho da chama
    FLICKER_ANGLE_DEG: 5,       // a chama "balança" um pouco
    GLOW_SCALE: 0.385,
    TRAIL_FREQUENCY_MS: 28,
    TRAIL_LIFESPAN_MS: 320,
    // Cores de cada tipo de projétil (brilho e faíscas)
    COLORS: {
      bola_fogo:      { GLOW: 0xff7a1a, SPARKS: [0xfff1a8, 0xffb347, 0xff6a00, 0xd93a00] },
      bola_fogo_azul: { GLOW: 0x3aa0ff, SPARKS: [0xe6f6ff, 0x8fd0ff, 0x3a8cff, 0x1f4fd9] },
      bola_gelo:      { GLOW: 0x7fe3ff, SPARKS: [0xffffff, 0xc8f4ff, 0x7fdcff, 0x4fb6e6] },
      bola_rosa:      { GLOW: 0xff4fc3, SPARKS: [0xffe0f5, 0xff9ad9, 0xff4fc3, 0xb02a8c] }
    },
    // A arte da bola de fogo tem o núcleo embaixo à esquerda e o rastro
    // subindo para a direita. O sprite gira em torno do núcleo para que o
    // rastro fique sempre PARA TRÁS da direção do movimento.
    CORE_ORIGIN: { X: 0.26, Y: 0.75 },
    ART_DIRECTION_RAD: Math.atan2(1, -1), // núcleo → para baixo/esquerda (135°)
    DESPAWN_MARGIN: 80
  },

  POTION: {
    TEXTURE: 'pocao',
    SCALE: 0.08,
    ARENA_OFFSET_Y: -50,        // aparece acima da plataforma
    FLOAT_AMPLITUDE: 4,
    FLOAT_DURATION_MS: 900
  },

  // Especial (tecla G): um por personagem, recarga de 25s (menos 2s por bicho)
  SPECIAL: {
    COOLDOWN_MS: 25000,
    KILL_REDUCTION_MS: 2000,    // cada bicho derrotado adianta a recarga em 2s
    ARROW_STORM: {              // arqueira: flechas para todas as direções
      ARROWS: 16,
      WAVES: 2,
      WAVE_DELAY_MS: 160
    },
    DASH: {                     // guerreiro: investida com dano contínuo
      DURATION_MS: 500,
      SPEED_MULTIPLIER: 1.5,
      TICK_MS: 100,             // um golpe a cada 0,1s durante a investida
      TICK_DAMAGE: 8,
      REACH: 60,
      GHOST_EVERY_MS: 50        // rastro de "fantasmas"
    }
  },

  // Árvores quebráveis (bloqueiam o caminho; quebram com golpes)
  TREE: {
    TEXTURES: ['arvore_0', 'arvore_1'], // [inteira, rachada]
    SCALE: 0.27,                // ~130x160 na tela: alta demais para pular
    DEPTH: 0.5,
    HP: 45,                     // 3 golpes de espada ou 4 flechas
    TRUNK_WIDTH_RATIO: 0.3,     // a hitbox é só o tronco (a copa é visual)
    MELEE_REACH: 75,
    CHIPS_PER_HIT: 8,
    CHIPS_ON_BREAK: 24,
    FALL_MS: 700,
    HIT_SHAKE: { DURATION_MS: 90, INTENSITY: 0.003 }
  },

  // Bandeira de chegada (fases ainda sem chefão)
  GOAL_FLAG: {
    TEXTURE: 'bandeira',
    SCALE: 0.2,
    X_IN_END_ZONE: 500          // posição dentro da área final da fase
  },

  // Tela de escolha de fase: caixinhas numeradas (as que não existem ainda
  // aparecem como "em desenvolvimento")
  LEVEL_SELECT: {
    TOTAL_SLOTS: 30,
    COLUMNS: 6,
    BOX: { WIDTH: 90, HEIGHT: 64 },
    GAP: { X: 20, Y: 16 },
    START_Y: 150
  },

  HUD: {
    HEARTS: { TEXTURE: 'heart', X: 30, Y: 30, SPACING: 40, SCALE: 0.09 },
    BOSS_BAR: {
      X: 250, Y: 20, WIDTH: 400, HEIGHT: 20,
      COLOR: 0xff0000, BACK_COLOR: 0x000000, BACK_ALPHA: 0.35,
      LABEL_Y: 50
    },
    BANNER_DURATION_MS: 2200,
    DEPTH: 10
  }
});
