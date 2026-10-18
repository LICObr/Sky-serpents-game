/**
 * lily_pads.js
 * -----------------------------------------------------------------------------
 * VITÓRIAS-RÉGIAS (LILY_PADS no arquivo da fase): folhas gigantes boiando
 * na superfície das lagoas, que servem de plataforma para atravessar sem
 * nadar. Mas não aguentam peso por muito tempo: alguém pisou, ela BALANÇA
 * (o aviso) e AFUNDA — quem estiver em cima cai na água. Depois de um
 * tempo ela volta a boiar. Os sapos também gostam de ficar em cima delas
 * (bicho não faz afundar).
 * -----------------------------------------------------------------------------
 */
const LilyPadState = Object.freeze({
  FLOAT: 'FLOAT',
  WOBBLE: 'WOBBLE',
  SUNK: 'SUNK'
});

class LilyPads {
  #scene;
  #group;

  /**
   * @param {Phaser.Scene} scene
   * @param {number[]} xs posição de cada folha (precisa estar sobre uma lagoa)
   * @param {LevelMap} levelMap para achar a superfície da água
   */
  constructor(scene, xs, levelMap) {
    this.#scene = scene;
    this.#group = scene.physics.add.group({ allowGravity: false, immovable: true });
    xs.forEach((x, index) => {
      const lake = levelMap.waterAt(x);
      if (!lake) {
        console.warn(`[LilyPads] Vitória-régia em x=${x} fora de uma lagoa`);
        return;
      }
      this.#create(x, lake.surfaceY, index);
    });
  }

  /** Grupo de física (a cena liga as colisões). */
  get group() {
    return this.#group;
  }

  /** Um jogador pisou na folha: ela balança e depois afunda. */
  onStoodOn(pad) {
    if (pad.getData('state') !== LilyPadState.FLOAT) return;
    const cfg = GameSettings.LILY_PAD;
    pad.setData('state', LilyPadState.WOBBLE);
    const shakes = Math.floor(cfg.SINK_AFTER_MS / 160);
    this.#scene.tweens.add({ targets: pad, angle: { from: -cfg.WOBBLE_DEG, to: cfg.WOBBLE_DEG }, duration: 80, yoyo: true, repeat: shakes });
    this.#scene.time.delayedCall(cfg.SINK_AFTER_MS, () => this.#sink(pad));
  }

  /** Boiando: sobe e desce de leve (chamar a cada frame). */
  update(time) {
    const { BOB_PX } = GameSettings.LILY_PAD;
    this.#group.getChildren().forEach(pad => {
      if (pad.getData('state') === LilyPadState.SUNK) return;
      pad.y = pad.getData('baseY') + Math.sin(time * 0.002 + pad.getData('phase')) * BOB_PX;
    });
  }

  #create(x, surfaceY, index) {
    const cfg = GameSettings.LILY_PAD;
    const texture = cfg.TEXTURES[index % cfg.TEXTURES.length];
    // a borda vermelha da folha fica na linha d'água (o meio do desenho é o topo da folha)
    const baseY = surfaceY - 6;
    const pad = this.#group.create(x, baseY, texture).setScale(cfg.SCALE).setDepth(GameSettings.SWIM.DEPTH + 0.1);
    // pisável só por cima (dá para nadar por baixo e subir através dela)
    const body = pad.body;
    body.checkCollision.down = false;
    body.checkCollision.left = false;
    body.checkCollision.right = false;
    // a flor não conta: o pé fica em cima da folha
    body.setSize(pad.width, pad.height * 0.3, false).setOffset(0, pad.height * 0.5);
    pad.setData({ state: LilyPadState.FLOAT, baseY, phase: x * 0.01 });
  }

  /** Afunda (quem estava em cima cai na água) e volta depois de um tempo. */
  #sink(pad) {
    if (!pad.active) return;
    const cfg = GameSettings.LILY_PAD;
    const baseY = pad.getData('baseY');
    pad.setData('state', LilyPadState.SUNK);
    pad.body.checkCollision.up = false;
    pad.setAngle(0).setDepth(GameSettings.SWIM.DEPTH - 0.1); // por baixo da água
    WaterSplash.at(this.#scene, pad.x, baseY + 6, 8);
    this.#scene.tweens.add({ targets: pad, y: baseY + cfg.SINK_DEPTH, alpha: 0.7, duration: 350, ease: 'Quad.easeIn' });
    this.#scene.time.delayedCall(cfg.SUNK_MS, () => {
      if (!pad.active) return;
      this.#scene.tweens.add({
        targets: pad, y: baseY, alpha: 1, duration: 500, ease: 'Sine.easeOut',
        onComplete: () => {
          pad.setDepth(GameSettings.SWIM.DEPTH + 0.1);
          pad.body.checkCollision.up = true;
          pad.setData('state', LilyPadState.FLOAT);
        }
      });
    });
  }
}
