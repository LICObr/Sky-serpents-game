/**
 * pause_scene.js
 * -----------------------------------------------------------------------------
 * Caixinha que aparece POR CIMA da fase, com o jogo pausado (nada se mexe e
 * nenhum bicho novo aparece enquanto ela está aberta):
 *   PAUSE   → "PAUSADO": continuar, reiniciar ou ir para o menu
 *             (tecla P, botão de pausa no celular ou a janela perdeu o foco)
 *   MENU    → "VOLTAR AO MENU PRINCIPAL?" sim/não (tecla ESC)
 *   RESTART → "REINICIAR A FASE?" sim/não (tecla R)
 *
 * Teclado: a letra de cada opção, ou ↑ ↓ + ENTER. Mouse/toque: clicar.
 * "Não" volta para onde estava (o jogo ou a tela de pausa).
 * -----------------------------------------------------------------------------
 */
const PauseMode = Object.freeze({
  PAUSE: 'PAUSE',
  MENU: 'MENU',
  RESTART: 'RESTART'
});

class PauseScene extends Phaser.Scene {
  #mode;
  #matchData;   // para reiniciar a mesma fase
  #from;        // de onde veio (para o "Não" voltar)
  #sceneKey;    // a cena pausada (a fase ou o 1v1)
  #options = [];
  #focus = 0;

  constructor() {
    super({ key: SceneKeys.PAUSE });
  }

  /** @param {{mode: string, matchData: object, from?: string, sceneKey?: string}} data */
  init(data) {
    this.#mode = data.mode;
    this.#matchData = data.matchData;
    this.#from = data.from || null;
    this.#sceneKey = data.sceneKey || SceneKeys.GAME;
    this.#options = [];
  }

  create() {
    const { WIDTH, HEIGHT } = GameSettings.SCREEN;
    const cfg = GameSettings.PAUSE;
    const screen = this.#screen();

    // fundo escuro que também "segura" os cliques (nada passa para o jogo)
    this.add.rectangle(0, 0, WIDTH, HEIGHT, 0x000000, cfg.SHADE_ALPHA).setOrigin(0).setInteractive();
    this.add.rectangle(WIDTH / 2, HEIGHT / 2, cfg.PANEL.WIDTH, cfg.PANEL.HEIGHT, 0x1a1030, 0.94)
      .setStrokeStyle(3, 0xffe066, 0.9);

    const top = HEIGHT / 2 - cfg.PANEL.HEIGHT / 2;
    this.add.text(WIDTH / 2, top + 46, screen.title, UiStyle.text(cfg.TITLE_SIZE, '#ffe066')).setOrigin(0.5);
    this.add.text(WIDTH / 2, top + 84, screen.subtitle, UiStyle.text(9, '#c8c0e0')).setOrigin(0.5);

    screen.options.forEach((option, index) => {
      const text = this.add.text(WIDTH / 2, top + 140 + index * cfg.OPTION_GAP, option.label, UiStyle.text(cfg.OPTION_SIZE))
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => this.#setFocus(index))
        .on('pointerdown', () => option.action());
      this.#options.push({ ...option, text });
      PauseScene.#onKey(this, option.key, option.action);
    });

    this.#setFocus(screen.focus);
    if (screen.cancel) PauseScene.#onKey(this, 'ESC', screen.cancel);
    PauseScene.#onKey(this, 'UP', () => this.#setFocus(this.#focus - 1));
    PauseScene.#onKey(this, 'DOWN', () => this.#setFocus(this.#focus + 1));
    PauseScene.#onKey(this, 'ENTER', () => this.#options[this.#focus].action());
  }

  /** Título, texto e opções de cada caixinha. */
  #screen() {
    const confirm = (title, subtitle, onYes) => ({
      title,
      subtitle,
      focus: 1,                      // começa no "Não" (o mais seguro)
      cancel: () => this.#back(),    // ESC também é "Não"
      options: [
        { label: '[S] Sim', key: 'S', action: onYes },
        { label: '[N] Não', key: 'N', action: () => this.#back() }
      ]
    });

    const versus = this.#sceneKey === SceneKeys.VERSUS;
    const what = versus ? 'a luta' : 'a fase';
    switch (this.#mode) {
      case PauseMode.MENU:
        return confirm('VOLTAR AO MENU PRINCIPAL?', versus ? 'A luta acaba sem vencedor.' : 'O progresso desta fase será perdido.',
          () => this.#toMenu());
      case PauseMode.RESTART:
        return confirm(`REINICIAR ${what.toUpperCase()}?`, versus ? 'A luta começa de novo.' : 'Você volta para o começo da fase.',
          () => this.#restart());
      default:
        return {
          title: 'PAUSADO',
          subtitle: 'Quer voltar ao jogo?',
          focus: 0,
          options: [
            { label: '[P] Continuar', key: 'P', action: () => this.#resume() },
            { label: `[R] Reiniciar ${what}`, key: 'R', action: () => this.#open(PauseMode.RESTART) },
            { label: '[ESC] Menu principal', key: 'ESC', action: () => this.#open(PauseMode.MENU) }
          ]
        };
    }
  }

  #setFocus(index) {
    this.#focus = Phaser.Math.Wrap(index, 0, this.#options.length);
    this.#options.forEach((option, i) => option.text.setColor(i === this.#focus ? '#ffe066' : '#ffffff'));
  }

  /** Abre outra caixinha (ex.: da pausa para a confirmação). */
  #open(mode) {
    this.scene.restart({ mode, matchData: this.#matchData, from: this.#mode, sceneKey: this.#sceneKey });
  }

  /** "Não": volta para a pausa (se veio dela) ou direto para o jogo. */
  #back() {
    if (this.#from === PauseMode.PAUSE) this.#open(PauseMode.PAUSE);
    else this.#resume();
  }

  #resume() {
    this.scene.resume(this.#sceneKey);
    this.scene.stop();
  }

  #restart() {
    this.scene.start(this.#sceneKey, this.#matchData); // reinicia a fase (ou a luta) e fecha a caixinha
  }

  #toMenu() {
    this.scene.stop(this.#sceneKey);
    this.scene.start(SceneKeys.TITLE);
  }

  /** Liga uma tecla ignorando a repetição de quem segura a tecla apertada. */
  static #onKey(scene, key, action) {
    scene.input.keyboard.on(`keydown-${key}`, event => {
      if (!event.repeat) action();
    });
  }
}
