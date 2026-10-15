/**
 * player_special.js
 * -----------------------------------------------------------------------------
 * Classe base ABSTRATA do ESPECIAL do jogador (tecla G).
 * Cuida do que é igual para todos os especiais:
 *   - ler a tecla e respeitar a RECARGA (25s, adiantada a cada bicho morto);
 *   - saber se o especial está acontecendo agora (isActive);
 *   - informar ao HUD quanto falta para recarregar.
 *
 * Cada personagem tem o seu (definido pela subclasse de Player):
 *   ArrowStormSpecial (arqueira) | DashSpecial (guerreiro)
 * -----------------------------------------------------------------------------
 */
class PlayerSpecial {
  #player;
  #input;
  #readyAt = 0;      // momento em que fica pronto de novo
  #activeUntil = 0;  // enquanto o especial acontece

  /**
   * @param {Player} player dono do especial
   * @param {InputController} input
   */
  constructor(player, input) {
    if (new.target === PlayerSpecial) {
      throw new TypeError('PlayerSpecial é abstrata: use ArrowStormSpecial ou DashSpecial.');
    }
    this.#player = player;
    this.#input = input;
  }

  get player() { return this.#player; }

  /** Nome mostrado no HUD. Subclasses DEVEM sobrescrever. */
  get name() { return 'Especial'; }

  /** Quanto tempo o especial dura (ms). 0 = instantâneo. */
  get durationMs() { return 0; }

  /** Está acontecendo agora? */
  get isActive() {
    return this.#player.scene.time.now < this.#activeUntil;
  }

  /** O especial controla o movimento enquanto acontece? (ex.: investida) */
  get controlsMovement() {
    return false;
  }

  /** Milissegundos que faltam para recarregar (0 = pronto). */
  get remainingMs() {
    return Math.max(0, this.#readyAt - this.#player.scene.time.now);
  }

  get isReady() {
    return this.remainingMs === 0;
  }

  /** Adianta a recarga (ex.: ao derrotar um bicho). */
  reduceCooldown(ms) {
    this.#readyAt = Math.max(0, this.#readyAt - ms);
  }

  /**
   * Verifica a tecla e atualiza o especial em andamento (chamar a cada frame).
   * @param {CombatRegistry} combat alvos disponíveis
   */
  update(combat) {
    const now = this.#player.scene.time.now;
    if (this.#input.isSpecialJustPressed() && this.isReady && !this.#player.isDucking) {
      this.#readyAt = now + GameSettings.SPECIAL.COOLDOWN_MS;
      this.#activeUntil = now + this.durationMs;
      this.start(combat);
    }
    if (this.isActive) this.whileActive(combat, now);
  }

  /** Começa o especial. Subclasses DEVEM sobrescrever. */
  // eslint-disable-next-line no-unused-vars
  start(combat) {
    throw new Error(`${this.constructor.name} precisa implementar start().`);
  }

  /** Executado a cada frame enquanto o especial dura (opcional). */
  // eslint-disable-next-line no-unused-vars
  whileActive(combat, now) {}
}
