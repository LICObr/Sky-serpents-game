/**
 * loading_showcase.js
 * -----------------------------------------------------------------------------
 * TELA DE CARREGAMENTO: a cada vez que o jogo abre, sorteia um FUNDO (de
 * qualquer fase) e um BICHO (do morcego ao dragão). O fundo rola devagar,
 * meio escurecido, e o bicho anda — ou voa, ou vai pulando — em cima da
 * barrinha amarela, correndo atrás da ponta dela até encher.
 *
 * Primeiro só o fundo e o bicho sorteados são carregados (rapidinho); depois
 * vem o resto do jogo, com a barra (BootScene).
 * -----------------------------------------------------------------------------
 */
class LoadingShowcase {
  #scene;
  #creature;
  #sprite;
  #background;
  #bar;
  #percent;
  #barX;
  #barY;
  #barWidth;
  #progress = 0;
  #frame = 0;
  #nextFrameAt = 0;
  #shownAt;

  /** Sorteia o fundo e o bicho (antes de carregar qualquer coisa). */
  static pick() {
    const cfg = GameSettings.LOADING;
    return {
      background: Phaser.Utils.Array.GetRandom(cfg.BACKGROUNDS),
      creature: Phaser.Utils.Array.GetRandom(cfg.CREATURES)
    };
  }

  /** Carrega só o que a tela de carregamento precisa: o fundo e o bicho sorteados. */
  static preload(scene, { background, creature }) {
    const sheet = creature.SHEET ? LoadingShowcase.#sheets()[creature.SHEET] : null;
    AssetLoader.loadKeys(scene, [background, ...(creature.FRAMES || [])], sheet ? sheet.entries() : []);
  }

  /** Folhas de animação dos chefões: o que carregar e como registrar os clipes. */
  static #sheets() {
    const dragon = key => ({
      entries: () => DragonSpriteSheets.manifestEntries().filter(entry => entry.key.startsWith(`${key}__`)),
      register: scene => DragonSpriteSheets.register(scene, key)
    });
    return {
      bear: { entries: () => BearSpriteSheet.manifestEntries(), register: scene => BearSpriteSheet.registerAll(scene) },
      queen_bee: { entries: () => QueenBeeSpriteSheet.manifestEntries(), register: scene => QueenBeeSpriteSheet.registerAll(scene) },
      dragon_red: dragon('dragon_red'),
      dragon_pink: dragon('dragon_pink')
    };
  }

  /**
   * Monta a tela (chamar depois do preload, com o fundo e o bicho já carregados).
   * @param {Phaser.Scene} scene
   * @param {{background: string, creature: object}} choice o que foi sorteado
   */
  constructor(scene, { background, creature }) {
    const cfg = GameSettings.LOADING;
    const { WIDTH, HEIGHT } = GameSettings.SCREEN;
    this.#scene = scene;
    this.#creature = creature;
    this.#shownAt = scene.time.now;

    // fundo sorteado, na altura da tela, rolando devagar e meio escurecido
    // (se não carregou, fica o fundo escuro mesmo)
    this.#background = scene.add.tileSprite(0, 0, WIDTH, HEIGHT, scene.textures.exists(background) ? background : '__DEFAULT')
      .setOrigin(0, 0);
    const scale = HEIGHT / this.#background.displayFrame.realHeight;
    this.#background.setTileScale(scale, scale);
    scene.add.rectangle(0, 0, WIDTH, HEIGHT, 0x0a0614, cfg.SHADE_ALPHA).setOrigin(0, 0);

    // barrinha
    this.#barWidth = cfg.BAR.WIDTH;
    this.#barX = (WIDTH - cfg.BAR.WIDTH) / 2;
    this.#barY = cfg.BAR.Y;
    scene.add.text(WIDTH / 2, this.#barY + 40, 'CARREGANDO...', UiStyle.text(14)).setOrigin(0.5);
    this.#percent = scene.add.text(WIDTH / 2, this.#barY + 66, '0%', UiStyle.text(10, '#ffe066')).setOrigin(0.5);
    scene.add.rectangle(this.#barX - 3, this.#barY, cfg.BAR.WIDTH + 6, cfg.BAR.HEIGHT + 6, 0x1a1020).setOrigin(0, 0.5);
    scene.add.rectangle(this.#barX, this.#barY, cfg.BAR.WIDTH, cfg.BAR.HEIGHT, 0x2a1d3a).setOrigin(0, 0.5);
    this.#bar = scene.add.rectangle(this.#barX, this.#barY, 0, cfg.BAR.HEIGHT, 0xffe066).setOrigin(0, 0.5);

    // o bicho, começando antes da barra
    this.#sprite = this.#createCreature();
    this.#sprite.setPosition(this.#barX - 30, this.#restY(0));
  }

  /** A barra enche (0 a 1). */
  setProgress(progress) {
    this.#progress = progress;
    this.#bar.width = this.#barWidth * progress;
    this.#percent.setText(`${Math.round(progress * 100)}%`);
  }

  /**
   * Terminou de carregar: espera o tempo mínimo na tela e o bicho chegar na
   * ponta da barra, e então chama `done`.
   */
  finish(done) {
    this.setProgress(1);
    const wait = () => {
      const longEnough = this.#scene.time.now - this.#shownAt >= GameSettings.LOADING.MIN_MS;
      const arrived = this.#sprite.x >= this.#tipX() - 4;
      if (longEnough && arrived) done();
      else this.#scene.time.delayedCall(50, wait);
    };
    wait();
  }

  /** O bicho corre atrás da ponta da barra, se mexendo (chamar a cada frame). */
  update(time, delta) {
    this.#background.tilePositionX += 0.3 / this.#background.tileScaleX;
    const sprite = this.#sprite;
    const step = GameSettings.LOADING.CREATURE_SPEED * delta / 1000;
    const moving = sprite.x < this.#tipX() - 1;
    if (moving) sprite.x = Math.min(this.#tipX(), sprite.x + step);
    sprite.y = this.#restY(time, moving);

    const creature = this.#creature;
    if (!creature.FRAMES) return; // folha de animação: o clipe já está tocando
    if (creature.HOP) {
      sprite.setTexture(creature.FRAMES[this.#hopHeight(time, moving) > 2 ? 1 : 0]);
      return;
    }
    if (time >= this.#nextFrameAt) {
      this.#nextFrameAt = time + 1000 / creature.FPS;
      this.#frame = (this.#frame + 1) % creature.FRAMES.length;
      sprite.setTexture(creature.FRAMES[this.#frame]);
    }
  }

  /** Ponta da barra (até onde o bicho vai). */
  #tipX() {
    return this.#barX + this.#barWidth * this.#progress;
  }

  /** Altura do bicho: voando acima da barra, pulando, ou em pé em cima dela. */
  #restY(time, moving = false) {
    const creature = this.#creature;
    const half = this.#sprite ? this.#sprite.displayHeight / 2 : creature.HEIGHT / 2;
    const onBar = this.#barY - GameSettings.LOADING.BAR.HEIGHT / 2 - half + 2;
    if (creature.FLY) return onBar - 50 + Math.sin(time * 0.004) * 8;
    if (creature.HOP) return onBar - this.#hopHeight(time, moving);
    return onBar;
  }

  /** Pulinhos (só enquanto anda). */
  #hopHeight(time, moving) {
    return moving ? Math.abs(Math.sin(time * 0.009)) * 26 : 0;
  }

  /** O sprite do bicho, no tamanho certo e virado para a direita (para onde a barra cresce). */
  #createCreature() {
    const scene = this.#scene;
    const creature = this.#creature;
    let sprite;
    if (creature.SHEET) {
      LoadingShowcase.#sheets()[creature.SHEET].register(scene);
      sprite = scene.add.sprite(0, 0, creature.SHEET, 0).play(creature.CLIP);
    } else {
      sprite = scene.add.sprite(0, 0, creature.FRAMES[0]);
    }
    sprite.setScale(creature.HEIGHT / sprite.height);
    sprite.setFlipX(!creature.FACES_RIGHT); // a maioria dos desenhos olha para a esquerda
    return sprite;
  }
}
