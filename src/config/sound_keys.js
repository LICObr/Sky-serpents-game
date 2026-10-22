/**
 * sound_keys.js
 * -----------------------------------------------------------------------------
 * Os EFEITOS SONOROS do jogo (gravados + sintetizados em camadas, gerados por
 * tools/sound_effects.py em assets/sons/). O asset_manifest carrega todos e o
 * código toca com SoundFx.play(scene, SoundKeys.JUMP).
 * -----------------------------------------------------------------------------
 */
const SoundKeys = Object.freeze({
  // jogadores
  JUMP: 'pulo',
  AIR_JUMP: 'pulo_duplo',
  PLAYER_HURT: 'dano_jogador',
  PLAYER_DOWN: 'jogador_caiu',
  SHIELD: 'escudo',
  STOMP: 'pisar',
  REVIVE: 'reviver',
  GRUNT_MALE_1: 'gemido_homem_1',     // perdeu um coração: gemido de dor (voz de homem)...
  GRUNT_MALE_2: 'gemido_homem_2',
  GRUNT_MALE_3: 'gemido_homem_3',
  GRUNT_FEMALE_1: 'gemido_mulher_1',  // ...ou de mulher (a arqueira)
  GRUNT_FEMALE_2: 'gemido_mulher_2',
  GRUNT_FEMALE_3: 'gemido_mulher_3',
  // ataques e especiais
  SWORD: 'espada',
  BOW: 'flecha',
  HAMMER: 'martelo',
  QUAKE: 'tremor',
  PUNCH: 'soco',
  KATANA: 'katana',
  SMOKE: 'fumaca',
  RAPIER: 'florete',
  LUTE: 'alaude',
  CHARM: 'encanto',
  THUNDER: 'trovao',
  DASH: 'investida',
  ARROW_STORM: 'chuva_de_flechas',
  // bichos, chefões e cenário
  HIT: 'acerto',
  ENEMY_DEFEATED: 'bicho_derrotado',
  BOSS_HIT: 'chefe_acerto',
  BOSS_DEFEATED: 'chefe_derrotado',
  WOOD: 'madeira',
  SPLASH: 'agua',
  FIRE: 'fogo',
  // itens, fim de fase e menus
  COIN: 'moeda',
  POTION: 'pocao',
  VICTORY: 'vitoria',
  GAME_OVER: 'game_over',
  MENU_MOVE: 'menu_mover',
  MENU_OK: 'menu_ok'
});

/** Gemidos de dor de cada voz (um sorteado a cada coração perdido). */
const VoiceGrunts = Object.freeze({
  MALE: [SoundKeys.GRUNT_MALE_1, SoundKeys.GRUNT_MALE_2, SoundKeys.GRUNT_MALE_3],
  FEMALE: [SoundKeys.GRUNT_FEMALE_1, SoundKeys.GRUNT_FEMALE_2, SoundKeys.GRUNT_FEMALE_3]
});
