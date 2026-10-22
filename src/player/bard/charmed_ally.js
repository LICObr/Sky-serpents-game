/**
 * charmed_ally.js
 * -----------------------------------------------------------------------------
 * Um bicho ENCANTADO pela nota do Bardo: vira ALIADO.
 *   - segue o bardo com uma notinha em cima da cabeça. Quem é de CHÃO
 *     continua no chão: anda atrás dele, pula obstáculos (o sapo vai pulando);
 *     quem VOA flutua atrás dele, dançando;
 *   - quando aparece um bicho (ou o chefão) perto do bardo, vai até ele e
 *     bate — com dano bem menor que o dos jogadores;
 *   - é MORTAL: tem o dobro da vida, mas encostar em bicho ou chefão machuca
 *     (os jogadores não acertam ele, e ele não machuca ninguém do time);
 *   - ficou longe demais (ou caiu num buraco), reaparece do lado do bardo.
 * Fica até morrer, até o fim da fase ou até o bardo encantar mais um que o
 * limite: aí o mais antigo vai embora feliz, num brilho (dismiss).
 * -----------------------------------------------------------------------------
 */
class CharmedAlly {
  #enemy;
  #bard;
  #combat;
  #slot;
  #flies;          // bicho que voa (senão anda no chão)
  #hops;           // sapo: anda pulando
  #marker;
  #nextHitAt = 0;
  #recoilUntil = 0;
  #hurtUntil = 0;
  #nextHopAt = 0;
  #leaving = false;

  /**
   * @param {Enemy} enemy o bicho encantado
   * @param {Player} bard quem encantou (o aliado segue ele)
   * @param {CombatRegistry} combat de onde saem os alvos
   * @param {number} slot posição atrás do bardo (0 = mais perto)
   */
  constructor(enemy, bard, combat, slot) {
    const cfg = GameSettings.ALLY;
    const behavior = enemy.type.BEHAVIOR;
    this.#enemy = enemy;
    this.#bard = bard;
    this.#combat = combat;
    this.#slot = slot;
    this.#flies = !GROUND_BEHAVIORS.includes(behavior);
    this.#hops = [EnemyBehavior.HOPPER, EnemyBehavior.BULLFROG].includes(behavior);

    combat.unregister(enemy); // os jogadores não acertam mais ele (nem se machucam nele)
    enemy.charm(this);
    const sprite = enemy.sprite;
    sprite.body.enable = true;
    sprite.body.setAllowGravity(!this.#flies);
    sprite.body.setVelocity(0, 0);
    sprite.setAlpha(1);
    this.#marker = enemy.scene.add.image(sprite.x, sprite.y, FxTextureKeys.NOTE)
      .setScale(cfg.MARKER.SCALE).setTint(cfg.MARKER.TINT).setDepth(sprite.depth + 0.1);
  }

  /** Ainda está lutando (não morreu nem foi embora)? */
  get isActive() {
    return !this.#leaving && this.#enemy.isActive;
  }

  /** Posição atrás do bardo (0 = mais perto). */
  set slot(slot) {
    this.#slot = slot;
  }

  /** Segue o bardo ou ataca quem estiver perto dele (chamado pelo Enemy.update). */
  update(time) {
    if (this.#leaving) return;
    const cfg = GameSettings.ALLY;
    const sprite = this.#enemy.sprite;
    const bard = this.#bard;
    const far = Phaser.Math.Distance.Between(sprite.x, sprite.y, bard.x, bard.y) > cfg.LEASH;
    if (far || sprite.y > GameSettings.LEVEL.PIT_Y - 40) this.#rejoin();

    if (time >= this.#recoilUntil) {
      const target = this.#pickTarget();
      if (this.#flies) this.#fly(target, time);
      else this.#walk(target, time);
    }
    this.#checkHurt(time);
    // a arte dos bichos encantáveis olha para a esquerda
    if (Math.abs(sprite.body.velocity.x) > 5) sprite.setFlipX(sprite.body.velocity.x > 0);
    this.#marker.setPosition(sprite.x, sprite.y - sprite.displayHeight / 2 - cfg.MARKER.Y + Math.sin(time * 0.006) * 2);
  }

  /** Morreu lutando (o Enemy avisa): some a notinha. */
  onDeath() {
    this.#leaving = true;
    this.#marker.destroy();
  }

  /** Vai embora feliz: sobe num brilho e some (sem contar como bicho derrotado). */
  dismiss() {
    if (this.#leaving) return;
    this.#leaving = true;
    const enemy = this.#enemy;
    const sprite = enemy.sprite;
    this.#marker.destroy();
    if (!sprite) return;
    sprite.body.enable = false;
    CharmedAlly.#sparkle(enemy.scene, sprite.x, sprite.y);
    SoundFx.play(enemy.scene, SoundKeys.CHARM, { volume: 0.5, detune: -500 });
    enemy.scene.tweens.add({
      targets: sprite, y: sprite.y - 30, alpha: 0, scaleX: sprite.scaleX * 0.4, scaleY: sprite.scaleY * 0.4,
      duration: 420, onComplete: () => enemy.destroy()
    });
  }

  // ------------------------------------------------------------- alvos

  /** O bicho (ou chefão) mais perto dele, desde que esteja perto do bardo. Árvore não conta. */
  #pickTarget() {
    const { SIGHT } = GameSettings.ALLY;
    const sprite = this.#enemy.sprite;
    const bard = this.#bard;
    let best = null;
    let bestDistance = Infinity;
    this.#foes().forEach(target => {
      if (Phaser.Math.Distance.Between(target.x, target.y, bard.x, bard.y) > SIGHT) return;
      const distance = Phaser.Math.Distance.Between(target.x, target.y, sprite.x, sprite.y);
      if (distance < bestDistance) {
        best = target;
        bestDistance = distance;
      }
    });
    return best;
  }

  /** Inimigos do time: bichos e chefões (jogadores e árvores não). */
  #foes() {
    return this.#combat.targets.filter(target => !(target instanceof Player) && !(target instanceof BreakableTree));
  }

  /** Distância para encostar no alvo (os dois corpos se tocando). */
  #reach(target) {
    const targetBody = target.sprite.body;
    return (targetBody ? targetBody.halfWidth : 16) + this.#enemy.sprite.body.halfWidth + 4;
  }

  /** Encostou no alvo: bate (de tempos em tempos) e recua um pouquinho. */
  #tryHit(target, time) {
    const cfg = GameSettings.ALLY;
    const sprite = this.#enemy.sprite;
    const dx = target.x - sprite.x;
    const dy = target.y - sprite.y;
    const distance = Math.hypot(dx, dy) || 1;
    if (distance > this.#reach(target) || time < this.#nextHitAt) return false;
    this.#nextHitAt = time + cfg.HIT_MS;
    this.#recoilUntil = time + 160;
    target.takeHit(this.#enemy, cfg.DAMAGE);
    if (this.#flies) sprite.body.setVelocity(-dx / distance * cfg.RECOIL, -dy / distance * cfg.RECOIL);
    else sprite.body.setVelocityX(-Math.sign(dx || 1) * cfg.RECOIL);
    return true;
  }

  // ------------------------------------------------------------- voando

  /** Voa até o alvo, ou flutua atrás do bardo dançando. */
  #fly(target, time) {
    const { SPEED, FOLLOW } = GameSettings.ALLY;
    const sprite = this.#enemy.sprite;
    if (target) {
      if (this.#tryHit(target, time)) return;
      const dx = target.x - sprite.x;
      const dy = target.y - sprite.y;
      const distance = Math.hypot(dx, dy) || 1;
      sprite.body.setVelocity(dx / distance * SPEED, dy / distance * SPEED);
      return;
    }
    const bard = this.#bard;
    const x = bard.x + this.#behind() * (FOLLOW.X + this.#slot * FOLLOW.GAP);
    const y = bard.y + FOLLOW.Y + Math.sin(time * 0.005 + this.#slot * 2) * FOLLOW.BOB;
    const dx = x - sprite.x;
    const dy = y - sprite.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 1) {
      sprite.body.setVelocity(0, 0);
      return;
    }
    const speed = Math.min(SPEED * 1.8, distance * 5); // chega devagarinho (e corre se ficou para trás)
    sprite.body.setVelocity(dx / distance * speed, dy / distance * speed);
  }

  // ------------------------------------------------------------- no chão

  /** Anda até o alvo (ou atrás do bardo), pulando obstáculos; o sapo vai pulando. */
  #walk(target, time) {
    const cfg = GameSettings.ALLY;
    const sprite = this.#enemy.sprite;
    const body = sprite.body;
    const onGround = body.blocked.down || body.touching.down;
    const bard = this.#bard;
    let goalX;
    let wantsJump = false;
    if (target) {
      if (this.#tryHit(target, time)) {
        if (onGround) body.setVelocityY(cfg.HOP.VELOCITY * 0.6); // pulinho do golpe
        return;
      }
      goalX = target.x;
      // alvo voando logo acima: pula para alcançar
      wantsJump = Math.abs(target.x - sprite.x) < this.#reach(target) + 12 && target.y < sprite.y - 30;
    } else {
      goalX = bard.x + this.#behind() * (cfg.FOLLOW.X + this.#slot * cfg.FOLLOW.GAP);
      // o bardo subiu numa ilha ou num morro: pula atrás
      wantsJump = bard.feetY < body.bottom - 40 && Math.abs(bard.x - sprite.x) < 140;
    }
    const dx = goalX - sprite.x;
    const speed = Math.abs(dx) < 6 ? 0 : Math.sign(dx) * cfg.WALK_SPEED * (Math.abs(dx) > 160 ? 1.5 : 1);
    body.setVelocityX(speed);
    const blocked = (speed < 0 && body.blocked.left) || (speed > 0 && body.blocked.right);
    if (!onGround) return;
    if (wantsJump || blocked) {
      body.setVelocityY(cfg.JUMP_VELOCITY);
    } else if (this.#hops && speed !== 0 && time >= this.#nextHopAt) {
      this.#nextHopAt = time + cfg.HOP.EVERY_MS;
      body.setVelocityY(cfg.HOP.VELOCITY);
    }
  }

  /** Lado de trás do bardo (-1 = esquerda). */
  #behind() {
    return this.#bard.facingRight ? -1 : 1;
  }

  // ------------------------------------------------------------- apanhar

  /** Encostado em bicho ou chefão: o aliado se machuca (de tempos em tempos). */
  #checkHurt(time) {
    const { HURT } = GameSettings.ALLY;
    if (time < this.#hurtUntil) return;
    const body = this.#enemy.sprite.body;
    for (const foe of this.#foes()) {
      const hurts = foe instanceof Boss ? foe.hurtsOnContact : foe.canHurt;
      if (!hurts) continue;
      const touching = foe.hitboxSprites.some(part =>
        part.body && Phaser.Geom.Intersects.RectangleToRectangle(part.body, body));
      if (!touching) continue;
      this.#hurtUntil = time + HURT.COOLDOWN_MS;
      this.#enemy.hurtAlly(foe, foe instanceof Boss ? HURT.BOSS : HURT.CONTACT);
      return;
    }
  }

  // ------------------------------------------------------------- reaparecer

  /** Reaparece do lado do bardo, com um brilho onde estava e onde chegou. */
  #rejoin() {
    const { FOLLOW } = GameSettings.ALLY;
    const sprite = this.#enemy.sprite;
    const bard = this.#bard;
    CharmedAlly.#sparkle(this.#enemy.scene, sprite.x, sprite.y);
    const y = this.#flies ? bard.y + FOLLOW.Y : bard.y - 10;
    sprite.body.reset(bard.x + this.#behind() * FOLLOW.X, y);
    CharmedAlly.#sparkle(this.#enemy.scene, sprite.x, sprite.y);
  }

  /** Brilho rosado com notinhas subindo. */
  static #sparkle(scene, x, y) {
    for (let i = 0; i < 4; i++) {
      const note = scene.add.image(x + Phaser.Math.Between(-10, 10), y, FxTextureKeys.NOTE)
        .setScale(0.4).setTint(Phaser.Utils.Array.GetRandom([0xffb8ec, 0xffe066, 0x9fe8ff]))
        .setDepth(GameSettings.PLAYER.DEPTH + 0.2);
      scene.tweens.add({
        targets: note, y: y - Phaser.Math.Between(24, 44), alpha: 0, delay: i * 50, duration: 520,
        onComplete: () => note.destroy()
      });
    }
  }
}
