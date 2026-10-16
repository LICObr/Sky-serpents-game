/**
 * game_events.js
 * -----------------------------------------------------------------------------
 * Nomes dos eventos trocados entre as classes através do "event bus" da cena.
 *
 * Usar eventos evita que as classes dependam diretamente umas das outras:
 * por exemplo, PlayerHealth apenas avisa "os corações mudaram" e quem quiser
 * (o HUD) escuta, sem que a vida do jogador precise conhecer a interface.
 * -----------------------------------------------------------------------------
 */
const GameEvents = Object.freeze({
  PLAYER_HEARTS_CHANGED: 'player:hearts-changed', // (hearts, maxHearts)
  PLAYER_DIED:           'player:died',
  ENEMY_DEFEATED:        'enemy:defeated',        // (enemy)
  BOSS_FIGHT_STARTED:    'boss:fight-started',    // (boss)
  BOSS_HP_CHANGED:       'boss:hp-changed',       // (currentHp, maxHp)
  BOSS_DEFEATED:         'boss:defeated',
  BOSS_SUMMON:           'boss:summon'           // (spawn, onSpawned) chefão chama bichos
});
