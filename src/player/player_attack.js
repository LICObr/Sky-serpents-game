/**
 * player_attack.js
 * -----------------------------------------------------------------------------
 * Classe base ABSTRATA dos ataques do jogador (padrão "Template Method"):
 * a base cuida do que é igual para todos (ler a tecla, respeitar o
 * intervalo entre ataques, mostrar a pose de ataque) e as subclasses
 * implementam apenas o golpe em si (perform):
 *   - SwordAttack → golpe corpo a corpo
 *   - BowAttack   → dispara flechas
 * -----------------------------------------------------------------------------
 */
class PlayerAttack {
  #player;
  #input;
  #cooldownMs;
  #poseDurationMs;
  #nextAttackTime = 0;

  /**
   * @param {Player} player dono deste componente
   * @param {InputController} input
   * @param {{cooldownMs?: number, poseDurationMs: number}} options
   */
  constructor(player, input, { cooldownMs = 0, poseDurationMs }) {
    if (new.target === PlayerAttack) {
      throw new TypeError('PlayerAttack é abstrata: use SwordAttack ou BowAttack.');
    }
    this.#player = player;
    this.#input = input;
    this.#cooldownMs = cooldownMs;
    this.#poseDurationMs = poseDurationMs;
  }

  get player() { return this.#player; }

  /**
   * Verifica se o jogador atacou neste frame.
   * @param {CombatRegistry} combat alvos disponíveis
   */
  update(combat) {
    if (!this.#input.isAttackJustPressed()) return;

    const now = this.#player.scene.time.now;
    if (now < this.#nextAttackTime) return;
    this.#nextAttackTime = now + this.#cooldownMs;

    this.#playAttackPose();
    this.perform(combat);
  }

  /** O golpe em si. Subclasses DEVEM sobrescrever. */
  // eslint-disable-next-line no-unused-vars
  perform(combat) {
    throw new Error(`${this.constructor.name} precisa implementar perform().`);
  }

  /**
   * Liga as colisões próprias do ataque (ex.: flechas x alvos/terreno). Opcional.
   * @param {CombatRegistry} combat
   * @param {LevelMap} levelMap
   */
  // eslint-disable-next-line no-unused-vars
  bindCollisions(combat, levelMap) {}

  /** Plataformas criadas pelo ataque (ex.: flechas cravadas) ou null. */
  get platforms() {
    return null;
  }

  /** Atualização por frame (ex.: reciclar flechas). Opcional. */
  updateProjectiles() {}

  /** Exibe a pose de ataque e volta à pose normal após um curto período. */
  #playAttackPose() {
    const player = this.#player;
    player.showPose(PlayerPose.ATTACK);

    player.scene.time.delayedCall(this.#poseDurationMs, () => {
      if (player.isAlive && !player.isDucking) player.showPose(PlayerPose.STAND);
    });
  }
}
