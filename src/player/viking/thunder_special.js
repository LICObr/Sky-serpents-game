/**
 * thunder_special.js
 * -----------------------------------------------------------------------------
 * Especial do VIKING — "Trovão": o céu clareia, RAIOS caem um atrás do outro
 * nos bichos da tela (do mais perto ao mais longe; se tiver pouca gente, os
 * mais perto levam mais de um — o chefão sozinho leva até 3) e o MARTELO,
 * onde quer que esteja, volta voando para a mão dele.
 * -----------------------------------------------------------------------------
 */
class ThunderSpecial extends PlayerSpecial {
  #hammer;
  #sparks;

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
    SoundFx.play(scene, SoundKeys.THUNDER);

    const targets = this.#pickTargets(combat);
    if (targets.length === 0) {
      // ninguém na tela: um raio só, no chão na frente dele
      const x = player.x + (player.facingRight ? 60 : -60);
      this.#bolt(x, player.feetY);
      return;
    }
    targets.forEach((target, i) => scene.time.delayedCall(i * cfg.EVERY_MS, () => {
      if (!target.canBeHit) return; // já morreu com o raio anterior
      this.#bolt(target.x, target.y);
      target.takeHit(player, cfg.DAMAGE);
    }));
  }

  /**
   * Alvos dos raios: os bichos da tela, do mais perto ao mais longe (árvores
   * por último); sobrando raios, a lista se repete (até MAX_PER_TARGET cada).
   */
  #pickTargets(combat) {
    const cfg = GameSettings.SPECIAL.THUNDER;
    const player = this.player;
    const view = player.scene.cameras.main.worldView;
    const isTree = target => (target instanceof BreakableTree ? 1 : 0);
    const onScreen = combat.targets
      .filter(target => !(target instanceof Player) && view.contains(target.x, target.y))
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
