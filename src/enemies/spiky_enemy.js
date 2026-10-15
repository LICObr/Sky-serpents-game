/**
 * spiky_enemy.js
 * -----------------------------------------------------------------------------
 * Ouriço espinhoso: anda igual ao slime (herda de WalkerEnemy), mas os
 * espinhos não deixam pisar nele — quem pula em cima se machuca e quica.
 * Para derrotá-lo é preciso atacar (espada ou flecha).
 * -----------------------------------------------------------------------------
 */
class SpikyEnemy extends WalkerEnemy {
  /** @override Espinhos: pisar em cima machuca. */
  get stompable() {
    return false;
  }
}
