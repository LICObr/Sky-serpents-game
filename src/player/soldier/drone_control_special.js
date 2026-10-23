/**
 * drone_control_special.js
 * -----------------------------------------------------------------------------
 * Especial do OPERADOR DE DRONES — "Drone Kamikaze": solta um drone (o mesmo
 * modelo, um pouco maior) e o jogador PILOTA ele com as setas (pular = sobe,
 * agachar = desce) por 4 segundos. Enquanto pilota, o operador fica parado.
 * Quando o tempo acaba — ou ao apertar o ATAQUE — o drone mergulha e cai com
 * uma explosão GRANDE. Uma mira vermelha no chão mostra onde ele vai cair.
 * -----------------------------------------------------------------------------
 */
class DroneControlSpecial extends PlayerSpecial {
  #input;
  #swarm;

  /**
   * @param {Player} player
   * @param {InputController} input
   * @param {DroneSwarm} swarm drones do ataque do operador
   */
  constructor(player, input, swarm) {
    super(player, input);
    this.#input = input;
    this.#swarm = swarm;
  }

  /** @override */
  get name() { return 'Drone Kamikaze'; }

  /** @override */
  get durationMs() { return GameSettings.SPECIAL.DRONE_CONTROL.CONTROL_MS; }

  /** @override Pilotando: o operador fica parado. */
  get controlsMovement() { return true; }

  /** @override */
  start() {
    this.player.showPose(PlayerPose.ATTACK);
    this.#swarm.launchControlled();
  }

  /**
   * @override Setas pilotam; o ataque solta antes da hora. (Quando o tempo
   * acaba, o próprio drone mergulha — veja DroneSwarm.update.)
   */
  whileActive() {
    const player = this.player;
    player.sprite.setVelocityX(0);
    if (!this.#swarm.controlled) {           // já explodiu (encostou em alguém)
      this.#release();
      return;
    }
    const input = this.#input;
    if (input.isAttackJustPressed()) {
      this.#swarm.dive();
      this.#release();
      return;
    }
    const dx = (input.isRightHeld() ? 1 : 0) - (input.isLeftHeld() ? 1 : 0);
    const dy = (input.isDuckHeld() ? 1 : 0) - (input.isJumpHeld() ? 1 : 0);
    this.#swarm.steer(dx, dy);
  }

  /** Devolve o controle ao operador. */
  #release() {
    if (this.player.isAlive) this.player.showPose(PlayerPose.STAND);
    this.endNow();
  }
}
