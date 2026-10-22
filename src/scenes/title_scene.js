/**
 * title_scene.js
 * -----------------------------------------------------------------------------
 * MENU PRINCIPAL (a primeira tela depois de carregar):
 *   1 JOGADOR   → escolher o personagem (MenuScene) e depois a fase
 *   2 JOGADORES → escolher a fase direto (Guerreiro + Arqueira)
 *   OPÇÕES      → teclas do jogador 1 e do jogador 2 (OptionsScene)
 *
 * Fundo de uma das fases rolando devagar e os dois personagens grandes,
 * um de cada lado, de vez em quando fazendo a pose de ataque.
 * Teclado: ↑ ↓ (W S) escolhem, ENTER/ESPAÇO confirmam. Mouse: clique.
 * -----------------------------------------------------------------------------
 */
class TitleScene extends Phaser.Scene {
  #rows = [];
  #focusIndex = 0;
  #background;

  constructor() {
    super({ key: SceneKeys.TITLE });
  }

  create() {
    const { WIDTH, HEIGHT } = GameSettings.SCREEN;
    const cfg = GameSettings.TITLE;
    MusicPlayer.ensurePlaying(this);

    this.#background = this.add.tileSprite(0, 0, WIDTH, HEIGHT, cfg.BACKGROUND).setOrigin(0);
    this.#background.setTileScale(HEIGHT / this.#background.texture.getSourceImage().height);
    this.add.rectangle(0, 0, WIDTH, HEIGHT, 0x0a0618, 0.35).setOrigin(0);

    new CoinHUD(this); // moedas guardadas, no canto superior direito
    this.add.text(WIDTH / 2, 70, 'SKY SERPENTS', UiStyle.text(38, '#ffe066')).setOrigin(0.5);
    this.add.text(WIDTH / 2, 112, 'SUPREMO', UiStyle.text(18, '#ff9a6a')).setOrigin(0.5);

    this.#addHero(CHARACTERS[CharacterId.KNIGHT], cfg.HERO_X_MARGIN, true, 0);
    this.#addHero(CHARACTERS[CharacterId.ARCHER], WIDTH - cfg.HERO_X_MARGIN, false, cfg.BOB_MS / 2);

    this.#rows = [
      new MenuButton(this, cfg.BUTTONS_Y, '1 JOGADOR', () => this.scene.start(SceneKeys.MENU)),
      new MenuButton(this, cfg.BUTTONS_Y + cfg.BUTTON_GAP, '2 JOGADORES', () => this.#startTwoPlayers()),
      new MenuButton(this, cfg.BUTTONS_Y + cfg.BUTTON_GAP * 2, 'OPÇÕES', () => this.scene.start(SceneKeys.OPTIONS))
    ];
    this.#rows.forEach(row => row.onHover(() => this.#focus(this.#rows.indexOf(row))));
    this.#focus(0);

    this.add.text(WIDTH / 2, HEIGHT - 22, 'SETAS escolher    ENTER confirmar',
      UiStyle.text(7, '#c8c0e0')).setOrigin(0.5);
    this.#bindKeys();
  }

  update() {
    this.#background.tilePositionX += GameSettings.BACKGROUND.SCROLL_SPEED;
  }

  #bindKeys() {
    const keyboard = this.input.keyboard;
    ['UP', 'W'].forEach(key => keyboard.on(`keydown-${key}`, () => this.#focus(this.#focusIndex - 1)));
    ['DOWN', 'S'].forEach(key => keyboard.on(`keydown-${key}`, () => this.#focus(this.#focusIndex + 1)));
    ['ENTER', 'SPACE'].forEach(key => keyboard.on(`keydown-${key}`, () => {
      SoundFx.play(this, SoundKeys.MENU_OK);
      this.#rows[this.#focusIndex].activate();
    }));
  }

  #focus(index) {
    const next = Phaser.Math.Wrap(index, 0, this.#rows.length);
    if (next !== this.#focusIndex) SoundFx.play(this, SoundKeys.MENU_MOVE);
    this.#focusIndex = next;
    this.#rows.forEach((row, i) => row.setFocused(i === this.#focusIndex));
  }

  /** Dois jogadores: o 1 de Guerreiro e o 2 de Arqueira, direto para a escolha de fase. */
  #startTwoPlayers() {
    this.scene.start(SceneKeys.LEVEL_SELECT, {
      characterIds: [CharacterId.KNIGHT, CharacterId.ARCHER],
      difficultyId: DEFAULT_DIFFICULTY
    });
  }

  /**
   * Personagem grande ao lado do menu: balança devagar e de vez em quando
   * faz a pose de ataque.
   */
  #addHero(character, x, facingRight, bobDelay) {
    const cfg = GameSettings.TITLE;
    const side = facingRight ? 'RIGHT' : 'LEFT';
    const stand = character.TEXTURES.STAND[side];
    const attack = character.TEXTURES.ATTACK[side];

    this.add.ellipse(x, cfg.HERO_Y + 92, 120, 18, 0x000000, 0.35); // sombra no chão
    const hero = this.add.image(x, cfg.HERO_Y, stand).setScale(cfg.HERO_SCALE);
    this.tweens.add({
      targets: hero, y: cfg.HERO_Y - 8, duration: cfg.BOB_MS, delay: bobDelay,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    const strike = () => {
      hero.setTexture(attack);
      this.time.delayedCall(cfg.ATTACK_POSE_MS, () => hero.setTexture(stand));
      this.time.delayedCall(Phaser.Math.Between(cfg.ATTACK_EVERY_MS.MIN, cfg.ATTACK_EVERY_MS.MAX), strike);
    };
    this.time.delayedCall(Phaser.Math.Between(cfg.ATTACK_EVERY_MS.MIN, cfg.ATTACK_EVERY_MS.MAX), strike);
  }
}
