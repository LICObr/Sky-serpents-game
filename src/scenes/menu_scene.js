/**
 * menu_scene.js
 * -----------------------------------------------------------------------------
 * Menu inicial: escolher o personagem e JOGAR (abre a tela de escolha de
 * fase). Todo mundo começa com as vidas do padrão (DEFAULT_DIFFICULTY).
 *
 * Teclado: ↑ ↓ (W S) escolhem a linha, ← → (A D) trocam a opção, ENTER joga.
 * Mouse: clique nos cartões, nas setas ou em JOGAR.
 * A última escolha fica guardada enquanto o jogo estiver aberto.
 * -----------------------------------------------------------------------------
 */
class MenuScene extends Phaser.Scene {
  /** Última configuração escolhida (mantida entre idas e vindas ao menu). */
  static #lastCharacterId = CharacterId.KNIGHT;

  #rows = [];
  #focusIndex = 0;
  #background;
  #characterPicker;

  constructor() {
    super({ key: SceneKeys.MENU });
  }

  create() {
    const { WIDTH, HEIGHT } = GameSettings.SCREEN;
    MusicPlayer.ensurePlaying(this);

    this.#background = this.add.tileSprite(0, 0, WIDTH, HEIGHT, GameSettings.BACKGROUND.DEFAULT_TEXTURE).setOrigin(0);
    this.add.rectangle(0, 0, WIDTH, HEIGHT, 0x0a0618, 0.35).setOrigin(0);
    this.#addDecorations();

    this.add.text(WIDTH / 2, 56, 'SKY SERPENTS', UiStyle.text(34, '#ffe066')).setOrigin(0.5);
    this.add.text(WIDTH / 2, 94, 'SUPREMO', UiStyle.text(16, '#ff9a6a')).setOrigin(0.5);

    const focus = row => this.#focus(this.#rows.indexOf(row));

    this.#characterPicker = new CharacterPicker(this, 235, MenuScene.#lastCharacterId, focus);
    const playButton = new MenuButton(this, 420, 'JOGAR', () => this.#openLevelSelect());

    this.#rows = [this.#characterPicker, playButton];
    this.#focus(0);

    this.add.text(WIDTH / 2, HEIGHT - 34,
      'SETAS/WASD mover   ESPACO atacar   G especial   P pausa   ESC menu',
      UiStyle.text(7, '#c8c0e0')).setOrigin(0.5);
    this.add.text(WIDTH / 2, HEIGHT - 16, 'Dica: pule em cima dos bichos para esmagá-los!',
      UiStyle.text(7, '#8fd18a')).setOrigin(0.5);

    this.#bindKeys();
  }

  update() {
    this.#background.tilePositionX += GameSettings.BACKGROUND.SCROLL_SPEED;
  }

  #bindKeys() {
    const keyboard = this.input.keyboard;
    ['UP', 'W'].forEach(key => keyboard.on(`keydown-${key}`, () => this.#focus(this.#focusIndex - 1)));
    ['DOWN', 'S'].forEach(key => keyboard.on(`keydown-${key}`, () => this.#focus(this.#focusIndex + 1)));
    ['LEFT', 'A'].forEach(key => keyboard.on(`keydown-${key}`, () => this.#rows[this.#focusIndex].change(-1)));
    ['RIGHT', 'D'].forEach(key => keyboard.on(`keydown-${key}`, () => this.#rows[this.#focusIndex].change(1)));
    ['ENTER', 'SPACE'].forEach(key => keyboard.on(`keydown-${key}`, () => this.#openLevelSelect()));
  }

  #focus(index) {
    this.#focusIndex = Phaser.Math.Wrap(index, 0, this.#rows.length);
    this.#rows.forEach((row, i) => row.setFocused(i === this.#focusIndex));
  }

  /**
   * Dragão voando ao fundo, só de enfeite: atravessa a tela e vai trocando
   * de animação (mostra todas as da sprite sheet, uma depois da outra).
   */
  #addDecorations() {
    const sheet = BOSS_TYPES[BossTypeId.FIRE_DRAGON].SPRITE_SHEET;
    const dragon = this.add.sprite(-80, 150, sheet, 0).setScale(0.8).setAlpha(0.85);
    this.tweens.add({ targets: dragon, x: GameSettings.SCREEN.WIDTH + 80, duration: 12000, repeat: -1 });
    this.tweens.add({ targets: dragon, y: 190, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.#cycleAnimations(dragon, sheet);
  }

  /** Toca as animações em sequência (as que repetem duram um tempinho). */
  #cycleAnimations(sprite, sheet) {
    const names = ['voando', 'subindo', 'voando', 'descendo', 'voando', 'ataque'];
    const LOOP_MS = 1600;
    let index = 0;

    const playNext = () => {
      if (!sprite.active) return;
      const name = names[index];
      index = (index + 1) % names.length;

      // Voa para a direita: espelha os clipes desenhados olhando para a esquerda
      sprite.setFlipX(!DragonSpriteSheets.facesRight(name));
      sprite.play(DragonSpriteSheets.clipKey(sheet, name));

      if (GameSettings.DRAGON_ANIMATION.CLIPS[name].REPEAT === 0) {
        sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, playNext);
      } else {
        this.time.delayedCall(LOOP_MS, playNext);
      }
    };
    playNext();
  }

  #openLevelSelect() {
    MenuScene.#lastCharacterId = this.#characterPicker.value;
    this.scene.start(SceneKeys.LEVEL_SELECT, {
      characterId: this.#characterPicker.value,
      difficultyId: DEFAULT_DIFFICULTY
    });
  }
}
