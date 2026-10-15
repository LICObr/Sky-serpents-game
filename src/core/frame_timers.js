/**
 * frame_timers.js
 * -----------------------------------------------------------------------------
 * Pequenos utilitários de tempo baseados em FRAMES (chamadas de update).
 * O jogo original contava frames com variáveis soltas (dragonTimer,
 * dragonHitCooldown, blinkCooldown...). Aqui essa lógica fica encapsulada
 * e reutilizável.
 * -----------------------------------------------------------------------------
 */

/**
 * Cooldown: fica "indisponível" por N frames após ser iniciado.
 * Ex.: invulnerabilidade do jogador, intervalo entre golpes no dragão.
 */
class FrameCooldown {
  #remainingFrames = 0;

  /** Inicia (ou reinicia) o cooldown. */
  start(frames) {
    this.#remainingFrames = frames;
  }

  /** Avança um frame. Deve ser chamado uma vez por update. */
  tick() {
    if (this.#remainingFrames > 0) this.#remainingFrames--;
  }

  /** true quando o cooldown já terminou. */
  get isReady() {
    return this.#remainingFrames <= 0;
  }
}

/**
 * Timer periódico: dispara (retorna true) sempre que o intervalo é
 * ultrapassado e reinicia sozinho. Ex.: troca de direção do dragão.
 */
class FrameTimer {
  #elapsedFrames = 0;
  #intervalFrames;

  /** @param {number} intervalFrames dispara quando o contador passar deste valor */
  constructor(intervalFrames) {
    this.#intervalFrames = intervalFrames;
  }

  /**
   * Avança um frame.
   * @returns {boolean} true no frame em que o timer dispara
   */
  tick() {
    this.#elapsedFrames++;
    if (this.#elapsedFrames > this.#intervalFrames) {
      this.#elapsedFrames = 0;
      return true;
    }
    return false;
  }
}

/**
 * Funções de sorteio usadas pelo jogo, centralizadas para facilitar testes
 * e balanceamento.
 */
class RandomUtils {
  constructor() {
    throw new TypeError('RandomUtils é estático e não deve ser instanciado.');
  }

  /** @returns {boolean} true com a probabilidade informada (0 a 100). */
  static chance(percent) {
    return Phaser.Math.Between(1, 100) <= percent;
  }

  /** @returns {number} ângulo aleatório em radianos (0 a 360 graus). */
  static angleRad() {
    return Phaser.Math.Between(0, 360) * Phaser.Math.DEG_TO_RAD;
  }
}
