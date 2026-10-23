/**
 * drone_attack.js
 * -----------------------------------------------------------------------------
 * Ataque do OPERADOR DE DRONES: lança um drone que sobe em arco, faz a
 * parábola e cai um pouco mais longe que uma flecha, explodindo numa área
 * pequena ao encostar em alguém ou no chão (veja DroneSwarm).
 * -----------------------------------------------------------------------------
 */
class DroneAttack extends PlayerAttack {
  #swarm;

  /**
   * @param {Player} player
   * @param {InputController} input
   */
  constructor(player, input) {
    const cfg = GameSettings.DRONE_ATTACK;
    super(player, input, { cooldownMs: cfg.COOLDOWN_MS, poseDurationMs: cfg.POSE_DURATION_MS });
    this.#swarm = new DroneSwarm(player);
  }

  /** Os drones (o especial pilota um deles). */
  get swarm() {
    return this.#swarm;
  }

  /** @override */
  perform() {
    this.#swarm.launch(this.player.facingRight ? 1 : -1);
  }

  /** @override Drone x alvos e drone x terreno. */
  bindCollisions(combat, levelMap) {
    this.#swarm.bind(combat, levelMap);
  }

  /** @override */
  updateProjectiles() {
    this.#swarm.update();
  }
}
