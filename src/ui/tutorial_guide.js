/**
 * tutorial_guide.js
 * -----------------------------------------------------------------------------
 * Dicas do TUTORIAL (TUTORIAL no arquivo da fase), quase sem texto:
 *   - HINTS: conforme o jogador anda, aparece no alto da tela o desenho das
 *     TECLAS configuradas (as do jogador 1 "ou" as do 2; com 2 jogadores, cada
 *     um com a sua cor) e uma palavra: andar, pular, bater, especial...
 *   - MOBS: quando um bicho novo aparece na tela, o jogo dá uma PAUSINHA e
 *     mostra um cartão com o desenho dele, o nome, uma dica curta e a tecla
 *     de bater. Some sozinho (ou apertando qualquer tecla).
 * -----------------------------------------------------------------------------
 */
class TutorialGuide {
  #scene;
  #tutorial;
  #coop;
  #nextHint = 0;
  #hint = null;        // dica na tela agora
  #hintEndsAt = 0;
  #nextMob = 0;
  #holding = false;    // apresentando um bicho: o jogo espera

  /**
   * @param {Phaser.Scene} scene
   * @param {{HINTS: object[], MOBS: object[]}} tutorial TUTORIAL da fase
   * @param {boolean} coop com 2 jogadores mostra as teclas de cada um com a sua cor
   */
  constructor(scene, tutorial, coop) {
    this.#scene = scene;
    this.#tutorial = tutorial;
    this.#coop = coop;
  }

  /** Apresentando um bicho (o jogo fica parado esperando)? */
  get isHolding() {
    return this.#holding;
  }

  /**
   * Mostra a próxima dica quando o jogador chega nela e apresenta os bichos
   * quando eles aparecem na tela (chamar a cada frame).
   * @param {number} frontX o jogador mais à frente
   */
  update(frontX) {
    if (this.#holding) return;
    const now = this.#scene.time.now;
    const { HINTS, MOBS } = this.#tutorial;
    const cfg = GameSettings.TUTORIAL;

    const hint = HINTS[this.#nextHint];
    if (hint && frontX >= hint.X) {
      this.#nextHint++;
      this.#showHint(hint, now);
    } else if (this.#hint && now >= this.#hintEndsAt) {
      this.#fadeOut(this.#hint);
      this.#hint = null;
    }

    const mob = MOBS[this.#nextMob];
    if (mob && this.#scene.cameras.main.worldView.right >= mob.X + cfg.MOB_VISIBLE_MARGIN) {
      this.#nextMob++;
      this.#introduce(mob);
    }
  }

  /** Troca a dica do alto da tela. */
  #showHint(hint, now) {
    if (this.#hint) this.#fadeOut(this.#hint);
    const cfg = GameSettings.TUTORIAL;
    this.#hint = this.#panel(cfg.HINT_Y, [...this.#keyGroups(hint.ACTIONS), this.#word(hint.TEXT, 12, '#ffe066')]);
    this.#hintEndsAt = now + cfg.HINT_MS;
    this.#hint.setAlpha(0);
    this.#scene.tweens.add({ targets: this.#hint, alpha: 1, duration: 200 });
  }

  /**
   * Pausinha com o cartão do bicho: desenho, nome, dica curta e a tecla.
   * @param {{TYPE: string, TIP: string, ACTIONS: string[]}} mob
   */
  #introduce(mob) {
    const scene = this.#scene;
    const cfg = GameSettings.TUTORIAL;
    const type = ENEMY_TYPES[mob.TYPE];
    this.#holding = true;
    scene.physics.pause();

    const { WIDTH, HEIGHT } = GameSettings.SCREEN;
    const card = scene.add.container(WIDTH / 2, HEIGHT / 2 + 12).setScrollFactor(0).setDepth(GameSettings.HUD.DEPTH + 1);
    const picture = scene.add.image(0, -48, type.FRAMES[0]);
    picture.setScale(cfg.MOB_PICTURE_HEIGHT / picture.height);
    if (type.TINT) picture.setTint(type.TINT);
    const name = scene.add.text(0, 2, type.NAME, UiStyle.text(16, '#ffe066')).setOrigin(0.5);
    const tip = scene.add.text(0, 30, mob.TIP, UiStyle.text(10)).setOrigin(0.5);
    const keys = this.#row([...this.#keyGroups(mob.ACTIONS), this.#word('bater', 10, '#ffe066')]).setY(62);
    const width = Math.max(260, tip.width + 40, keys.getData('width') + 40);
    const back = scene.add.graphics()
      .fillStyle(0x1a1020, 0.8).fillRoundedRect(-width / 2, -100, width, 190, 12)
      .lineStyle(3, 0xffe066, 0.9).strokeRoundedRect(-width / 2, -100, width, 190, 12);
    card.add([back, picture, name, tip, keys]);
    card.setScale(0.6).setAlpha(0);
    scene.tweens.add({ targets: card, scale: 1, alpha: 1, duration: 220, ease: 'Back.easeOut' });

    const close = () => {
      if (!this.#holding) return;
      this.#holding = false;
      scene.physics.resume();
      this.#fadeOut(card);
    };
    scene.time.delayedCall(cfg.MOB_CARD_MS, close);
    scene.time.delayedCall(cfg.MOB_SKIP_AFTER_MS, () => scene.input.keyboard.once('keydown', close));
  }

  /** Some devagar e se destrói. */
  #fadeOut(target) {
    this.#scene.tweens.add({ targets: target, alpha: 0, duration: 300, onComplete: () => target.destroy() });
  }

  /** Painel escuro no alto da tela com uma linha de peças (teclas e palavras). */
  #panel(y, parts) {
    const scene = this.#scene;
    const row = this.#row(parts);
    const width = row.getData('width') + 28;
    const back = scene.add.graphics().fillStyle(0x1a1020, 0.55).fillRoundedRect(-width / 2, -24, width, 48, 10);
    return scene.add.container(GameSettings.SCREEN.WIDTH / 2, y, [back, row])
      .setScrollFactor(0)
      .setDepth(GameSettings.HUD.DEPTH);
  }

  /** Coloca as peças lado a lado, centralizadas (a largura total fica em data 'width'). */
  #row(parts) {
    const gap = 8;
    const width = parts.reduce((sum, part) => sum + part.getData('width'), 0) + gap * (parts.length - 1);
    let x = -width / 2;
    parts.forEach(part => {
      part.setX(x + part.getData('width') / 2);
      x += part.getData('width') + gap;
    });
    return this.#scene.add.container(0, 0, parts).setData('width', width);
  }

  /**
   * As teclas das ações para cada jogador: sozinho, as do jogador 1 "ou" as
   * do 2 (as duas valem); com 2 jogadores, cada grupo com a cor do jogador.
   */
  #keyGroups(actions) {
    const parts = [];
    [0, 1].forEach(slot => {
      const keys = KeyBindings.forPlayer(slot);
      if (this.#coop) parts.push(this.#word(`J${slot + 1}`, 9, Phaser.Display.Color.IntegerToColor(GameSettings.PARTY.COLORS[slot]).rgba));
      else if (slot === 1) parts.push(this.#word('ou', 9, '#cfc6b0'));
      actions.forEach(action => parts.push(this.#keyCap(keys[action])));
    });
    return parts;
  }

  /** Uma palavra curta (peça da linha). */
  #word(content, size, color) {
    const text = this.#scene.add.text(0, 0, content, UiStyle.text(size, color)).setOrigin(0.5);
    return this.#scene.add.container(0, 0, [text]).setData('width', text.width);
  }

  /** Desenho de uma tecla: setas viram triângulos; o resto, o nome da tecla. */
  #keyCap(keyName) {
    const scene = this.#scene;
    const arrows = { LEFT: 180, RIGHT: 0, UP: 270, DOWN: 90 };
    const isArrow = keyName in arrows;
    const label = isArrow ? null : scene.add.text(0, -1, KeyBindings.label(keyName), UiStyle.text(9, '#1a1020'))
      .setStroke('#1a1020', 0).setOrigin(0.5);
    const width = Math.max(30, label ? label.width + 14 : 30);
    const height = 30;
    const cap = scene.add.graphics()
      .fillStyle(0x8f8470, 1).fillRoundedRect(-width / 2, -height / 2 + 3, width, height, 6)   // lateral (3D)
      .fillStyle(0xf2ead8, 1).fillRoundedRect(-width / 2, -height / 2, width, height - 3, 6)
      .lineStyle(2, 0x1a1020, 1).strokeRoundedRect(-width / 2, -height / 2, width, height, 6);
    const parts = [cap];
    if (label) parts.push(label);
    else {
      const angle = Phaser.Math.DegToRad(arrows[keyName]);
      const point = (radius, turn) => ({ x: Math.cos(angle + turn) * radius, y: Math.sin(angle + turn) * radius - 2 });
      const [tip, left, right] = [point(8, 0), point(7, 2.4), point(7, -2.4)];
      parts.push(scene.add.graphics().fillStyle(0x1a1020, 1).fillTriangle(tip.x, tip.y, left.x, left.y, right.x, right.y));
    }
    return scene.add.container(0, 0, parts).setData('width', width);
  }
}
