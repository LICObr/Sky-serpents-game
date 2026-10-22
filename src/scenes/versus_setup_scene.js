/**
 * versus_setup_scene.js
 * -----------------------------------------------------------------------------
 * Tela do 1v1: cada jogador escolhe o personagem e os dois combinam
 * as regras da luta:
 *   POÇÕES   → aparecem sozinhas nas ilhas (sim/não)
 *   BICHOS   → quantos bichos ficam na arena atacando os dois (nenhum a muitos)
 *   ESPECIAL → liberado ou proibido
 * e LUTAR! começa a luta (VersusScene). As escolhas ficam guardadas enquanto
 * o jogo estiver aberto.
 *
 * Teclado: ↑ ↓ (W S) escolhem a linha, ← → (A D) trocam, ENTER luta, ESC volta.
 * Mouse: clique nos cartões, nas setas ou em LUTAR!.
 * -----------------------------------------------------------------------------
 */
class VersusSetupScene extends Phaser.Scene {
  /** Últimas escolhas (mantidas entre idas e vindas). */
  static #last = { characters: [CharacterId.KNIGHT, CharacterId.ARCHER], potions: 0, mobs: 1, specials: 0 };

  #rows = [];
  #focusIndex = 0;
  #background;
  #pickers;
  #potions;
  #mobs;
  #specials;

  constructor() {
    super({ key: SceneKeys.VERSUS_SETUP });
  }

  create() {
    const { WIDTH, HEIGHT } = GameSettings.SCREEN;
    const last = VersusSetupScene.#last;
    MusicPlayer.ensurePlaying(this);
    this.#focusIndex = 0;

    // fundo da arena (a costa na tempestade), escurecido
    this.#background = this.add.tileSprite(0, 0, WIDTH, HEIGHT, LEVEL_VERSUS.BACKGROUND_TEXTURE).setOrigin(0);
    this.#background.setTileScale(HEIGHT / this.#background.texture.getSourceImage().height);
    this.add.rectangle(0, 0, WIDTH, HEIGHT, 0x05081a, 0.55).setOrigin(0);

    this.add.text(WIDTH / 2, 30, '1v1', UiStyle.text(24, '#ffe066')).setOrigin(0.5);
    const focus = row => this.#focus(this.#rows.indexOf(row));
    const color = slot => `#${GameSettings.PARTY.COLORS[slot].toString(16).padStart(6, '0')}`; // cor de cada jogador
    this.#pickers = [0, 1].map(slot => {
      const y = 140 + slot * 150;
      this.add.text(WIDTH / 2, y - 70, `JOGADOR ${slot + 1}`, UiStyle.text(9, color(slot))).setOrigin(0.5);
      return new CharacterPicker(this, y, last.characters[slot], focus, { compact: true });
    });

    const yesNo = (yes, no) => [{ label: yes, value: true }, { label: no, value: false }];
    this.#potions = new InlineOption(this, 392, 'POÇÕES', yesNo('SIM', 'NÃO'), last.potions, focus);
    this.#mobs = new InlineOption(this, 420, 'BICHOS',
      GameSettings.VERSUS.MOB_OPTIONS.map(option => ({ label: option.LABEL, value: option.COUNT })), last.mobs, focus);
    this.#specials = new InlineOption(this, 448, 'ESPECIAL', yesNo('LIBERADO', 'PROIBIDO'), last.specials, focus);
    const fight = new MenuButton(this, 500, 'LUTAR!', () => this.#start());

    this.#rows = [...this.#pickers, this.#potions, this.#mobs, this.#specials, fight];
    this.#rows.forEach((row, i) => row.setFocused(i === 0));

    [0, 1].forEach(slot => this.add.text(WIDTH / 2, HEIGHT - 38 + slot * 18, `J${slot + 1}: ${KeyBindings.playerHint(slot)}`,
      UiStyle.text(7, color(slot))).setOrigin(0.5));
    this.#bindKeys();
  }

  update() {
    this.#background.tilePositionX += GameSettings.BACKGROUND.SCROLL_SPEED;
  }

  #bindKeys() {
    const keyboard = this.input.keyboard;
    const change = delta => () => {
      SoundFx.play(this, SoundKeys.MENU_MOVE, { volume: 0.5 });
      this.#rows[this.#focusIndex].change(delta);
    };
    ['UP', 'W'].forEach(key => keyboard.on(`keydown-${key}`, () => this.#focus(this.#focusIndex - 1)));
    ['DOWN', 'S'].forEach(key => keyboard.on(`keydown-${key}`, () => this.#focus(this.#focusIndex + 1)));
    ['LEFT', 'A'].forEach(key => keyboard.on(`keydown-${key}`, change(-1)));
    ['RIGHT', 'D'].forEach(key => keyboard.on(`keydown-${key}`, change(1)));
    ['ENTER', 'SPACE'].forEach(key => keyboard.on(`keydown-${key}`, () => this.#start()));
    keyboard.once('keydown-ESC', () => this.scene.start(SceneKeys.TITLE));
  }

  #focus(index) {
    const next = Phaser.Math.Wrap(index, 0, this.#rows.length);
    if (next !== this.#focusIndex) SoundFx.play(this, SoundKeys.MENU_MOVE, { volume: 0.5 });
    this.#focusIndex = next;
    this.#rows.forEach((row, i) => row.setFocused(i === this.#focusIndex));
  }

  /** Guarda as escolhas e começa a luta na arena da tempestade. */
  #start() {
    SoundFx.play(this, SoundKeys.MENU_OK);
    const characters = this.#pickers.map(picker => picker.value);
    VersusSetupScene.#last = {
      characters, potions: this.#potions.index, mobs: this.#mobs.index, specials: this.#specials.index
    };
    this.scene.start(SceneKeys.VERSUS, {
      characterIds: characters,
      levelIndex: LEVELS.findIndex(level => level.STORM), // a força dos bichos é a da Costa da Tempestade
      difficultyId: DEFAULT_DIFFICULTY,
      versus: { potions: this.#potions.value, mobs: this.#mobs.value, specials: this.#specials.value }
    });
  }
}
