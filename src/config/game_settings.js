/**
 * game_settings.js
 * -----------------------------------------------------------------------------
 * Configurações GERAIS do jogo (valem para qualquer fase/personagem).
 *
 * Configurações específicas ficam em arquivos próprios:
 *   characters.js   → personagens jogáveis
 *   enemy_types.js  → bichos pequenos (slime, morcego, fantasma...)
 *   boss_types.js   → chefões (dragões, serpente, urso)
 *   src/levels/     → fases, uma por arquivo (chão, buracos, inimigos, arena)
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
    MUSIC_VOLUME: 0.13,         // música de fundo baixinha (os efeitos aparecem por cima)
    STORAGE_KEY: 'skySerpents.audio', // música/sons ligados ou desligados (AudioSettings)
    SFX_VOLUME: 0.35,           // efeitos sonoros (SoundFx)
    SFX_MIN_GAP_MS: 45,         // o mesmo som não toca de novo antes disso
    SFX_RANDOM_DETUNE: 40       // variação de tom de cada vez (cents)
  },

  CAMERA: {
    LERP: 0.12,                 // suavidade ao seguir o jogador
    DEADZONE_WIDTH: 120,
    DEADZONE_HEIGHT: 180        // fases mais altas que a tela: a câmera sobe junto
  },

  BACKGROUND: {
    SCROLL_SPEED: 0.35,         // rolagem automática (pixels por frame)
    PARALLAX: 0.15,             // o fundo anda mais devagar que a câmera
    DEFAULT_TEXTURE: 'bg',      // vale dos castelos (tools/castle_background.py)
    SEAMLESS_BLEND: 0.3,        // fração da imagem usada para esconder a emenda
    PHASE_FADE_MS: 1400,        // transição suave (fade) ao trocar o fundo do chefão
    // Na luta contra o chefão o fundo muda conforme a vida dele cai (o mesmo vale,
    // só o céu muda de cor: dourado e depois entardecer)
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
    ARENA_TRIGGER_OFFSET: 140,  // quanto entrar na arena para a luta começar
    ARENA_BACKDROP_FADE_PX: 800, // cenário próprio da arena: começa a aparecer a esta distância
    SKY_ABOVE_TERRAIN: 200,     // céu acima do ponto mais alto (montanha mais alta que a tela)
    LAKE_BED_Y: 590             // fundo das lagoas (WATER): ninguém afunda além disto
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

    WALK_FRAME_MS: 110,         // tempo de cada quadro da caminhada (apoia, levanta, apoia, levanta)
    AIR_POSE_DELAY_MS: 90,      // fora do chão há mais que isso: pose de pulo/queda

    HIT_KNOCKBACK_Y: -300,
    DAMAGE_COOLDOWN_MS: 1500,   // após levar dano, fica invulnerável (piscando) por este tempo
    BLINK_INTERVAL_MS: 100,     // velocidade do piscar durante o cooldown
    BLINK_ALPHA: 0.15,          // transparência no "apagado" do piscar
    STOMP_BOUNCE_Y: -420,       // pulinho ao pisar em um inimigo
    COYOTE_TIME_MS: 110,        // ainda dá para pular logo após sair do chão
    PUSH: { LIFT_Y: -260, MS: 420 }, // empurrão (vento): pulinho e tempo sem controle
    AIR_JUMP: { VELOCITY_MULTIPLIER: 0.9, FLIP_MS: 320 }, // pulo duplo (ninja): um pouco mais baixo, com mortal
    // Sem corações: tomba para a esquerda e fica deitado, meio transparente
    DEATH: { FALL_MS: 450, ALPHA: 0.45, LYING_HEIGHT: 18, PULSE_MS: 900 }
  },

  // Água das lagoas (pântano): nada mais devagar e boia
  SWIM: {
    SURFACE_ELEVATION: 40,      // altura padrão da superfície das lagoas (como a elevação do chão)
    SPEED_MULTIPLIER: 0.4,      // nada BEM mais devagar do que anda
    BUOYANCY: 0.85,             // a água tira quase toda a gravidade...
    MAX_SINK_SPEED: 70,         // ...e afunda devagarzinho (cair na água freia na hora)
    SWIM_UP_SPEED: 70,          // segurando pular: nada para cima devagar
    ENTER_DEPTH: 8,             // pés este tanto abaixo da superfície = dentro da água
    SURFACE_JUMP_DEPTH: 34,     // perto da superfície, pular é o pulo normal (para sair da água)...
    SURFACE_JUMP_DELAY_MS: 500, // ...mas só depois de um tempinho na água (nada de "quicar" na superfície)
    COLOR: 0x35566a,            // cinza-azulado, como a água do fundo
    ALPHA: 0.38,                // dá para ver quem está nadando lá embaixo
    DEEP_ALPHA: 0.18,           // escurece mais perto do fundo
    SURFACE_COLOR: 0xa8d8d0,
    BUBBLE_MS: 420,             // bolhas subindo de quem está nadando
    DEPTH: 2.5                  // desenhada NA FRENTE dos jogadores (parecem dentro da água)
  },

  // Lama (pântano): anda devagar e o pulo fica mais baixo (gruda nos pés)
  MUD: {
    SPEED_MULTIPLIER: 0.5,
    JUMP_MULTIPLIER: 0.85,
    HEIGHT: 14,                 // faixa de lama por cima do chão
    TILE_SCALE: 0.2,
    BUBBLE_MS: 700              // bolhas estourando na lama
  },

  // Vitórias-régias: boiam na lagoa e AFUNDAM se alguém ficar em cima
  LILY_PAD: {
    TEXTURES: ['vitoria_regia', 'vitoria_regia_flor'], // uma sim, outra não com flor
    SCALE: 0.2,
    SINK_AFTER_MS: 1000,        // alguém pisou: balança este tempo e afunda
    SINK_DEPTH: 34,             // o quanto desce ao afundar
    SUNK_MS: 1800,              // fica no fundo e depois volta
    WOBBLE_DEG: 4,              // balança avisando que vai afundar
    BOB_PX: 1.5                 // boiando: sobe e desce de leve
  },

  // Modo 2 JOGADORES na mesma tela
  PARTY: {
    START_GAP: 40,              // o jogador 2 começa um pouco atrás do 1
    SCREEN_MARGIN: 24,          // ninguém passa disto da borda da tela (um espera o outro)
    FRIENDLY_FIRE: true,        // espada, flechas e especiais também acertam o parceiro
    FRIENDLY_REACH: 55,         // alcance da espada contra o parceiro
    COLORS: [0xffe066, 0x6fd8ff], // pontinho de cada jogador na barra de progresso
    // Doar coração: agachado em cima do parceiro caído (precisa ter pelo menos 2)
    REVIVE: { MIN_HEARTS: 2, HOLD_MS: 900, RANGE_X: 40, RANGE_Y: 50, HEART_SCALE: 0.09 }
  },

  // Escudinho do AGACHAR: segura UM golpe e quebra; depois precisa recarregar
  DUCK_SHIELD: {
    COOLDOWN_MS: 8000,          // depois de quebrar: 8s agachando sem escudo
    BLOCK_GRACE_MS: 900,        // o mesmo golpe (bicho encostado) não machuca logo em seguida
    SCALE: 0.45,                // ~16px na tela: bem pequenininho
    ALPHA: 0.5,                 // transparente
    ABOVE_HEAD: 4,              // distância acima da cabeça (px)
    POP_MS: 120,                // aparece crescendo rapidinho
    BREAK_MS: 300               // ao quebrar: cresce e some
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
    ARROW_DEPTH: 1.8,           // na frente dos bichos e chefões, atrás do jogador
    // Flecha cravada no chão/ilha/paredão vira uma plataforminha
    STUCK_EMBED: 7,             // quanto a ponta "entra" no terreno (px)
    STUCK_PLATFORM: { WIDTH: 24, HEIGHT: 6 },
    MAX_STUCK: 8                // limite de flechas cravadas (as mais antigas somem)
  },

  // Martelo do VIKING: arremessa girando e, ao cair, faz um TREMOR. Ele fica no
  // chão até o viking passar por cima; enquanto isso, o ataque vira SOQUINHO.
  HAMMER_ATTACK: {
    COOLDOWN_MS: 300,           // arremessar ou socar
    POSE_DURATION_MS: 200,
    TEXTURE: 'martelo',
    SCALE: 0.095,
    DEPTH: 1.8,                 // como as flechas: na frente dos bichos, atrás do jogador
    HAND: { X: 14, Y: -4 },     // de onde ele sai (a mão do viking)
    THROW_SPEED_X: 320,
    THROW_SPEED_Y: -300,        // sobe um pouquinho e cai uns 160px à frente (médio alcance)
    GRAVITY: 1300,              // gravidade própria (um pouco mais leve que a do mundo)
    SPIN_SPEED: 20,             // giro no ar (rad/s)
    BOUNCE_X: 0.3,              // bate na parede (ou na borda da arena) e volta um pouco
    HIT_DAMAGE: 25,             // acerta tudo no caminho (cada um uma vez por arremesso)
    TREE_BOUNCE: 0.35,          // bate na árvore e volta um pouco (cai do lado de cá)
    EMBED: 2,                   // cai de cabeça e afunda um tiquinho no chão
    QUAKE: {                    // ao cair: tremor em quem está no chão perto
      DAMAGE: 18,
      RADIUS_X: 90,
      RADIUS_Y: 50,
      SHAKE_MS: 200,
      SHAKE_INTENSITY: 0.01,
      DUST: 16,
      COLOR: 0xd8c8a8
    },
    PICKUP: { RANGE_X: 18, RANGE_Y: 28 }, // passou por cima: pega de volta
    RETURN: {                   // volta voando sozinho para a mão (nunca fica perdido)
      SPEED: 650,
      AFTER_MS: 10000,          // largado no chão há muito tempo
      DISTANCE: 900,            // ficou longe demais (ex.: renasceu no checkpoint)
      WATER_MS: 500,            // caiu numa lagoa
      CATCH_RANGE: 16
    },
    // Sem o martelo: soquinho, bem mais fraco e só de perto (mas dá dano!)
    PUNCH: { DAMAGE: 5, REACH_RATIO: 0.7, POW_X: 16, POW_Y: -2 }
  },

  // Katana do NINJA: golpe rápido, só na frente. FURTIVO: o primeiro golpe em
  // cada bicho (pego de surpresa) e os golpes escondido na fumaça valem o dobro
  KATANA_ATTACK: {
    DAMAGE: 10,
    SNEAK_MULTIPLIER: 2,
    COOLDOWN_MS: 220,           // bem mais rápida que a espada
    POSE_DURATION_MS: 140
  },

  // Florete do BARDO: estocada só na frente, um pouco mais longe que a espada
  RAPIER_ATTACK: {
    DAMAGE: 12,
    REACH_RATIO: 1.25,          // fração do alcance da espada contra o alvo
    COOLDOWN_MS: 330,
    POSE_DURATION_MS: 180
  },

  // Bicho ENCANTADO pelo bardo (CharmedAlly): segue o bardo e ataca os outros.
  // Quem é de chão continua no chão (anda e pula); quem voa, voa.
  ALLY: {
    DAMAGE: 4,                  // bem menos que os jogadores
    HIT_MS: 700,
    PLAYER_HIT_MS: 1800,        // no 1v1 bate também no rival, mais devagar (cada golpe tira um coração)
    HP_MULTIPLIER: 2,           // aguenta o dobro de golpes
    HURT: { CONTACT: 6, BOSS: 10, COOLDOWN_MS: 1000 }, // encostar em bicho/chefão machuca o aliado
    SPEED: 170,                 // voando
    WALK_SPEED: 125,            // andando (bichos de chão)
    JUMP_VELOCITY: -430,        // pula obstáculo, ou para alcançar o bardo e bicho voando baixo
    HOP: { VELOCITY: -240, EVERY_MS: 420 }, // sapos andam pulando
    SIGHT: 300,                 // ataca bichos (e o chefão) até esta distância do bardo
    LEASH: 420,                 // mais longe que isso do bardo: reaparece do lado dele
    FOLLOW: { X: 34, GAP: 28, Y: -30, BOB: 5 }, // atrás do bardo, um do lado do outro, dançando
    RECOIL: 180,                // depois de bater, recua um pouquinho
    TINT: 0xffd6f4,             // rosinha: encantado
    MARKER: { SCALE: 0.5, Y: 6, TINT: 0xffb8ec } // notinha em cima da cabeça
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
      FLYER_CLEARANCE: 60,      // quem voa fica pelo menos isto acima do morro mais alto por perto
      EDGE_MARGIN: 30,          // quem anda precisa de chão firme dos dois lados
      WAVE_AHEAD_X: 80,         // a onda surge um pouco além da borda da tela
      MAX_TRIES: 30
    }
  },

  BOSS: {
    DEPTH: 1,
    NEXT_BOSS_DELAY_MS: 900,    // luta em etapas: tempo até o próximo chefão aparecer
    // Ao apanhar o chefão fica meio transparente por um tempinho. É só visual:
    // NÃO dá imunidade (antes dava, e as flechas do especial contavam como uma só)
    HIT_BLINK_FRAMES: 30,
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

  // Abertura de fase (imagem do chefão + título no centro, some em fade)
  LEVEL_INTRO: {
    IMAGE_BOX: { WIDTH: 340, HEIGHT: 270 }, // a imagem é ampliada/reduzida até caber aqui
    IMAGE_OFFSET_Y: 30,
    TITLE_SIZE: 28,
    TITLE_MAX_WIDTH: 760,       // título comprido diminui para caber na tela
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
    TURN_MS: 170,               // paradinho antes de virar (vira de uma vez, sem o desenho de frente)
    CROUCH_MS: 380,             // agachado (aviso) antes de investir/pular
    ACTION_DELAY_MS: { MIN: 1100, MAX: 2100 }, // tempo andando entre um golpe e outro
    ANGRY_HP_RATIO: 0.5,        // abaixo disso ele ruge e fica bravo
    ANGRY_SPEED: 1.15,
    ANGRY_DELAY: 0.65,
    // Chance de cada golpe (ajustada pela distância/altura do jogador)
    ACTION_WEIGHTS: { DASH: 30, JUMP: 22, QUAKE: 24, SLAM: 12, THROW: 22 },
    DASH: { SPEED_MULTIPLIER: 2.9, DURATION_MS: 320, PAUSE_MS: 260, COUNT: 2, ANGRY_COUNT: 3, SKID_MS: 420 },
    JUMP: { VELOCITY_Y: -760, MAX_SPEED_X: 320, LAND_MS: 420 },
    SHADOW: { WIDTH: 120, HEIGHT: 14, ALPHA: 0.28, FADE_HEIGHT: 260 }, // sombra no chão (some quando ele pula alto)
    QUAKE: {
      REAR_MS: 640,             // levantando nas patas traseiras
      WAVE_AT_MS: 300,          // momento da pisada dentro da animação de impacto
      STOMP_MS: 680,
      SECOND_WAVE_MS: 480,      // bravo: segunda leva de ondas
      SHAKE_MS: 380,
      SHAKE_INTENSITY: 0.014,
      ICICLES: 2                // bravo: a pisada também derruba pinos de gelo (era 4)
    },
    // Pinos de gelo caindo do céu — SÓ quando bravo (abaixo de 50% da vida)
    ICICLES: {
      INTERVAL_MS: { MIN: 3000, MAX: 6000 },  // chuvas de pinos de tempos em tempos
      PER_RAIN: { MIN: 1, MAX: 2 },           // metade do que era (2 a 4)
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
    // Clipes da folha (tools/bear_sheet.py + tools/bear_polish.py): quadros/s,
    // repetição e, se quiser, SOURCE (animação de onde tirar os quadros) e FRAMES
    CLIPS: {
      parado:       { FPS: 7,  REPEAT: -1, FRAMES: [0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1] }, // respirando (vai e volta)
      andando:      { FPS: 7,  REPEAT: -1, FRAMES: [0, 1, 2, 3] },  // só os passos de quatro patas
      correndo:     { FPS: 14, REPEAT: -1 },
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

  // Colmeia (fase 5, 1ª etapa): parada em cima do desenho do cenário — veja hive_boss.js
  // (a posição na arena vem de assets/chefoes/colmeia/colmeia.json)
  HIVE: {
    HITBOX: { LEFT: 0.12, RIGHT: 0.88, TOP: 0.1, BOTTOM: 0.92 }, // parte que apanha (proporção da imagem)
    MELEE_REACH: 70,            // alcance da espada até a BORDA da colmeia
    FIRST_BEE_MS: 1500,         // a primeira vespa sai logo depois que a luta começa
    HIT_FLASH_MS: 70,
    HIT_SHAKE: { DURATION_MS: 100, INTENSITY: 0.004 },
    DEFEAT_MS: 1200,            // treme e escurece antes da rainha sair
    DEFEAT_TINT: 0x4a4a4a
  },

  // Filhote de águia no ninho (chefão da fase 6)
  EAGLET: {
    HITBOX: { LEFT: 0.1, RIGHT: 0.9, TOP: 0.05, BOTTOM: 0.85 }, // parte do desenho que apanha
    MELEE_REACH: 70,
    BOB: { HEIGHT: 8, MS: 650 }, // sobe e desce sem parar, estilo Cuphead
    LOOK_MS: 4000,              // vira o olhar (direita ↔ esquerda) a cada 4 s
    WORM: {                     // minhocas em arco para o lado em que está olhando
      FIRST_MS: 2000,
      EVERY_MS: { MIN: 1300, MAX: 2300 },
      SPEED: { MIN: 280, MAX: 430 },
      ANGLE_DEG: { MIN: 15, MAX: 50 },
      ANGRY_COUNT: 3,           // bravo: três de uma vez, em leque
      SPREAD_DEG: 14
    },
    CALL: {                     // chama a mamãe: olha para cima, a tela treme e vêm as águias
      FIRST_MS: 6000,
      EVERY_MS: 15000,
      POSE_MS: 1800,
      SHAKE: { MS: 1000, INTENSITY: 0.012 },
      EAGLES: 7,                // águias que chegam pelo alto, uma de cada vez...
      EAGLE_EVERY_MS: 600,
      MAX_EAGLES: 7,            // ...sem passar de 7 voando ao mesmo tempo
      EAGLE_Y: { MIN: 50, MAX: 110 },
      TWIGS: 3                  // gravetos que caem da árvore com o tremor
    },
    ANGRY_BELOW: 0.5,           // com menos da metade da vida fica bravo...
    ANGRY_BOB_SPEED: 1.7,       // ...e balança mais rápido
    HIT_FLASH_MS: 70,
    HIT_SHAKE: { DURATION_MS: 100, INTENSITY: 0.004 },
    DEFEAT_MS: 1400
  },

  // Gravetos que caem da árvore quando o filhote chama a mamãe
  TWIG_DROPS: {
    FIRST_MS: 0,
    INTERVAL_MS: { MIN: 0, MAX: 0 },  // só caem quando ele chama (não chovem sozinhos)
    PER_RAIN: { MIN: 3, MAX: 3 },
    STAGGER_MS: 180,
    WARNING_MS: 500,
    FALL_SPEED: 140,
    START_Y: 0,
    SCALE: 0.8
  },

  // Gotas de mel caindo do teto na fase 5 (colmeia e rainha), como o gelo do urso
  HONEY_DROPS: {
    FIRST_MS: 2500,
    INTERVAL_MS: { MIN: 3000, MAX: 6000 },
    PER_RAIN: { MIN: 1, MAX: 2 },
    STAGGER_MS: 220,
    WARNING_MS: 650,            // tremendo lá em cima antes de cair
    FALL_SPEED: 120,
    START_Y: 0,
    SCALE: 1.3
  },

  // Abelha Rainha (fase 5, 2ª etapa): voa como o dragão — veja queen_bee_boss.js
  QUEEN_BEE: {
    START_X: 416,               // sai pela boca da colmeia
    START_Y: 306,
    DISPLAY_HEIGHT: 150,        // altura na tela
    BODY_RATIO: { WIDTH: 0.6, HEIGHT: 0.55 }, // hitbox em relação ao quadro
    MELEE_REACH: 120,
    MOUTH: { X: 0.18, Y: 0.55 },// cabeça no quadro (proporção), olhando para a ESQUERDA
    ATTACK_POSE_MS: 260,
    HIT_FLASH_MS: 80,
    HIT_SHAKE: { DURATION_MS: 120, INTENSITY: 0.005 },
    DEATH_MS: 1200,
    // Clipes da folha (tools/bee_boss_sprites.py)
    CLIPS: {
      voando:   { FPS: 16, REPEAT: -1 },
      atacando: { FPS: 1,  REPEAT: 0 }
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
      bola_rosa:      { GLOW: 0xff4fc3, SPARKS: [0xffe0f5, 0xff9ad9, 0xff4fc3, 0xb02a8c] },
      espirro_mel:    { GLOW: null, SPARKS: [0xffd84a, 0xf2a40c, 0xd98a00] }, // mel não brilha
      minhoca:        { GLOW: null, SPARKS: [0x8a5a3c, 0x6b4423, 0xb07a52] }  // terrinha caindo
    },
    // Projéteis com arte diferente da bola de fogo (o resto usa os valores acima)
    ART: {
      espirro_mel: { SCALE: 0.45, CORE_ORIGIN: { X: 0.74, Y: 0.5 }, ART_DIRECTION_RAD: 0, BODY_SIZE: 30 },
      // minhoca do filhote de águia: sobe em arco, cai (GRAVITY) e se mexe no ar (WIGGLE)
      minhoca: { SCALE: 1, CORE_ORIGIN: { X: 0.5, Y: 0.5 }, ART_DIRECTION_RAD: 0, BODY_SIZE: 16, GRAVITY: 650, WIGGLE: true }
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
    SCALE: 0.05,                // ~17px na tela (proporcional ao personagem)
    ARENA_OFFSET_Y: -50,        // aparece acima da plataforma
    FLOAT_AMPLITUDE: 4,
    FLOAT_DURATION_MS: 900
  },

  // Moedas: cada bicho derrotado tem chance de deixar uma. O total fica
  // guardado no navegador (para comprar coisas no futuro).
  COIN: {
    TEXTURE: 'moeda',
    DROP_CHANCE_PERCENT: 30,
    SCALE: 0.36,                // imagem de 64px → ~23px na tela
    POP_VELOCITY: { X: 60, Y: -260 }, // pulinho ao sair do bicho
    BOUNCE: 0.35,
    DRAG_X: 260,                // para de deslizar no chão
    SPIN_MS: 700,               // "gira" achatando e voltando
    LIFETIME_MS: 15000,         // some sozinha depois de um tempo...
    BLINK_BEFORE_MS: 3000,      // ...piscando antes
    STORAGE_KEY: 'skySerpents.coins'
  },

  // Especial (tecla G): um por personagem, recarga de 25s (menos 2s por bicho)
  SPECIAL: {
    COOLDOWN_MS: 25000,
    KILL_REDUCTION_MS: 2000,    // cada bicho derrotado adianta a recarga em 2s
    ARROW_STORM: {              // arqueira: leque de flechas para a frente
      ARROWS: 6,                // flechas por onda
      WAVES: 2,
      WAVE_DELAY_MS: 160,
      FAN_DEG: 180              // de reto para cima até reto para baixo (nada para trás)
    },
    DASH: {                     // guerreiro: investida com dano contínuo
      DURATION_MS: 500,
      SPEED_MULTIPLIER: 1.5,
      TICK_MS: 100,             // um golpe a cada 0,1s durante a investida
      TICK_DAMAGE: 8,
      REACH: 60,
      GHOST_EVERY_MS: 50        // rastro de "fantasmas"
    },
    SMOKE_BOMB: {               // ninja: some na fumaça (invencível) e todo golpe vira furtivo
      DURATION_MS: 3000,
      ALPHA: 0.3,               // quase invisível
      TINT: 0x8a80a8,
      PUFF: 26,                 // fumaça ao sumir e ao aparecer
      WISP_EVERY_MS: 110        // fiapos de fumaça enquanto está escondido
    },
    CHARM_NOTE: {               // bardo: nota encantada que transforma bichos em aliados
      SPEED: 260,
      LIFETIME_MS: 1500,
      WAVE: { AMPLITUDE: 12, SPEED: 0.009 }, // sobe e desce dançando
      MAX_CHARMS: 2,            // encanta até 2 por nota...
      MAX_ALLIES: 2,            // ...e no máximo 2 aliados (o mais antigo vai embora)
      DAMAGE: 20,               // bicho que não dá para encantar (ex.: peixe, planta) leva dano
      BOSS_DAMAGE: 30,          // o chefão não se encanta: leva dano e a nota estoura
      TINT: 0xffd84a
    },
    THUNDER: {                  // viking: raios nos bichos da tela e o martelo volta para a mão
      BOLTS: 5,
      MAX_PER_TARGET: 3,        // sozinho na tela (ex.: o chefão), leva até 3 raios
      DAMAGE: 20,
      EVERY_MS: 130,            // um raio atrás do outro
      WARNING_MS: 650,          // aviso (brilho no alto e círculo no lugar) antes de cada raio: dá para desviar
      STRIKE_RADIUS: 34,        // o raio acerta quem estiver neste círculo quando cair
      POSE_MS: 450,
      FLASH_ALPHA: 0.35,
      SHAKE: { MS: 140, INTENSITY: 0.008 }
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

  // Menu principal: fundo de uma fase e os dois personagens grandes, um de cada lado
  TITLE: {
    BACKGROUND: 'bg_floresta_mel', // a selva dourada da Floresta do Mel (emenda sozinho)
    HERO_SCALE: 0.36,           // ~180px de altura
    HERO_X_MARGIN: 130,         // distância do personagem até a borda
    HERO_Y: 420,
    BOB_MS: 1400,               // balançando devagar
    ATTACK_POSE_MS: 260,
    ATTACK_EVERY_MS: { MIN: 2500, MAX: 4500 },
    BUTTONS_Y: 272,
    BUTTON_GAP: 54
  },

  // 1v1 (VersusScene): a arena inteira na tela, com a câmera afastada
  VERSUS: {
    ZOOM: 0.7,                  // mostra 1/0,7 da tela: os dois jogadores aparecem sempre
    RESULT_DELAY_MS: 1100,      // alguém caiu: um tempinho para ver antes do resultado
    POTION_DELAY_MS: { MIN: 8000, MAX: 14000 }, // poções aparecendo nas ilhas (se ligadas)
    MOB_RESPAWN_MS: { MIN: 2500, MAX: 5000 },   // bicho que morre: outro aparece depois disso
    MOB_SAFE_DISTANCE: 220,     // bicho novo não nasce perto de um jogador
    // Opções da tela do 1v1
    MOB_OPTIONS: [
      { LABEL: 'NENHUM', COUNT: 0 },
      { LABEL: 'POUCOS', COUNT: 2 },
      { LABEL: 'VÁRIOS', COUNT: 4 },
      { LABEL: 'MUITOS', COUNT: 6 }
    ]
  },

  // Tela de opções: uma caixinha de teclas para cada jogador
  OPTIONS: {
    PANEL: { WIDTH: 340, HEIGHT: 300, TOP: 118 },
    PANEL_X: [215, 585],
    ROW_GAP: 36
  },

  // Tela de escolha de fase: caixinhas numeradas (as que não existem ainda
  // aparecem como "em desenvolvimento")
  LEVEL_SELECT: {
    TOTAL_SLOTS: 30,
    COLUMNS: 6,
    BOX: { WIDTH: 90, HEIGHT: 64 },
    GAP: { X: 20, Y: 16 },
    START_Y: 150,
    NUMBER_Y: -7,               // número um pouco acima do meio...
    STARS_Y: 18,                // ...e as estrelas embaixo dele
    STAR_RADIUS: 5
  },

  // Estrelas pelo tempo da fase (as metas ficam em cada fase: STAR_TIMES)
  STARS: {
    STORAGE_KEY: 'skySerpents.progress', // fases concluídas, melhor tempo e estrelas
    COLOR: 0xffd93b,
    OUTLINE: 0x7a4a00,
    RADIUS: 6
  },

  HUD: {
    HEARTS: { TEXTURE: 'heart', SPACING: 40, SCALE: 0.09 },
    // HUD de cada jogador: o 1 no canto esquerdo, o 2 no direito (embaixo das moedas)
    PLAYERS: [
      { HEARTS_X: 30, Y: 30, SIDE: 'LEFT' },
      { HEARTS_X: 770, Y: 86, SIDE: 'RIGHT' }
    ],
    // Caixinhas de recarga embaixo dos corações (especial e escudinho)
    COOLDOWN: { SIZE: 30, ROW_GAP: 38 },
    BOSS_BAR: {
      X: 250, Y: 20, WIDTH: 400, HEIGHT: 20,
      COLOR: 0xff0000, BACK_COLOR: 0x000000, BACK_ALPHA: 0.35,
      LABEL_Y: 50
    },
    // Moedas no canto superior direito (no jogo e no menu)
    COINS: { RIGHT_X: 780, Y: 30, ICON_SCALE: 0.42, GAP: 8, TEXT_SIZE: 14 },
    // Progresso da fase no topo (no lugar onde aparece a barra do chefão)
    PROGRESS: { X: 250, Y: 28, WIDTH: 400, HEIGHT: 14, ALPHA: 0.35, DOT_RADIUS: 7, FLAG_HEIGHT: 26 },
    // Relógio da fase embaixo da bandeirinha (as moedas crescem para a esquerda e não chegam nele)
    CLOCK: { X: 650, Y: 52, SIZE: 8 },
    BANNER_DURATION_MS: 2200,
    // Perdeu um coração: as bordas da tela piscam em vermelho (HurtFlash)
    HURT_FLASH: { PEAK_ALPHA: 0.55, IN_MS: 70, OUT_MS: 420 },
    // Botõezinhos de música e de todos os sons, no canto de baixo à direita (SoundToggles)
    SOUND_TOGGLES: { X: 778, Y: 580, GAP: 30, SIZE: 24 },
    DEPTH: 10
  },

  // Tela de CARREGAMENTO: um fundo e um bicho sorteados a cada vez que o jogo
  // abre; o bicho anda (ou voa) em cima da barrinha, acompanhando a ponta dela
  LOADING: {
    BAR: { WIDTH: 420, HEIGHT: 16, Y: 420 },
    SHADE_ALPHA: 0.4,           // escurece o fundo para a barra aparecer
    MIN_MS: 1200,               // fica pelo menos este tempo na tela (dá para ver o bicho)
    CREATURE_SPEED: 260,        // px/s correndo atrás da ponta da barra
    BACKGROUNDS: ['bg', 'bg_floresta_mel', 'bg_floresta', 'bg_caverna', 'bg_pantano', 'bg_neve', 'bg_por_do_sol', 'bg_tempestade'],
    // FRAMES = quadros (a arte olha para a esquerda) | SHEET + CLIP = folha de animação
    // FLY = voa acima da barra | HOP = vai pulando | HEIGHT = altura na tela (px)
    CREATURES: [
      { FRAMES: ['morcego_0', 'morcego_1'], FPS: 8, FLY: true, HEIGHT: 40 },
      { FRAMES: ['morcego_vampiro_0', 'morcego_vampiro_1'], FPS: 9, FLY: true, HEIGHT: 40 },
      { FRAMES: ['morcego_gigante_0', 'morcego_gigante_1'], FPS: 5, FLY: true, HEIGHT: 64 },
      { FRAMES: ['fantasma_0', 'fantasma_1'], FPS: 3, FLY: true, HEIGHT: 44 },
      { FRAMES: ['vespa_0', 'vespa_1'], FPS: 14, FLY: true, HEIGHT: 36 },
      { FRAMES: ['aguia_0', 'aguia_1'], FPS: 6, FLY: true, HEIGHT: 50 },
      { FRAMES: ['libelula_0', 'libelula_1'], FPS: 16, FLY: true, HEIGHT: 28 },
      { FRAMES: ['traca_0', 'traca_1'], FPS: 12, FLY: true, HEIGHT: 30 },
      { FRAMES: ['slime_0', 'slime_1'], FPS: 4, HEIGHT: 34 },
      { FRAMES: ['sapo_0', 'sapo_1'], HOP: true, HEIGHT: 34 },
      { FRAMES: ['sapo_lingua_0', 'sapo_lingua_1'], HOP: true, HEIGHT: 34 },
      { FRAMES: ['sapo_boi_0', 'sapo_boi_1'], HOP: true, HEIGHT: 50 },
      { FRAMES: ['jacare_0', 'jacare_1'], FPS: 4, HEIGHT: 36 },
      { FRAMES: ['tartaruga_0', 'tartaruga_1'], FPS: 4, HEIGHT: 36 },
      { FRAMES: ['ourico_0', 'ourico_1'], FPS: 5, HEIGHT: 34 },
      { FRAMES: ['centopeia_0', 'centopeia_1'], FPS: 10, HEIGHT: 26 },
      { FRAMES: ['aranha_0', 'aranha_1'], FPS: 8, HEIGHT: 30 },
      { FRAMES: ['garca_0', 'garca_1'], FPS: 2, HEIGHT: 64 },
      { FRAMES: ['piranha_0', 'piranha_1'], HOP: true, HEIGHT: 30 },
      { FRAMES: ['poraque_0', 'poraque_1'], FPS: 4, HEIGHT: 20 },
      { SHEET: 'bear', CLIP: 'bear:andando', FACES_RIGHT: true, HEIGHT: 120 },
      { SHEET: 'dragon_red', CLIP: 'dragon_red:voando', FLY: true, HEIGHT: 130 },
      { SHEET: 'dragon_pink', CLIP: 'dragon_pink:voando', FLY: true, HEIGHT: 130 },
      { SHEET: 'queen_bee', CLIP: 'queen_bee:voando', FLY: true, HEIGHT: 110 }
    ]
  },

  // Tutorial (fase 1): dicas com as teclas e o cartão de cada bicho novo
  TUTORIAL: {
    HINT_Y: 150,                // dica no alto da tela (abaixo do HUD)
    HINT_MS: 7000,              // some sozinha depois deste tempo (ou quando vem a próxima)
    MOB_VISIBLE_MARGIN: 40,     // o bicho já entrou na tela este tanto: hora do cartão
    MOB_PICTURE_HEIGHT: 64,     // desenho do bicho no cartão
    MOB_CARD_MS: 2800,          // pausinha com o cartão...
    MOB_SKIP_AFTER_MS: 600      // ...que dá para fechar com qualquer tecla depois disto
  },

  // Tela de pausa / confirmação (ESC, R, P ou janela sem foco)
  PAUSE: {
    SHADE_ALPHA: 0.55,
    PANEL: { WIDTH: 540, HEIGHT: 280 },
    TITLE_SIZE: 18,
    OPTION_SIZE: 14,
    OPTION_GAP: 40
  },

  // Controles de toque (celular): analógico onde o dedo encostar + botões
  TOUCH: {
    JOYSTICK_AREA_RATIO: 0.55,  // o analógico aparece na parte esquerda da tela
    JOYSTICK_RADIUS: 60,
    THUMB_RADIUS: 26,
    DEAD_ZONE: 0.3,             // empurrão mínimo para andar
    JUMP_ZONE: 0.55,            // para cima além disso = pular
    DUCK_ZONE: 0.65,            // para baixo além disso = agachar
    ALPHA: 0.45,
    BUTTONS: {
      ATTACK:  { X: 715, Y: 500, RADIUS: 46, LABEL: 'ESPAÇO', SIZE: 9 },
      SPECIAL: { X: 610, Y: 540, RADIUS: 32, LABEL: 'G', SIZE: 14 },
      PAUSE:   { X: 772, Y: 72, RADIUS: 18, LABEL: 'II', SIZE: 10 }
    }
  }
});
