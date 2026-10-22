/**
 * thunder_special.js
 * -----------------------------------------------------------------------------
 * Especial do VIKING — "Trovão": o céu clareia, RAIOS caem um atrás do outro
 * nos bichos da tela (do mais perto ao mais longe; se tiver pouca gente, os
 * mais perto levam mais de um — o chefão sozinho leva até 3) e o MARTELO,
 * onde quer que esteja, volta voando para a mão dele.
 * Cada raio AVISA antes: um brilho no alto da tela bem em cima do lugar, uma
 * linha de luz até ele e um círculo marcando onde vai cair. Os lugares são
 * marcados na hora do especial e, um instante depois, os raios caem ali —
 * quem sair do círculo escapa (justo no 1v1).
 * -----------------------------------------------------------------------------
 */
class ThunderSpecial extends PlayerSpecial {
  #hammer;
  #sparks;
  #thundered = false; // o trovão toca no primeiro raio

  /**
   * @param {Player} player
   * @param {InputController} input
   * @param {ThrownHammer} hammer martelo do viking (volta para a mão)
   */
  constructor(player, input, hammer) {
    super(player, input);
    this.#hammer = hammer;
    this.#sparks = player.scene.add.particles(FxTextureKeys.SPARK).setDepth(GameSettings.PLAYER.DEPTH + 0.4)
      .createEmitter({
        on: false,
        lifespan: 380,
        speed: { min: 60, max: 220 },
        gravityY: 400,
        scale: { start: 1, end: 0 },
        tint: [0xffffff, 0xbfe4ff, 0x8fb0ff]
      });
  }

  /** @override */
  get name() { return 'Trovão'; }

  /** @override O martelo volta e os raios caem. */
  start(combat) {
    const cfg = GameSettings.SPECIAL.THUNDER;
    const player = this.player;
    const scene = player.scene;

    player.showPose(PlayerPose.ATTACK);
    scene.time.delayedCall(cfg.POSE_MS, () => {
      if (player.isAlive && !player.isDucking) player.showPose(PlayerPose.STAND);
    });
    this.#hammer.recall();
    this.#flash();
    this.#thundered = false;

    const targets = this.#pickTargets(combat);
    if (targets.length === 0) {
      // ninguém na tela: um raio só, no chão na frente dele
      this.#warnThenStrike(combat, player.x + (player.facingRight ? 60 : -60), player.feetY);
      return;
    }
    // os lugares ficam marcados na hora do especial: o raio não persegue ninguém
    // (saiu do círculo, escapou de todos os raios que iam cair ali)
    const spots = targets.map(target => ({ x: target.x, y: target.y }));
    spots.forEach((spot, i) => scene.time.delayedCall(i * cfg.EVERY_MS, () => this.#warnThenStrike(combat, spot.x, spot.y)));
  }

  /**
   * Aviso e raio: brilho no alto da tela bem em cima do lugar, uma linha de
   * luz fraquinha até ele e um círculo piscando onde vai cair; WARNING_MS
   * depois o raio cai ali.
   */
  #warnThenStrike(combat, x, y) {
    const cfg = GameSettings.SPECIAL.THUNDER;
    const scene = this.player.scene;
    const top = scene.cameras.main.worldView.top;
    const depth = GameSettings.PLAYER.DEPTH + 0.3;
    const glow = scene.add.image(x, top + 12, FxTextureKeys.GLOW).setTint(0xcfe0ff).setScale(0.7).setAlpha(0.3).setDepth(depth);
    const beam = scene.add.rectangle(x, (top + y) / 2, 4, Math.max(1, y - top), 0xcfe0ff, 0.12).setDepth(depth - 0.1);
    const ring = scene.add.circle(x, y, cfg.STRIKE_RADIUS, 0xcfe0ff, 0.1).setStrokeStyle(2, 0xcfe0ff, 0.8).setDepth(depth);
    const pulse = scene.tweens.add({ targets: [glow, ring], alpha: { from: 0.3, to: 1 }, duration: 110, yoyo: true, repeat: -1 });
    scene.time.delayedCall(cfg.WARNING_MS, () => {
      pulse.stop();
      [glow, beam, ring].forEach(part => part.destroy());
      this.#strike(combat, x, y);
    });
  }

  /** O raio cai: acerta quem (do outro time) ainda estiver dentro do círculo. */
  #strike(combat, x, y) {
    const cfg = GameSettings.SPECIAL.THUNDER;
    const player = this.player;
    this.#bolt(x, y);
    if (!this.#thundered) {
      this.#thundered = true;
      SoundFx.play(player.scene, SoundKeys.THUNDER);
    }
    combat.targets
      .filter(target => player.isFoe(target) && ThunderSpecial.#inside(target, x, y))
      .forEach(target => target.takeHit(player, cfg.DAMAGE));
  }

  /** Dentro do círculo do raio? (alvo grande, como o chefão, conta pela borda do corpo) */
  static #inside(target, x, y) {
    const body = target.sprite.body;
    const reach = GameSettings.SPECIAL.THUNDER.STRIKE_RADIUS + (body ? Math.min(body.halfWidth, body.halfHeight) : 0);
    return Phaser.Math.Distance.Between(target.x, target.y, x, y) <= reach;
  }

  /**
   * Alvos dos raios: os bichos da tela (e o rival, no 1v1), do mais
   * perto ao mais longe (árvores por último); sobrando raios, a lista se
   * repete (até MAX_PER_TARGET cada).
   */
  #pickTargets(combat) {
    const cfg = GameSettings.SPECIAL.THUNDER;
    const player = this.player;
    const view = player.scene.cameras.main.worldView;
    const isTree = target => (target instanceof BreakableTree ? 1 : 0);
    const onScreen = combat.targets
      .filter(target => player.isFoe(target) && view.contains(target.x, target.y))
      .sort((a, b) => isTree(a) - isTree(b) || a.distanceFrom(player) - b.distanceFrom(player));
    const picks = [];
    for (let round = 0; round < cfg.MAX_PER_TARGET; round++) {
      onScreen.forEach(target => {
        if (picks.length < cfg.BOLTS) picks.push(target);
      });
    }
    return picks;
  }

  /** Um raio do alto da tela até o ponto, com faíscas e a tela tremendo. */
  #bolt(x, y) {
    const cfg = GameSettings.SPECIAL.THUNDER;
    const scene = this.player.scene;
    const view = scene.cameras.main.worldView;
    LightningBolt.draw(scene, x + Phaser.Math.Between(-50, 50), view.top - 10, x, y, GameSettings.PLAYER.DEPTH + 0.3);
    this.#sparks.explode(14, x, y);
    scene.cameras.main.shake(cfg.SHAKE.MS, cfg.SHAKE.INTENSITY);
  }

  /** O céu clareia de repente. */
  #flash() {
    const { WIDTH, HEIGHT } = GameSettings.SCREEN;
    const scene = this.player.scene;
    const flash = scene.add.rectangle(0, 0, WIDTH, HEIGHT, 0xdfe8ff, GameSettings.SPECIAL.THUNDER.FLASH_ALPHA)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(GameSettings.HUD.DEPTH - 1);
    scene.tweens.add({ targets: flash, alpha: 0, duration: 320, ease: 'Quad.easeIn', onComplete: () => flash.destroy() });
  }
}
