/**
 * drone_swarm.js
 * -----------------------------------------------------------------------------
 * Os DRONES do Operador de Drones:
 *   - drone lançado (ataque): sobe em ARCO e cai um pouco mais longe que uma
 *     flecha; a gravidade começa forte e enfraquece num ritmo sorteado, então
 *     cada lançamento cai numa de 4 distâncias; explode ao encostar em bicho, chefão, árvore ou
 *     no chão — explosão de área PEQUENA;
 *   - drone CONTROLADO (especial): paira no ar e o jogador pilota com as
 *     setas por alguns segundos; quando o tempo acaba (ou ao apertar o
 *     ataque) ele mergulha e explode com uma explosão GRANDE. Encostou em
 *     alguém (ou no chão) antes disso, explode na hora; as ilhas flutuantes
 *     ele atravessa enquanto é pilotado.
 *
 * A explosão acerta quem é inimigo (bichos, chefões e o rival no 1v1); o
 * parceiro no modo 2 jogadores não leva dano da explosão.
 * -----------------------------------------------------------------------------
 */
const DroneMode = Object.freeze({
  THROWN: 'THROWN',        // lançado em arco
  STEERED: 'STEERED',      // pilotado pelo jogador
  DIVING: 'DIVING'         // o tempo acabou: caindo para explodir
});

class DroneSwarm {
  #player;
  #group;
  #combat = null;
  #levelMap = null;
  #controlled = null;      // o drone do especial (só um por vez)
  #sparks;
  #smoke;

  /** @param {Player} player o operador */
  constructor(player) {
    const scene = player.scene;
    this.#player = player;
    this.#group = scene.physics.add.group();

    const depth = GameSettings.PLAYER.DEPTH + 0.3;
    this.#sparks = scene.add.particles(FxTextureKeys.SPARK).setDepth(depth + 0.1).createEmitter({
      on: false,
      lifespan: { min: 250, max: 520 },
      speed: { min: 80, max: 320 },
      angle: { min: 0, max: 360 },
      gravityY: 380,
      scale: { start: 1.1, end: 0 },
      blendMode: 'ADD',
      tint: [0xfff1a8, 0xffb347, 0xff6a00, 0xffffff]
    });
    this.#smoke = scene.add.particles(FxTextureKeys.GLOW).setDepth(depth).createEmitter({
      on: false,
      lifespan: { min: 600, max: 1000 },
      speed: { min: 15, max: 60 },
      angle: { min: 230, max: 310 },   // sobe
      scale: { start: 0.25, end: 0.7 },
      alpha: { start: 0.55, end: 0 },
      tint: [0x5a5550, 0x7a746c, 0x3e3a36]
    });
  }

  /** O drone pilotado agora (ou null). */
  get controlled() { return this.#controlled; }

  /**
   * Liga as colisões: drone x alvos e drone x terreno (explode ao encostar).
   * @param {CombatRegistry} combat
   * @param {LevelMap} levelMap
   */
  bind(combat, levelMap) {
    const physics = this.#player.scene.physics.add;
    const group = this.#group;
    this.#combat = combat;
    this.#levelMap = levelMap;
    // grupo x grupo: o Phaser pode entregar os objetos em qualquer ordem
    const droneOf = (a, b) => (group.contains(a) ? a : b);
    const otherOf = (a, b) => (group.contains(a) ? b : a);
    physics.overlap(group, combat.hitboxes, (a, b) => {
      const owner = otherOf(a, b).getData('owner');
      if (owner && this.#player.isFoe(owner) && owner.canBeHit) this.#detonate(droneOf(a, b));
    });
    const hitGround = (a, b) => this.#detonate(droneOf(a, b));
    physics.collider(group, levelMap.solids, hitGround, (a, b) => droneOf(a, b).active);
    // as ilhas flutuantes o drone PILOTADO atravessa (dá para voar entre elas); os outros explodem nelas
    physics.collider(group, levelMap.platforms, hitGround,
      (a, b) => droneOf(a, b).active && droneOf(a, b).getData('mode') !== DroneMode.STEERED);
  }

  /**
   * Lança um drone em arco para a frente.
   * @param {number} direction 1 = direita, -1 = esquerda
   */
  launch(direction) {
    const cfg = GameSettings.DRONE_ATTACK;
    const player = this.#player;
    const drone = this.#spawn(player.x + direction * cfg.HAND.X, player.y + cfg.HAND.Y, DroneMode.THROWN);
    drone.setFlipX(direction < 0);
    drone.body.setAllowGravity(true);
    drone.setData('launchedAt', player.scene.time.now);
    drone.setData('fadeMs', Phaser.Utils.Array.GetRandom(cfg.GRAVITY.FADE_MS)); // sorteia a distância
    this.#applyGravity(drone, player.scene.time.now);
    drone.setVelocity(direction * cfg.LAUNCH_SPEED_X, cfg.LAUNCH_SPEED_Y);
    SoundFx.play(player.scene, SoundKeys.HAMMER, { volume: 0.7, detune: 700 });
  }

  /** Solta o drone do especial, pairando acima do operador. */
  launchControlled() {
    const cfg = GameSettings.SPECIAL.DRONE_CONTROL;
    const player = this.#player;
    const drone = this.#spawn(player.x, player.y + cfg.START_Y, DroneMode.STEERED);
    drone.setScale(GameSettings.DRONE_ATTACK.SCALE * cfg.SCALE_MULTIPLIER);
    drone.setData('baseScale', drone.scaleY);
    drone.setData('until', player.scene.time.now + cfg.CONTROL_MS);  // depois disso ele mergulha sozinho
    drone.body.setAllowGravity(false);
    drone.setVelocity(0, 0);
    this.#controlled = drone;
    SoundFx.play(player.scene, SoundKeys.HAMMER, { volume: 0.8, detune: 400 });
  }

  /**
   * Pilota o drone do especial.
   * @param {number} dx -1, 0 ou 1
   * @param {number} dy -1, 0 ou 1
   */
  steer(dx, dy) {
    const drone = this.#controlled;
    if (!drone || drone.getData('mode') !== DroneMode.STEERED) return;
    const speed = GameSettings.SPECIAL.DRONE_CONTROL.SPEED;
    const length = Math.hypot(dx, dy) || 1;
    drone.setVelocity((dx / length) * speed, (dy / length) * speed);
    if (dx !== 0) drone.setFlipX(dx < 0);
  }

  /** Acabou o controle (tempo ou ataque): o drone do especial mergulha (e explode ao bater). */
  dive() {
    const drone = this.#controlled;
    if (!drone || drone.getData('mode') !== DroneMode.STEERED) return;
    const cfg = GameSettings.SPECIAL.DRONE_CONTROL;
    drone.setData('mode', DroneMode.DIVING);
    drone.body.setAllowGravity(true);
    drone.body.setGravityY(cfg.DIVE_GRAVITY - GameSettings.PHYSICS.GRAVITY_Y);
    drone.setVelocity(drone.body.velocity.x * 0.4, cfg.DIVE_SPEED);
    this.#hideMarker(drone);
  }

  /** Hélices, inclinação, mira do drone pilotado e limites (chamar a cada frame). */
  update() {
    const scene = this.#player.scene;
    const now = scene.time.now;
    const view = scene.cameras.main.worldView;
    this.#group.getChildren().forEach(drone => {
      if (!drone.active) return;
      // hélices: o drone "vibra" de leve e inclina para onde vai
      const base = drone.getData('baseScale');
      drone.setScale(base * (1 + Math.sin(now * 0.09 + drone.getData('seed')) * 0.04), base);
      drone.setRotation(Phaser.Math.Clamp(drone.body.velocity.x / 900, -0.35, 0.35));

      if (drone.getData('mode') === DroneMode.THROWN) this.#applyGravity(drone, now);
      if (drone.getData('mode') === DroneMode.STEERED) {
        this.#keepInView(drone, view);
        this.#updateMarker(drone, now);
        if (now >= drone.getData('until')) this.dive(); // acabou o tempo de pilotar
      }
      // caiu num buraco (ou saiu muito do mapa): some sem explodir
      if (drone.y > GameSettings.LEVEL.PIT_Y) this.#remove(drone);
    });
  }

  // ------------------------------------------------------------- internos

  #spawn(x, y, mode) {
    const cfg = GameSettings.DRONE_ATTACK;
    const drone = this.#group.get(x, y, cfg.TEXTURE);
    drone.enableBody(true, x, y, true, true);
    drone.setDepth(GameSettings.PLAYER.DEPTH + 0.2).setScale(cfg.SCALE).setRotation(0).setAlpha(1);
    const { realWidth: width, realHeight: height } = drone.frame;
    const radius = width * 0.36;
    drone.body.setCircle(radius, width / 2 - radius, height / 2 - radius);    // drone + granada deitada
    drone.setCollideWorldBounds(false);
    drone.setData('mode', mode);
    drone.setData('baseScale', drone.scaleY);
    drone.setData('seed', Math.random() * 100);
    return drone;
  }

  /** Gravidade do drone lançado: forte no começo, enfraquecendo até o fim do FADE_MS sorteado. */
  #applyGravity(drone, now) {
    const { START, END } = GameSettings.DRONE_ATTACK.GRAVITY;
    const t = Math.min(1, (now - drone.getData('launchedAt')) / drone.getData('fadeMs'));
    drone.body.setGravityY(START + (END - START) * t - GameSettings.PHYSICS.GRAVITY_Y);
  }

  /** Bateu em alguém ou no chão: explode (pequena ou grande, conforme o drone). */
  #detonate(drone) {
    if (!drone.active) return;
    const big = drone.getData('mode') !== DroneMode.THROWN;
    const cfg = big ? GameSettings.SPECIAL.DRONE_CONTROL.EXPLOSION : GameSettings.DRONE_ATTACK.EXPLOSION;
    const { x, y } = drone;
    this.#remove(drone);
    this.#explode(x, y, cfg);
  }

  #remove(drone) {
    this.#hideMarker(drone);
    if (drone === this.#controlled) this.#controlled = null;
    drone.disableBody(true, true);
  }

  /** Explosão: clarão, onda de choque, faíscas, fumaça, tela tremendo e dano em área. */
  #explode(x, y, cfg) {
    const scene = this.#player.scene;
    const depth = GameSettings.PLAYER.DEPTH + 0.35;
    scene.cameras.main.shake(cfg.SHAKE_MS, cfg.SHAKE_INTENSITY);
    SoundFx.play(scene, SoundKeys.QUAKE, { volume: cfg.SOUND_VOLUME, detune: cfg.SOUND_DETUNE });

    const flash = scene.add.image(x, y, FxTextureKeys.GLOW).setTint(0xffd27a).setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(depth).setScale(0.2);
    scene.tweens.add({ targets: flash, scale: cfg.RADIUS / 22, alpha: 0, duration: 320, ease: 'Quad.easeOut', onComplete: () => flash.destroy() });
    const ring = scene.add.circle(x, y, cfg.RADIUS, 0xffb347, 0).setStrokeStyle(3, 0xffe0a0, 0.9).setDepth(depth).setScale(0.2);
    scene.tweens.add({ targets: ring, scale: 1, alpha: 0, duration: 280, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
    this.#sparks.explode(cfg.SPARKS, x, y);
    this.#smoke.explode(cfg.SMOKE, x, y);

    if (!this.#combat) return;
    this.#combat.targets
      .filter(target => this.#player.isFoe(target) && target.canBeHit && DroneSwarm.#within(target, x, y, cfg.RADIUS))
      .forEach(target => target.takeHit({ x, y }, cfg.DAMAGE));
  }

  /** O alvo está dentro do raio? (conta o tamanho do corpo dele) */
  static #within(target, x, y, radius) {
    const body = target.sprite && target.sprite.body;
    const size = body ? Math.max(body.halfWidth, body.halfHeight) : 0;
    return target.distanceFrom({ x, y }) < radius + size;
  }

  /** O drone pilotado não sai da tela. */
  #keepInView(drone, view) {
    const margin = 16;
    const x = Phaser.Math.Clamp(drone.x, view.left + margin, view.right - margin);
    const y = Phaser.Math.Clamp(drone.y, view.top + margin, view.bottom - 60);
    if (x !== drone.x || y !== drone.y) drone.body.reset(x, y);
  }

  /** Mira no chão embaixo do drone pilotado (onde ele vai cair) e a contagem em cima dele. */
  #updateMarker(drone, now) {
    const scene = this.#player.scene;
    let marker = drone.getData('marker');
    if (!marker) {
      marker = scene.add.ellipse(0, 0, 34, 10, 0xff4040, 0.15).setStrokeStyle(2, 0xff6060, 0.8)
        .setDepth(GameSettings.ENEMY.DEPTH + 0.2);
      drone.setData('marker', marker);
      drone.setData('label', scene.add.text(0, 0, '', UiStyle.text(8, '#ffe066')).setOrigin(0.5)
        .setDepth(GameSettings.PLAYER.DEPTH + 0.5));
    }
    const left = Math.max(0, drone.getData('until') - now);
    drone.getData('label').setText((left / 1000).toFixed(1)).setPosition(drone.x, drone.y - 22);
    const ground = this.#levelMap ? this.#levelMap.surfaceYAt(drone.x) : null;
    marker.setVisible(ground !== null && ground !== undefined);
    if (ground !== null && ground !== undefined) {
      marker.setPosition(drone.x, ground - 2);
      marker.setAlpha(0.6 + Math.sin(scene.time.now * 0.02) * 0.3);
    }
  }

  #hideMarker(drone) {
    ['marker', 'label'].forEach(name => {
      const part = drone.getData(name);
      if (part) part.destroy();
      drone.setData(name, null);
    });
  }
}
