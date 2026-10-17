/**
 * level_select_scene.js
 * -----------------------------------------------------------------------------
 * Tela de ESCOLHA DE FASE (1 jogador: depois de escolher o personagem;
 * 2 jogadores: direto do menu principal): caixinhas
 * numeradas de 1 a 30. As fases que já existem (LEVELS) podem ser jogadas;
 * as outras aparecem como "em desenvolvimento", com um x vermelho.
 *
 * Teclado: setas / WASD andam pelas caixinhas, ENTER/ESPAÇO jogam,
 * ESC volta ao menu. Mouse: passar por cima escolhe, clicar joga.
 * -----------------------------------------------------------------------------
 */
class LevelSelectScene extends Phaser.Scene {
  /** Última fase escolhida (mantida enquanto o jogo estiver aberto). */
  static #lastIndex = 0;

  #choice;      // personagem e dificuldade vindos do menu
  #slots = [];
  #selected = 0;
  #info;
  #goals;
  #background;

  constructor() {
    super({ key: SceneKeys.LEVEL_SELECT });
  }

  /** @param {{characterIds: string[], difficultyId: string}} data um personagem por jogador */
  init(data) {
    this.#choice = data;
    this.#slots = [];
  }

  create() {
    const { WIDTH, HEIGHT } = GameSettings.SCREEN;
    const cfg = GameSettings.LEVEL_SELECT;
    MusicPlayer.ensurePlaying(this);

    this.#background = this.add.tileSprite(0, 0, WIDTH, HEIGHT, GameSettings.BACKGROUND.DEFAULT_TEXTURE).setOrigin(0);
    this.add.rectangle(0, 0, WIDTH, HEIGHT, 0x0a0618, 0.45).setOrigin(0);

    new CoinHUD(this); // moedas guardadas, no canto superior direito
    this.add.text(WIDTH / 2, 50, 'ESCOLHA A FASE', UiStyle.text(24, '#ffe066')).setOrigin(0.5);
    this.add.text(WIDTH / 2, 82, this.#playersLine(), UiStyle.text(8, '#c8c0e0')).setOrigin(0.5);

    // Grade de caixinhas (6 colunas x 5 linhas = 30 fases)
    const { BOX, GAP, COLUMNS, TOTAL_SLOTS, START_Y } = cfg;
    const gridWidth = COLUMNS * BOX.WIDTH + (COLUMNS - 1) * GAP.X;
    const startX = (WIDTH - gridWidth) / 2 + BOX.WIDTH / 2;

    for (let i = 0; i < TOTAL_SLOTS; i++) {
      const x = startX + (i % COLUMNS) * (BOX.WIDTH + GAP.X);
      const y = START_Y + Math.floor(i / COLUMNS) * (BOX.HEIGHT + GAP.Y);
      this.#slots.push(new LevelSlot(this, x, y, i + 1, i < LEVELS.length, {
        onHover: () => this.#select(i),
        onClick: () => this.#play(i)
      }));
    }

    this.#info = this.add.text(WIDTH / 2, HEIGHT - 72, '', UiStyle.text(10)).setOrigin(0.5);
    this.#goals = this.add.text(WIDTH / 2, HEIGHT - 50, '', UiStyle.text(7, '#ffd93b')).setOrigin(0.5);
    this.add.text(WIDTH / 2, HEIGHT - 22, 'SETAS escolher    ENTER jogar    ESC voltar',
      UiStyle.text(7, '#c8c0e0')).setOrigin(0.5);

    this.#select(LevelSelectScene.#lastIndex);
    this.#bindKeys();
  }

  update() {
    this.#background.tilePositionX += GameSettings.BACKGROUND.SCROLL_SPEED;
  }

  /** "Guerreiro - 5 corações" ou "2 JOGADORES: Guerreiro + Arqueira - 5 corações cada". */
  #playersLine() {
    const hearts = DIFFICULTIES[this.#choice.difficultyId].PLAYER_HEARTS;
    const names = this.#choice.characterIds.map(id => CHARACTERS[id].NAME);
    return names.length > 1
      ? `2 JOGADORES: ${names.join(' + ')}  -  ${hearts} corações cada`
      : `${names[0]}  -  ${hearts} corações`;
  }

  #bindKeys() {
    const keyboard = this.input.keyboard;
    const columns = GameSettings.LEVEL_SELECT.COLUMNS;
    const move = delta => () => this.#select(this.#selected + delta);
    ['LEFT', 'A'].forEach(key => keyboard.on(`keydown-${key}`, move(-1)));
    ['RIGHT', 'D'].forEach(key => keyboard.on(`keydown-${key}`, move(1)));
    ['UP', 'W'].forEach(key => keyboard.on(`keydown-${key}`, move(-columns)));
    ['DOWN', 'S'].forEach(key => keyboard.on(`keydown-${key}`, move(columns)));
    ['ENTER', 'SPACE'].forEach(key => keyboard.on(`keydown-${key}`, () => this.#play(this.#selected)));
    // volta para a escolha de personagem (1 jogador) ou para o menu principal (2 jogadores)
    const back = this.#choice.characterIds.length > 1 ? SceneKeys.TITLE : SceneKeys.MENU;
    keyboard.once('keydown-ESC', () => this.scene.start(back));
  }

  #select(index) {
    this.#selected = Phaser.Math.Wrap(index, 0, this.#slots.length);
    this.#slots.forEach((slot, i) => slot.setSelected(i === this.#selected));

    const level = LEVELS[this.#selected];
    const number = this.#selected + 1;
    this.#info
      .setText(level ? `Fase ${number}  -  ${level.NAME}` : `Fase ${number}  -  em desenvolvimento`)
      .setColor(level ? '#ffffff' : '#ff7a6a');
    this.#goals.setText(level ? LevelSelectScene.#goalsLine(level) : '');
  }

  /** Recorde (se já concluída) e o tempo para cada estrela. */
  static #goalsLine(level) {
    const { bestMs } = LevelProgress.of(level.NUMBER);
    const record = bestMs === null ? 'Ainda não concluída' : `Recorde ${LevelTimer.format(bestMs)}`;
    return `${record}   -   ${StarRating.goalsText(level)}`;
  }

  #play(index) {
    if (!this.#slots[index].available) {
      // Fase ainda não existe: só um "não" balançando o texto
      this.#select(index);
      this.tweens.add({ targets: this.#info, x: this.#info.x + 6, duration: 50, yoyo: true, repeat: 3 });
      return;
    }
    LevelSelectScene.#lastIndex = index;
    this.scene.start(SceneKeys.GAME, { ...this.#choice, levelIndex: index });
  }
}
