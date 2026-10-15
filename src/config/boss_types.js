/**
 * boss_types.js
 * -----------------------------------------------------------------------------
 * Chefões do final de cada fase. KIND define a classe do chefão
 * (DragonBoss, SerpentBoss ou PolarBearBoss) e ATTACK_STYLE o seu PODER ESPECIAL
 * (subclasse de BossAttack — veja boss_factory.js).
 *
 * Valores aqui são os da dificuldade NORMAL; difficulties.js aplica os
 * multiplicadores através do MatchConfig.
 * -----------------------------------------------------------------------------
 */
const BossKind = Object.freeze({
  DRAGON: 'DRAGON',
  SERPENT: 'SERPENT',
  BEAR: 'BEAR'
});

const BossTypeId = Object.freeze({
  FIRE_DRAGON: 'FIRE_DRAGON',
  ICE_SERPENT: 'ICE_SERPENT',
  MYSTIC_DRAGON: 'MYSTIC_DRAGON',
  POLAR_BEAR: 'POLAR_BEAR'
});

/** Efeitos que um projétil/contato pode causar no jogador além do dano. */
const ProjectileEffect = Object.freeze({
  NONE: 'NONE',
  SLOW: 'SLOW',
  FREEZE: 'FREEZE'   // congela por alguns segundos e NÃO tira coração
});

const BOSS_TYPES = deepFreeze({
  // Dragão do protótipo original
  [BossTypeId.FIRE_DRAGON]: {
    ID: BossTypeId.FIRE_DRAGON,
    KIND: BossKind.DRAGON,
    NAME: 'Dragão Vermelho',
    POWER: 'Chuva de fogo',
    ATTACK_STYLE: 'RADIAL_BURST',
    SPRITE_SHEET: 'dragon_red',      // folha de animação (dragon_sprite_sheets.js)
    MAX_HP: 625,       // x0.8 na fase 1 = 500 de vida
    SPEED: 200,
    SHOT: {
      CHANCE_PERCENT: 3,        // chance por frame
      SPEED: 250,
      TEXTURE: 'bola_fogo',
      AIMED: true,              // sopra fogo na direção do jogador...
      AIM_SPREAD_DEG: 35,       // ...com uma boa imprecisão
      EFFECT: ProjectileEffect.NONE
    },
    SPECIAL: {
      HP_RATIO_THRESHOLD: 0.75, // só usa o especial abaixo de 75% de vida
      CHANCE_PERCENT: 20,
      INTERVAL_MS: 5000,
      PROJECTILES: 12,
      SPEED: 200,
      TEXTURE: 'bola_fogo_azul',
      EFFECT: ProjectileEffect.NONE
    }
  },

  // Dragão-serpente de gelo: corpo comprido que persegue e dá investidas
  [BossTypeId.ICE_SERPENT]: {
    ID: BossTypeId.ICE_SERPENT,
    KIND: BossKind.SERPENT,
    NAME: 'Serpente Glacial',
    POWER: 'Gelo e investida',
    ATTACK_STYLE: 'DOUBLE_RING',
    MAX_HP: 1000,
    SPEED: 170,
    SCALE: 0.17,
    SEGMENTS: 14,
    SEGMENT_SPACING: 22,        // distância (px) entre partes do corpo
    CONTACT_DAMAGE: true,
    CHARGE: {
      INTERVAL_MS: 6500,        // de quanto em quanto tempo dá a investida
      TELEGRAPH_MS: 700,        // aviso (pisca) antes de avançar
      SPEED: 430,
      DURATION_MS: 900
    },
    SHOT: {
      CHANCE_PERCENT: 2,
      SPEED: 230,
      TEXTURE: 'bola_gelo',
      AIMED: true,
      AIM_SPREAD_DEG: 15,
      EFFECT: ProjectileEffect.SLOW
    },
    SPECIAL: {
      HP_RATIO_THRESHOLD: 0.85,
      CHANCE_PERCENT: 30,
      INTERVAL_MS: 4500,
      PROJECTILES: 10,
      SPEED: 180,
      TEXTURE: 'bola_gelo',
      EFFECT: ProjectileEffect.SLOW,
      SECOND_RING_DELAY_MS: 350 // segundo anel, defasado
    }
  },

  // Dragão rosa: tiros mirados e espiral mágica
  [BossTypeId.MYSTIC_DRAGON]: {
    ID: BossTypeId.MYSTIC_DRAGON,
    KIND: BossKind.DRAGON,
    NAME: 'Dragão Rosa Místico',
    POWER: 'Espiral mágica',
    ATTACK_STYLE: 'SPIRAL',
    SPRITE_SHEET: 'dragon_pink',
    MAX_HP: 1200,
    SPEED: 230,
    SHOT: {
      CHANCE_PERCENT: 3,
      SPEED: 260,
      TEXTURE: 'bola_rosa',
      AIMED: true,
      AIM_SPREAD_DEG: 25,
      EFFECT: ProjectileEffect.NONE
    },
    SPECIAL: {
      HP_RATIO_THRESHOLD: 1,    // usa o especial desde o começo
      CHANCE_PERCENT: 35,
      INTERVAL_MS: 4000,
      PROJECTILES: 24,
      SPEED: 190,
      TEXTURE: 'bola_rosa',
      EFFECT: ProjectileEffect.NONE,
      SPIRAL_STEP_MS: 60,       // tempo entre cada bola da espiral
      SPIRAL_TURNS: 2           // voltas completas da espiral
    }
  },

  // Urso polar: luta no chão (investidas, pulos, terremoto) e bolas de gelo
  // que congelam. Só machuca no contato físico (corpo e ondas do terremoto).
  [BossTypeId.POLAR_BEAR]: {
    ID: BossTypeId.POLAR_BEAR,
    KIND: BossKind.BEAR,
    NAME: 'Urso Polar',
    POWER: 'Gelo e terremoto',
    ATTACK_STYLE: 'ICE_BALLS',
    MAX_HP: 550,
    SPEED: 110,
    SCALE: 1.45,
    CONTACT_DAMAGE: true,
    SHOT: {                     // os arremessos são decididos pelo BearBrain
      CHANCE_PERCENT: 0,
      SPEED: 260,
      TEXTURE: 'bola_gelo',
      AIMED: true,
      AIM_SPREAD_DEG: 0,
      EFFECT: ProjectileEffect.FREEZE
    },
    SPECIAL: {
      HP_RATIO_THRESHOLD: 1,
      CHANCE_PERCENT: 0,
      INTERVAL_MS: 0,
      PROJECTILES: 3,
      SPREAD_DEG: 16,           // abertura do leque de bolas
      SPEED: 270,
      TEXTURE: 'bola_gelo',
      EFFECT: ProjectileEffect.FREEZE
    }
  }
});
