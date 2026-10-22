/**
 * sound_keys.js
 * -----------------------------------------------------------------------------
 * Os EFEITOS SONOROS do jogo (estilo 16-bit, gerados por
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
