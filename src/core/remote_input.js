/**
 * remote_input.js
 * -----------------------------------------------------------------------------
 * Os controles do jogador que está no OUTRO computador (modo online): o que
 * ele aperta chega pela rede (OnlineSession) e funciona igualzinho aos botões
 * de toque do celular — a mesma cara para o InputController (left, right, up,
 * down, consumeAttack, consumeSpecial).
 * -----------------------------------------------------------------------------
 */
class RemoteInput {
  #held = new Set();      // ações apertadas agora (ControlAction)
  #attackPresses = 0;     // apertadas de ataque ainda não usadas
  #specialPresses = 0;

  get left()  { return this.#held.has(ControlAction.LEFT); }
  get right() { return this.#held.has(ControlAction.RIGHT); }
  get up()    { return this.#held.has(ControlAction.JUMP); }
  get down()  { return this.#held.has(ControlAction.DUCK); }

  /**
   * Chegou o que o outro jogador está apertando agora.
   * @param {string[]} held ações (ControlAction)
   */
  receive(held) {
    const next = new Set(held);
    // apertou agora (não estava apertado antes): vale um golpe / um especial
    if (next.has(ControlAction.ATTACK) && !this.#held.has(ControlAction.ATTACK)) this.#attackPresses = Math.min(2, this.#attackPresses + 1);
    if (next.has(ControlAction.SPECIAL) && !this.#held.has(ControlAction.SPECIAL)) this.#specialPresses = 1;
    this.#held = next;
  }

  /** true uma vez por apertada de ataque. */
  consumeAttack() {
    if (this.#attackPresses === 0) return false;
    this.#attackPresses--;
    return true;
  }

  /** true uma vez por apertada do especial. */
  consumeSpecial() {
    if (this.#specialPresses === 0) return false;
    this.#specialPresses = 0;
    return true;
  }

  /** Solta tudo (ex.: o outro jogador saiu). */
  reset() {
    this.#held.clear();
    this.#attackPresses = 0;
    this.#specialPresses = 0;
  }
}
