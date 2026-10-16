/**
 * input_controller.js
 * -----------------------------------------------------------------------------
 * Traduz o teclado (e os controles de toque do celular) em "intenções" do
 * jogador (andar, pular, agachar, atacar). O resto do jogo nunca lê teclas
 * diretamente: se um dia quiser trocar os controles ou adicionar um gamepad,
 * só esta classe muda.
 *
 * Controles (setas OU WASD):
 *   ← / →  ou  A / D          andar
 *   ↑  ou  W  ou  Page Up     pular
 *   ↓  ou  S  ou  Page Down   agachar
 *   Espaço                    atacar
 *   G                         especial
 * No celular: analógico + botões ESPAÇO e G (veja touch_controls.js).
 * -----------------------------------------------------------------------------
 */
class InputController {
  #left;
  #right;
  #jump;
  #duck;
  #attackKey;
  #specialKey;
  #touch;

  /**
   * @param {Phaser.Scene} scene
   * @param {TouchControls} [touch] controles na tela (celular)
   */
  constructor(scene, touch = null) {
    this.#touch = touch;
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

  isLeftHeld()  { return InputController.#anyDown(this.#left) || Boolean(this.#touch?.left); }
  isRightHeld() { return InputController.#anyDown(this.#right) || Boolean(this.#touch?.right); }
  isJumpHeld()  { return InputController.#anyDown(this.#jump) || Boolean(this.#touch?.up); }
  isDuckHeld()  { return InputController.#anyDown(this.#duck) || Boolean(this.#touch?.down); }

  /** true apenas no frame em que a tecla (ou o botão) de ataque foi pressionado. */
  isAttackJustPressed() {
    const touched = this.#touch ? this.#touch.consumeAttack() : false;
    return Phaser.Input.Keyboard.JustDown(this.#attackKey) || touched;
  }

  /** true apenas no frame em que a tecla (ou o botão) do especial foi pressionado. */
  isSpecialJustPressed() {
    const touched = this.#touch ? this.#touch.consumeSpecial() : false;
    return Phaser.Input.Keyboard.JustDown(this.#specialKey) || touched;
  }

  /** Alguma das teclas está pressionada? */
  static #anyDown(keys) {
    return keys.some(key => key.isDown);
  }
}
