/**
 * thrown_hammer.js
 * -----------------------------------------------------------------------------
 * O MARTELO do Viking depois de arremessado:
 *   - voa GIRANDO em arco e acerta tudo que encontrar no caminho (cada alvo
 *     uma vez por arremesso); na árvore ele bate e volta um pouquinho;
 *   - ao cair no chão (ou numa ilha) faz um TREMOR: a tela treme, sobe
 *     poeira e quem estiver no chão perto leva dano;
 *   - fica lá, de cabeça no chão, até o viking PASSAR POR CIMA e pegar;
 *   - nunca se perde: nas laterais do mundo — e da arena do chefão, que é a
 *     tela inteira — ele bate e volta; se cair num buraco ou numa lagoa, ou
 *     ficar largado tempo demais (ou longe demais), volta voando para a mão.
 * -----------------------------------------------------------------------------
 */
const HammerState = Object.freeze({
  HELD: 'HELD',           // na mão do viking (o sprite fica escondido)
  FLYING: 'FLYING',       // girando no ar
  LANDED: 'LANDED',       // no chão, esperando ser pego
  RETURNING: 'RETURNING'  // voltando sozinho para a mão (atravessa tudo)
});

class ThrownHammer {
  #player;
  #sprite;
  #state = HammerState.HELD;
  #combat = null;
  #levelMap = null;
  #hit = new Set();  // quem já levou neste arremesso
  #spin = 1;         // sentido do giro (o do arremesso)
  #groundY = 0;      // chão onde ele caiu
  #returnAt = 0;     // largado: volta sozinho neste momento
  #dust;
  #trail;

  /** @param {Player} player o viking dono do martelo */
  constructor(player) {
    const cfg = GameSettings.HAMMER_ATTACK;
    const scene = player.scene;
    this.#player = player;

    this.#sprite = scene.physics.add.sprite(player.x, player.y, cfg.TEXTURE).setScale(cfg.SCALE).setDepth(cfg.DEPTH);
    // corpo redondo no meio do desenho (o martelo gira; o corpo não)
    const { realWidth: width, realHeight: height } = this.#sprite.frame;
    const radius = width * 0.42;
    this.#sprite.body.setCircle(radius, width / 2 - radius, height / 2 - radius);
    this.#sprite.setCollideWorldBounds(true).setBounce(cfg.BOUNCE_X, 0);
    this.#sprite.disableBody(false, true);

    const particles = texture => scene.add.particles(texture).setDepth(cfg.DEPTH + 0.1);
    this.#dust = particles(FxTextureKeys.GLOW).createEmitter({
      on: false,
      lifespan: 520,
      speed: { min: 30, max: 120 },
      angle: { min: 200, max: 340 },  // espirra para cima e para os lados
      gravityY: 260,
      scale: { start: 0.32, end: 0.6 },
      alpha: { start: 0.7, end: 0 },
      tint: [cfg.QUAKE.COLOR, 0xb8a888, 0xe8dcc0]
    });
    // rastro brilhante quando volta voando sozinho (como o martelo de um deus nórdico)
    this.#trail = particles(FxTextureKeys.SPARK).createEmitter({
      on: false,
      lifespan: 280,
      speed: { min: 5, max: 25 },
      frequency: 25,
      scale: { start: 0.9, end: 0 },
      alpha: { start: 0.8, end: 0 },
      tint: [0xffffff, 0xbfe4ff]
    });
    this.#trail.startFollow(this.#sprite);
  }

  /** Está na mão do viking? */
  get isHeld() {
    return this.#state === HammerState.HELD;
  }

  /**
   * Liga as colisões: acerta os alvos no voo e pousa no chão e nas ilhas.
   * @param {CombatRegistry} combat
   * @param {LevelMap} levelMap
   */
  bind(combat, levelMap) {
    const physics = this.#player.scene.physics.add;
    this.#combat = combat;
    this.#levelMap = levelMap;
    const flying = () => this.#state === HammerState.FLYING;
    physics.overlap(this.#sprite, combat.hitboxes, (_hammer, part) => this.#strike(part.getData('owner')), flying);
    physics.collider(this.#sprite, levelMap.solids, () => this.#onTerrain(), flying);
    physics.collider(this.#sprite, levelMap.platforms, () => this.#onTerrain(), flying);
  }

  /**
   * Arremessa da mão do viking.
   * @param {number} direction 1 = para a direita, -1 = para a esquerda
   */
  throw(direction) {
    const cfg = GameSettings.HAMMER_ATTACK;
    const player = this.#player;
    const sprite = this.#sprite;
    this.#state = HammerState.FLYING;
    this.#spin = direction;
    this.#hit.clear();

    sprite.enableBody(true, player.x + direction * cfg.HAND.X, player.y + cfg.HAND.Y, true, true);
    sprite.setFlipX(direction < 0).setRotation(direction * 0.7); // começa inclinado, como na mão
    sprite.body.setAllowGravity(true);
    sprite.body.setGravityY(cfg.GRAVITY - GameSettings.PHYSICS.GRAVITY_Y);
    sprite.setVelocity(direction * cfg.THROW_SPEED_X, cfg.THROW_SPEED_Y);
    player.useTextures('UNARMED');
    SoundFx.play(player.scene, SoundKeys.HAMMER);
  }

  /** Chama o martelo de volta: vem voando para a mão, atravessando tudo. */
  recall() {
    if (this.#state === HammerState.HELD || this.#state === HammerState.RETURNING) return;
    this.#state = HammerState.RETURNING;
    this.#sprite.body.stop();
    this.#sprite.body.enable = false;
    this.#trail.start();
  }

  /** Giro no ar, pegar do chão e a volta sozinho (chamar a cada frame). */
  update() {
    const scene = this.#player.scene;
    const seconds = scene.game.loop.delta / 1000;
    if (this.#state === HammerState.FLYING) this.#fly(seconds);
    else if (this.#state === HammerState.LANDED) this.#lie(scene.time.now);
    else if (this.#state === HammerState.RETURNING) this.#comeBack(seconds);
  }

  // ------------------------------------------------------------- no ar

  #fly(seconds) {
    const sprite = this.#sprite;
    sprite.rotation += this.#spin * GameSettings.HAMMER_ATTACK.SPIN_SPEED * seconds;
    if (sprite.y > GameSettings.LEVEL.PIT_Y) this.recall(); // caiu num buraco
  }

  /** Acertou alguém no caminho (cada um só uma vez por arremesso; não acerta o próprio viking). */
  #strike(target) {
    const cfg = GameSettings.HAMMER_ATTACK;
    if (!target || target === this.#player || !target.canBeHit || this.#hit.has(target)) return;
    this.#hit.add(target);
    target.takeHit(this.#sprite, cfg.HIT_DAMAGE);
    // árvore: bate e volta um pouquinho (cai do lado do viking)
    if (target instanceof BreakableTree) this.#sprite.body.velocity.x *= -cfg.TREE_BOUNCE;
  }

  /** Bateu no terreno: por cima, pousa; de lado (paredão), só cai. */
  #onTerrain() {
    const body = this.#sprite.body;
    if (body.blocked.down || body.touching.down) this.#land();
  }

  /** Caiu de cabeça no chão: fica fincado, com o cabo para cima, e a terra treme. */
  #land() {
    const cfg = GameSettings.HAMMER_ATTACK;
    const sprite = this.#sprite;
    const now = this.#player.scene.time.now;
    this.#groundY = sprite.body.bottom;
    this.#state = HammerState.LANDED;
    this.#returnAt = now + cfg.RETURN.AFTER_MS;
    sprite.body.stop();
    sprite.body.enable = false;
    sprite.setRotation(Math.PI + Phaser.Math.FloatBetween(-0.15, 0.15));
    sprite.y = this.#groundY - sprite.displayHeight / 2 + cfg.EMBED;

    const water = this.#levelMap.waterAt(sprite.x);
    if (water && this.#groundY > water.surfaceY) {
      this.#returnAt = now + cfg.RETURN.WATER_MS; // afundou na lagoa: volta voando
      return;
    }
    this.#quake(sprite.x, this.#groundY);
  }

  /** Tremor: a tela treme, poeira e ondas para os lados, e dano em quem está no chão perto. */
  #quake(x, groundY) {
    const cfg = GameSettings.HAMMER_ATTACK.QUAKE;
    const scene = this.#player.scene;
    scene.cameras.main.shake(cfg.SHAKE_MS, cfg.SHAKE_INTENSITY);
    SoundFx.play(scene, SoundKeys.QUAKE);
    this.#dust.explode(cfg.DUST, x, groundY - 2);
    [-1, 1].forEach(side => {
      const wave = scene.add.ellipse(x, groundY - 3, 16, 7, cfg.COLOR, 0.85).setDepth(GameSettings.ENEMY.DEPTH + 0.2);
      scene.tweens.add({
        targets: wave, x: x + side * cfg.RADIUS_X, alpha: 0, scaleY: 0.5, duration: 380, ease: 'Quad.easeOut',
        onComplete: () => wave.destroy()
      });
    });
    // o tremor é nos bichos (e no rival, no 1v1); o parceiro, com 2 jogadores, não leva
    this.#combat.targets
      .filter(target => this.#player.isFoe(target) && ThrownHammer.#onGroundNear(target, x, groundY))
      .forEach(target => target.takeHit({ x, y: groundY }, cfg.DAMAGE));
  }

  /** Está no chão perto do tremor? (bicho voando não sente) */
  static #onGroundNear(target, x, groundY) {
    const cfg = GameSettings.HAMMER_ATTACK.QUAKE;
    const body = target.sprite.body;
    const halfWidth = body ? body.halfWidth : 0;
    const bottom = body ? body.bottom : target.y;
    return Math.abs(target.x - x) < cfg.RADIUS_X + halfWidth && Math.abs(bottom - groundY) < cfg.RADIUS_Y;
  }

  // ------------------------------------------------------------- no chão

  /** Largado no chão: o viking passa por cima e pega; esquecido (ou fora do mundo), volta sozinho. */
  #lie(now) {
    const cfg = GameSettings.HAMMER_ATTACK;
    const player = this.#player;
    const sprite = this.#sprite;
    const outside = !player.scene.physics.world.bounds.contains(sprite.x, sprite.y); // ex.: ficou fora da arena
    if (now >= this.#returnAt || outside || Math.abs(player.x - sprite.x) > cfg.RETURN.DISTANCE) {
      this.recall();
      return;
    }
    if (player.isKnockedOut || !player.isAlive) return;
    const over = Math.abs(player.x - sprite.x) < cfg.PICKUP.RANGE_X &&
      Math.abs(player.feetY - this.#groundY) < cfg.PICKUP.RANGE_Y;
    if (over) this.#catch();
  }

  // ------------------------------------------------------------- voltando

  /** Voa reto para a mão do viking, girando. */
  #comeBack(seconds) {
    const cfg = GameSettings.HAMMER_ATTACK;
    const player = this.#player;
    const sprite = this.#sprite;
    const handX = player.x + (player.facingRight ? 1 : -1) * cfg.HAND.X;
    const handY = player.y + cfg.HAND.Y;
    const distance = Phaser.Math.Distance.Between(sprite.x, sprite.y, handX, handY);
    sprite.rotation += this.#spin * cfg.SPIN_SPEED * seconds;
    if (distance <= cfg.RETURN.CATCH_RANGE) {
      this.#catch();
      return;
    }
    const step = Math.min(distance, cfg.RETURN.SPEED * seconds);
    sprite.x += (handX - sprite.x) / distance * step;
    sprite.y += (handY - sprite.y) / distance * step;
  }

  /** De volta na mão (o desenho volta a ser o viking com o martelo). */
  #catch() {
    const cfg = GameSettings.HAMMER_ATTACK;
    const player = this.#player;
    const scene = player.scene;
    this.#state = HammerState.HELD;
    this.#trail.stop();
    this.#sprite.disableBody(false, true);
    player.useTextures(null);
    SoundFx.play(scene, SoundKeys.SHIELD, { volume: 0.4, detune: 700 }); // "plim" do metal na mão
    // brilhinho na mão
    const x = player.x + (player.facingRight ? 1 : -1) * cfg.HAND.X;
    const glint = scene.add.image(x, player.y + cfg.HAND.Y, FxTextureKeys.GLOW)
      .setScale(0.15).setTint(0xdfefff).setDepth(GameSettings.PLAYER.DEPTH + 0.1);
    scene.tweens.add({ targets: glint, scale: 0.45, alpha: 0, duration: 220, onComplete: () => glint.destroy() });
  }
}
