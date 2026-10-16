/**
 * input_controller.js
 * -----------------------------------------------------------------------------
 * Traduz o teclado em "intenções" do jogador (andar, pular, agachar, atacar).
 * O resto do jogo nunca lê teclas diretamente: se um dia quiser trocar os
 * controles ou adicionar um gamepad, só esta classe muda.
 *
 * Controles (setas OU WASD):
 *   ← / →  ou  A / D          andar
 *   ↑  ou  W  ou  Page Up     pular
 *   ↓  ou  S  ou  Page Down   agachar
 *   Espaço                    atacar
 *   G                         especial
 * -----------------------------------------------------------------------------
 */
class InputController {
  #left;
  #right;
  #jump;
  #duck;
  #attackKey;
  #specialKey;

  /** @param {Phaser.Scene} scene */
  constructor(scene) {
    const keyboard = scene.input.keyboard;
    const KeyCodes = Phaser.Input.Keyboard.KeyCodes;
    const keys = (...codes) => codes.map(code => keyboard.addKey(code));

    // Cada ação aceita várias teclas
    this.#left = keys(KeyCodes.LEFT, KeyCodes.A);
    this.#right = keys(KeyCodes.RIGHT, KeyCodes.D);
    this.#jump = keys(KeyCodes.UP, KeyCodes.W, KeyCodes.PAGE_UP);
    this.#duck = keys(KeyCodes.DOWN, KeyCodes.S, KeyCodes.PAGE_DOWN);
    this.#attackKey = keyboard.addKey(KeyCodes.SPACE);
    this.#specialKey = keyboard.addKey(KeyCodes.G);
  }

  isLeftHeld()  { return InputController.#anyDown(this.#left); }
  isRightHeld() { return InputController.#anyDown(this.#right); }
  isJumpHeld()  { return InputController.#anyDown(this.#jump); }
  isDuckHeld()  { return InputController.#anyDown(this.#duck); }

  /** true apenas no frame em que a tecla de ataque foi pressionada. */
  isAttackJustPressed() {
    return Phaser.Input.Keyboard.JustDown(this.#attackKey);
  }

  /** true apenas no frame em que a tecla do especial foi pressionada. */
  isSpecialJustPressed() {
    return Phaser.Input.Keyboard.JustDown(this.#specialKey);
  }

  /** Alguma das teclas está pressionada? */
  static #anyDown(keys) {
    return keys.some(key => key.isDown);
  }
}
