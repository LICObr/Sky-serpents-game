/**
 * options_scene.js
 * -----------------------------------------------------------------------------
 * OPÇÕES: duas caixinhas, uma com as teclas do jogador 1 e outra com as do
 * jogador 2. Escolha uma ação, aperte ENTER (ou clique nela) e depois a
 * tecla nova. Se a tecla já era usada, as duas ações trocam (KeyBindings).
 * PADRÃO volta às teclas originais. A escolha fica guardada no navegador.
 *
 * Teclado: setas / WASD escolhem, ENTER/ESPAÇO trocam a tecla,
 * ESC cancela a troca ou volta ao menu principal.
 * -----------------------------------------------------------------------------
 */
class OptionsScene extends Phaser.Scene {
  static #BUTTONS_ROW = Object.values(ControlAction).length; // linha dos botões, embaixo das teclas

  #panels = [];
  #buttons = [];                  // { label, text, action }: PADRÃO e VOLTAR
  #focus = { column: 0, row: 0 }; // coluna = jogador (ou botão, na linha dos botões)
  #waiting = false;               // esperando a tecla nova
  #message;
  #background;

  constructor() {
    super({ key: SceneKeys.OPTIONS });
  }

  create() {
    const { WIDTH, HEIGHT } = GameSettings.SCREEN;
    const cfg = GameSettings.OPTIONS;
    this.#panels = [];
    this.#focus = { column: 0, row: 0 };
    this.#waiting = false;

    this.#background = this.add.tileSprite(0, 0, WIDTH, HEIGHT, GameSettings.TITLE.BACKGROUND).setOrigin(0);
    this.#background.setTileScale(HEIGHT / this.#background.texture.getSourceImage().height);
    this.add.rectangle(0, 0, WIDTH, HEIGHT, 0x0a0618, 0.55).setOrigin(0);

    this.add.text(WIDTH / 2, 48, 'OPÇÕES', UiStyle.text(24, '#ffe066')).setOrigin(0.5);
    this.add.text(WIDTH / 2, 82, 'Teclas de cada jogador (sozinho valem as dos dois)', UiStyle.text(8, '#c8c0e0')).setOrigin(0.5);

    const startWaiting = (column, row) => {
      this.#focus = { column, row };
      this.#startWaiting();
    };
    this.#panels = cfg.PANEL_X.map((x, playerIndex) => new KeyBindingPanel(this, x, playerIndex, startWaiting));

    const buttonsY = cfg.PANEL.TOP + cfg.PANEL.HEIGHT + 44;
    this.#buttons = [
      { label: 'PADRÃO', action: () => this.#resetKeys() },
      { label: 'VOLTAR', action: () => this.#back() }
    ].map(({ label, action }, column) => {
      const text = this.add.text(WIDTH / 2 + (column === 0 ? -110 : 110), buttonsY, label, UiStyle.text(14))
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => this.#moveFocus({ column, row: OptionsScene.#BUTTONS_ROW }))
        .on('pointerdown', action);
      return { label, text, action };
    });

    this.#message = this.add.text(WIDTH / 2, buttonsY + 40, '', UiStyle.text(8, '#8fd18a')).setOrigin(0.5);
    this.add.text(WIDTH / 2, HEIGHT - 22, 'SETAS escolher    ENTER trocar a tecla    ESC voltar',
      UiStyle.text(7, '#c8c0e0')).setOrigin(0.5);

    this.input.keyboard.on('keydown', event => (this.#waiting ? this.#capture(event) : this.#navigate(event)));
    this.#render();
  }

  update() {
    this.#background.tilePositionX += GameSettings.BACKGROUND.SCROLL_SPEED;
  }

  /** Setas/WASD andam, ENTER/ESPAÇO escolhem, ESC volta. */
  #navigate(event) {
    const codes = Phaser.Input.Keyboard.KeyCodes;
    const { column, row } = this.#focus;
    switch (event.keyCode) {
      case codes.UP: case codes.W:
        this.#moveFocus({ column, row: Phaser.Math.Wrap(row - 1, 0, OptionsScene.#BUTTONS_ROW + 1) }); break;
      case codes.DOWN: case codes.S:
        this.#moveFocus({ column, row: Phaser.Math.Wrap(row + 1, 0, OptionsScene.#BUTTONS_ROW + 1) }); break;
      case codes.LEFT: case codes.A: case codes.RIGHT: case codes.D:
        this.#moveFocus({ column: 1 - column, row }); break;
      case codes.ENTER: case codes.SPACE:
        if (row === OptionsScene.#BUTTONS_ROW) this.#buttons[column].action();
        else this.#startWaiting();
        break;
      case codes.ESC:
        this.#back(); break;
    }
  }

  /** Tecla apertada enquanto espera a nova: ESC cancela; reservada não vale. */
  #capture(event) {
    if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.ESC) {
      this.#waiting = false;
      this.#showMessage('');
      this.#refresh();
      return;
    }
    const keyName = KeyBindings.nameFromCode(event.keyCode);
    if (!keyName) {
      this.#showMessage('Essa tecla não dá para usar. Escolha outra.', '#ff7a6a');
      return;
    }
    if (KeyBindings.isReserved(keyName)) {
      this.#showMessage(`${KeyBindings.label(keyName)} é da pausa e dos menus. Escolha outra.`, '#ff7a6a');
      return;
    }
    const { column, row } = this.#focus;
    const action = Object.values(ControlAction)[row];
    KeyBindings.assign(column, action, keyName);
    this.#waiting = false;
    this.#showMessage(`${CONTROLS.ACTION_LABELS[action]} do jogador ${column + 1}: ${KeyBindings.label(keyName)}`);
    this.#refresh();
  }

  #startWaiting() {
    const { column, row } = this.#focus;
    this.#waiting = true;
    const action = Object.values(ControlAction)[row];
    this.#showMessage(`Aperte a nova tecla para ${CONTROLS.ACTION_LABELS[action]} (jogador ${column + 1})  -  ESC cancela`, '#ffe066');
    this.#render();
  }

  #resetKeys() {
    KeyBindings.reset();
    this.#showMessage('Teclas padrão de volta!');
    this.#refresh();
  }

  #back() {
    this.scene.start(SceneKeys.TITLE);
  }

  #moveFocus(focus) {
    if (this.#waiting) return;
    this.#focus = focus;
    this.#render();
  }

  #showMessage(text, color = '#8fd18a') {
    this.#message.setText(text).setColor(color);
  }

  /** Relê as teclas dos dois jogadores e redesenha. */
  #refresh() {
    this.#panels.forEach(panel => panel.refresh());
    this.#render();
  }

  #render() {
    const { column, row } = this.#focus;
    const onButtons = row === OptionsScene.#BUTTONS_ROW;
    this.#panels.forEach((panel, index) => panel.render(!onButtons && index === column ? row : null, this.#waiting));
    this.#buttons.forEach(({ label, text }, index) => {
      const focused = onButtons && index === column;
      text.setColor(focused ? '#ffe066' : '#ffffff').setText(focused ? `> ${label} <` : label);
    });
  }
}
