/**
 * menu_rows.js
 * -----------------------------------------------------------------------------
 * Linhas do menu inicial. Todas herdam de MenuRow, que define a interface
 * comum usada pela MenuScene (navegação por teclado e mouse):
 *   - setFocused(bool) → destaca a linha selecionada
 *   - change(delta)    → ← / → trocam a opção
 *   - activate()       → ENTER / clique
 *
 * Subclasses:
 *   CharacterPicker → cartões dos personagens com a arte de cada um
 *                     (compacto no 1v1: só a arte e o nome)
 *   OptionSelector  → "< opção >" (fase, dificuldade)
 *   InlineOption    → "TÍTULO  < opção >" numa linha só (opções do 1v1)
 *   MenuButton      → botão (JOGAR)
 * -----------------------------------------------------------------------------
 */
class MenuRow {
  #focused = false;

  constructor() {
    if (new.target === MenuRow) throw new TypeError('MenuRow é abstrata.');
  }

  get isFocused() { return this.#focused; }

  setFocused(focused) {
    this.#focused = focused;
    this.render();
  }

  /** Redesenha conforme o estado. Subclasses DEVEM sobrescrever. */
  render() {
    throw new Error(`${this.constructor.name} precisa implementar render().`);
  }

  // eslint-disable-next-line no-unused-vars
  change(delta) {}

  activate() {}
}

/** Escolha de personagem com cartões ilustrados. */
class CharacterPicker extends MenuRow {
  #cards = [];
  #ids;
  #index;
  #onFocusRequest;

  /**
   * @param {Phaser.Scene} scene
   * @param {number} y
   * @param {string} selectedId personagem inicialmente escolhido
   * @param {Function} onFocusRequest chamado ao clicar (para focar a linha)
   * @param {{compact?: boolean}} [options] compact = cartão baixinho, só a arte e o nome (cabem dois seletores na tela)
   */
  constructor(scene, y, selectedId, onFocusRequest, { compact = false } = {}) {
    super();
    this.#ids = Object.keys(CHARACTERS);
    this.#index = Math.max(0, this.#ids.indexOf(selectedId));
    this.#onFocusRequest = onFocusRequest;

    const { WIDTH } = GameSettings.SCREEN;
    const centerX = WIDTH / 2;
    // os cartões encolhem para todos caberem na tela (5 personagens: ~148px cada)
    const spacing = Math.min(190, (WIDTH - 60) / this.#ids.length);
    const cardWidth = Math.min(160, spacing - 8);

    this.#ids.forEach((id, i) => {
      const character = CHARACTERS[id];
      const x = centerX + (i - (this.#ids.length - 1) / 2) * spacing;

      const frame = scene.add.rectangle(x, y, cardWidth, compact ? 112 : 150, 0x1a1030, 0.75).setStrokeStyle(3, 0x6a5a8a);
      const image = scene.add.image(x, y - (compact ? 12 : 24), character.TEXTURES.STAND.RIGHT)
        .setScale(character.SCALE * (compact ? 1.7 : 2.2));
      const name = scene.add.text(x, y + (compact ? 42 : 36), character.NAME.toUpperCase(), UiStyle.text(compact ? 9 : 11))
        .setOrigin(0.5);
      const info = compact ? null : scene.add.text(x, y + 58, character.DESCRIPTION,
        { ...UiStyle.text(6, '#c8c0e0'), wordWrap: { width: cardWidth - 14 }, lineSpacing: 2 }).setOrigin(0.5);

      frame.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        this.#index = i;
        this.#onFocusRequest(this);
        this.render();
      });
      this.#cards.push({ frame, image, name, info });
    });
    this.render();
  }

  /** Personagem escolhido. */
  get value() { return this.#ids[this.#index]; }

  /** @override */
  change(delta) {
    this.#index = Phaser.Math.Wrap(this.#index + delta, 0, this.#ids.length);
    this.render();
  }

  /** @override */
  render() {
    this.#cards.forEach((card, i) => {
      const selected = i === this.#index;
      card.frame.setStrokeStyle(selected ? 4 : 2, selected ? (this.isFocused ? 0xffe066 : 0xffffff) : 0x6a5a8a);
      card.image.setAlpha(selected ? 1 : 0.45);
      card.name.setColor(selected ? '#ffe066' : '#9a90b0');
    });
  }
}

/** Seletor "< opção >" com uma linha de detalhe embaixo. */
class OptionSelector extends MenuRow {
  #label;
  #valueText;
  #detailText;
  #options;
  #index;

  /**
   * @param {Phaser.Scene} scene
   * @param {number} y
   * @param {string} label título da linha (ex.: "FASE")
   * @param {{label: string, detail?: string, value: any}[]} options
   * @param {number} initialIndex
   * @param {Function} onFocusRequest
   */
  constructor(scene, y, label, options, initialIndex, onFocusRequest) {
    super();
    const centerX = GameSettings.SCREEN.WIDTH / 2;
    this.#options = options;
    this.#index = Phaser.Math.Clamp(initialIndex, 0, options.length - 1);

    this.#label = scene.add.text(centerX, y - 22, label, UiStyle.text(9, '#c8c0e0')).setOrigin(0.5);
    this.#valueText = scene.add.text(centerX, y, '', UiStyle.text(13)).setOrigin(0.5);
    this.#detailText = scene.add.text(centerX, y + 20, '', UiStyle.text(7, '#ff9a6a')).setOrigin(0.5);

    // Setas clicáveis
    [[-1, centerX - 230, '<'], [1, centerX + 230, '>']].forEach(([delta, x, symbol]) => {
      scene.add.text(x, y, symbol, UiStyle.text(16, '#ffe066')).setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => { onFocusRequest(this); this.change(delta); });
    });
    this.render();
  }

  /** Valor da opção escolhida. */
  get value() { return this.#options[this.#index].value; }

  /** @override */
  change(delta) {
    this.#index = Phaser.Math.Wrap(this.#index + delta, 0, this.#options.length);
    this.render();
  }

  /** @override */
  render() {
    const option = this.#options[this.#index];
    this.#valueText.setText(option.label).setColor(this.isFocused ? '#ffe066' : '#ffffff');
    this.#detailText.setText(option.detail || '');
    this.#label.setColor(this.isFocused ? '#ffe066' : '#c8c0e0');
  }
}

/** Opção numa linha só: "TÍTULO  < opção >" (as opções do 1v1). */
class InlineOption extends MenuRow {
  #label;
  #valueText;
  #options;
  #index;

  /**
   * @param {Phaser.Scene} scene
   * @param {number} y
   * @param {string} label título (ex.: "POÇÕES")
   * @param {{label: string, value: any}[]} options
   * @param {number} initialIndex
   * @param {Function} onFocusRequest
   */
  constructor(scene, y, label, options, initialIndex, onFocusRequest) {
    super();
    const centerX = GameSettings.SCREEN.WIDTH / 2;
    this.#options = options;
    this.#index = Phaser.Math.Clamp(initialIndex, 0, options.length - 1);
    this.#label = scene.add.text(centerX - 16, y, label, UiStyle.text(10, '#c8c0e0')).setOrigin(1, 0.5);
    this.#valueText = scene.add.text(centerX + 104, y, '', UiStyle.text(10)).setOrigin(0.5);
    [[-1, centerX + 16, '<'], [1, centerX + 192, '>']].forEach(([delta, x, symbol]) => {
      scene.add.text(x, y, symbol, UiStyle.text(12, '#ffe066')).setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => { onFocusRequest(this); this.change(delta); });
    });
    this.render();
  }

  /** Valor da opção escolhida. */
  get value() { return this.#options[this.#index].value; }

  /** Posição da opção escolhida (para lembrar na próxima vez). */
  get index() { return this.#index; }

  /** @override */
  change(delta) {
    this.#index = Phaser.Math.Wrap(this.#index + delta, 0, this.#options.length);
    this.render();
  }

  /** @override */
  render() {
    this.#valueText.setText(this.#options[this.#index].label).setColor(this.isFocused ? '#ffe066' : '#ffffff');
    this.#label.setColor(this.isFocused ? '#ffe066' : '#c8c0e0');
  }
}

/** Botão de ação (ENTER ou clique). */
class MenuButton extends MenuRow {
  #text;
  #label;
  #action;

  /**
   * @param {Phaser.Scene} scene
   * @param {number} y
   * @param {string} label
   * @param {Function} action
   */
  constructor(scene, y, label, action) {
    super();
    this.#label = label;
    this.#action = action;
    this.#text = scene.add.text(GameSettings.SCREEN.WIDTH / 2, y, label, UiStyle.text(20))
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.activate());
    this.render();
  }

  /** Passar o mouse por cima foca o botão. */
  onHover(callback) {
    this.#text.on('pointerover', callback);
    return this;
  }

  /** @override */
  activate() {
    this.#action();
  }

  /** @override */
  render() {
    this.#text.setColor(this.isFocused ? '#ffe066' : '#ffffff');
    this.#text.setText(this.isFocused ? `> ${this.#label} <` : this.#label);
  }
}
