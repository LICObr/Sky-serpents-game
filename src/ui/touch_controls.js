/**
 * touch_controls.js
 * -----------------------------------------------------------------------------
 * Controles na TELA, para jogar no celular (também funcionam com o mouse):
 *   - ANALÓGICO: aparece onde o dedo encostar, na parte esquerda da tela
 *       ← →  andar  |  para cima  pular  |  para baixo  agachar
 *   - botões: ESPAÇO (atacar), G (especial) e II (pausa)
 * No celular os botões aparecem desde o começo; no computador, depois do
 * primeiro clique na tela. O InputController lê este estado junto com o teclado.
 * -----------------------------------------------------------------------------
 */
class TouchControls {
  #scene;
  #canUse;
  #base;
  #thumb;
  #pointerId = null;   // dedo que está segurando o analógico
  #dx = 0;             // direção do analógico, de -1 a 1
  #dy = 0;
  #attackPressed = false;
  #specialPressed = false;
  #buttons = [];

  /**
   * @param {Phaser.Scene} scene
   * @param {{onPause: Function, canUse: Function}} handlers
   *        canUse: os controles valem agora? (ex.: não depois do fim da fase)
   */
  constructor(scene, { onPause, canUse }) {
    const cfg = GameSettings.TOUCH;
    const depth = GameSettings.HUD.DEPTH + 0.5;
    this.#scene = scene;
    this.#canUse = canUse;

    this.#base = scene.add.circle(0, 0, cfg.JOYSTICK_RADIUS, 0xffffff, 0.12)
      .setStrokeStyle(3, 0xffffff, cfg.ALPHA).setScrollFactor(0).setDepth(depth).setVisible(false);
    this.#thumb = scene.add.circle(0, 0, cfg.THUMB_RADIUS, 0xffe066, cfg.ALPHA + 0.2)
      .setScrollFactor(0).setDepth(depth).setVisible(false);

    const { ATTACK, SPECIAL, PAUSE } = cfg.BUTTONS;
    this.#addButton(ATTACK, () => { this.#attackPressed = true; });
    this.#addButton(SPECIAL, () => { this.#specialPressed = true; });
    this.#addButton(PAUSE, onPause);
    this.#setButtonsVisible(scene.sys.game.device.input.touch);

    scene.input.on('pointerdown', (pointer, over) => this.#onDown(pointer, over));
    scene.input.on('pointermove', pointer => this.#onMove(pointer));
    scene.input.on('pointerup', pointer => this.#onUp(pointer));
    scene.input.on('pointerupoutside', pointer => this.#onUp(pointer));
  }

  get left()  { return this.#dx < -GameSettings.TOUCH.DEAD_ZONE; }
  get right() { return this.#dx > GameSettings.TOUCH.DEAD_ZONE; }
  get up()    { return this.#dy < -GameSettings.TOUCH.JUMP_ZONE; }
  get down()  { return this.#dy > GameSettings.TOUCH.DUCK_ZONE; }

  /** true uma única vez a cada toque no botão de ataque. */
  consumeAttack() {
    const pressed = this.#attackPressed;
    this.#attackPressed = false;
    return pressed;
  }

  /** true uma única vez a cada toque no botão do especial. */
  consumeSpecial() {
    const pressed = this.#specialPressed;
    this.#specialPressed = false;
    return pressed;
  }

  /** Solta o analógico (ex.: ao voltar da pausa, o dedo pode ter saído). */
  reset() {
    this.#pointerId = null;
    this.#dx = 0;
    this.#dy = 0;
    this.#base.setVisible(false);
    this.#thumb.setVisible(false);
  }

  /** Encostou: o analógico nasce ali (parte esquerda da tela, fora dos botões). */
  #onDown(pointer, over) {
    if (!this.#canUse()) return;
    this.#setButtonsVisible(true);
    if (over.length > 0 || this.#pointerId !== null) return;
    if (pointer.x > GameSettings.SCREEN.WIDTH * GameSettings.TOUCH.JOYSTICK_AREA_RATIO) return;

    this.#pointerId = pointer.id;
    this.#base.setPosition(pointer.x, pointer.y).setVisible(true);
    this.#thumb.setPosition(pointer.x, pointer.y).setVisible(true);
  }

  /** Arrastou: o pino segue o dedo até a borda do círculo. */
  #onMove(pointer) {
    if (pointer.id !== this.#pointerId) return;
    const radius = GameSettings.TOUCH.JOYSTICK_RADIUS;
    const offsetX = pointer.x - this.#base.x;
    const offsetY = pointer.y - this.#base.y;
    const limit = Math.min(1, radius / (Math.hypot(offsetX, offsetY) || 1));
    this.#thumb.setPosition(this.#base.x + offsetX * limit, this.#base.y + offsetY * limit);
    this.#dx = (offsetX * limit) / radius;
    this.#dy = (offsetY * limit) / radius;
  }

  #onUp(pointer) {
    if (pointer.id === this.#pointerId) this.reset();
  }

  /** Botão redondo com o nome; acende rapidinho ao ser tocado. */
  #addButton({ X, Y, RADIUS, LABEL, SIZE }, onPress) {
    const depth = GameSettings.HUD.DEPTH + 0.5;
    const circle = this.#scene.add.circle(X, Y, RADIUS, 0x000000, 0.3)
      .setStrokeStyle(3, 0xffffff, 0.6).setScrollFactor(0).setDepth(depth).setInteractive();
    const label = this.#scene.add.text(X, Y, LABEL, UiStyle.text(SIZE)).setOrigin(0.5).setScrollFactor(0).setDepth(depth);
    circle.on('pointerdown', () => {
      if (!this.#canUse()) return;
      circle.setFillStyle(0xffe066, 0.5);
      this.#scene.time.delayedCall(120, () => circle.setFillStyle(0x000000, 0.3));
      onPress();
    });
    this.#buttons.push(circle, label);
  }

  #setButtonsVisible(visible) {
    this.#buttons.forEach(part => part.setVisible(visible));
  }
}
