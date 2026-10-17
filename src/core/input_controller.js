/**
 * input_controller.js
 * -----------------------------------------------------------------------------
 * Traduz o teclado (e os controles de toque do celular) em "intenções" do
 * jogador (andar, pular, agachar, atacar). O resto do jogo nunca lê teclas
 * diretamente: se um dia quiser adicionar um gamepad, só esta classe muda.
 *
 * As teclas de cada ação vêm de KeyBindings (tela de OPÇÕES): sozinho valem
 * as dos dois jogadores; com dois jogadores, cada um tem um InputController
 * com as suas. No celular: analógico + botões ESPAÇO e G (touch_controls.js).
 * -----------------------------------------------------------------------------
 */
class InputController {
  #left;
  #right;
  #jump;
  #duck;
  #attack;
  #special;
  #touch;

  /**
   * @param {Phaser.Scene} scene
   * @param {Object<string, string[]>} keyNames teclas de cada ação (ControlAction),
   *   com os nomes de Phaser.Input.Keyboard.KeyCodes (ex.: { LEFT: ['A', 'LEFT'], ... })
   * @param {TouchControls} [touch] controles na tela (celular)
   */
  constructor(scene, keyNames, touch = null) {
    this.#touch = touch;
    const keyboard = scene.input.keyboard;
    const keys = action => keyNames[action].map(name => keyboard.addKey(Phaser.Input.Keyboard.KeyCodes[name]));

    // Cada ação aceita várias teclas
    this.#left = keys(ControlAction.LEFT);
    this.#right = keys(ControlAction.RIGHT);
    this.#jump = keys(ControlAction.JUMP);
    this.#duck = keys(ControlAction.DUCK);
    this.#attack = keys(ControlAction.ATTACK);
    this.#special = keys(ControlAction.SPECIAL);
  }

  isLeftHeld()  { return InputController.#anyDown(this.#left) || Boolean(this.#touch?.left); }
  isRightHeld() { return InputController.#anyDown(this.#right) || Boolean(this.#touch?.right); }
  isJumpHeld()  { return InputController.#anyDown(this.#jump) || Boolean(this.#touch?.up); }
  isDuckHeld()  { return InputController.#anyDown(this.#duck) || Boolean(this.#touch?.down); }

  /** true apenas no frame em que a tecla (ou o botão) de ataque foi pressionado. */
  isAttackJustPressed() {
    const touched = this.#touch ? this.#touch.consumeAttack() : false;
    return InputController.#anyJustDown(this.#attack) || touched;
  }

  /** true apenas no frame em que a tecla (ou o botão) do especial foi pressionado. */
  isSpecialJustPressed() {
    const touched = this.#touch ? this.#touch.consumeSpecial() : false;
    return InputController.#anyJustDown(this.#special) || touched;
  }

  /** Alguma das teclas está pressionada? */
  static #anyDown(keys) {
    return keys.some(key => key.isDown);
  }

  /** Alguma das teclas acabou de ser apertada (neste frame)? */
  static #anyJustDown(keys) {
    return keys.some(key => Phaser.Input.Keyboard.JustDown(key));
  }
}
