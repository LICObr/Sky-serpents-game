/**
 * soldier_player.js
 * -----------------------------------------------------------------------------
 * Operador de Drones: lança drones explosivos em arco (alcance um pouco maior
 * que a flecha, explosão pequena) e, no especial, pilota um drone kamikaze
 * por 4 segundos até ele cair com uma explosão grande.
 * -----------------------------------------------------------------------------
 */
class SoldierPlayer extends Player {
  /** @override */
  createAttack(input) {
    return new DroneAttack(this, input);
  }

  /** @override Drone pilotado (usa os mesmos drones do ataque). */
  createSpecial(input, droneAttack) {
    return new DroneControlSpecial(this, input, droneAttack.swarm);
  }
}
