/**
 * charmed_ally.js
 * -----------------------------------------------------------------------------
 * Um bicho ENCANTADO pela nota do Bardo: vira ALIADO.
 *   - flutua atrás do bardo, dançando, com uma notinha em cima da cabeça;
 *   - quando aparece um bicho (ou o chefão) perto do bardo, voa até ele e
 *     bate — com dano bem menor que o dos jogadores;
 *   - ninguém acerta ele e ele não machuca ninguém (sai do combate);
 *   - ficou longe demais (ou preso em algum lugar), reaparece do lado do bardo.
 * Fica até o fim da fase — ou até o bardo encantar mais um que o limite: aí o
 * mais antigo vai embora feliz, num brilho (dismiss).
 * -----------------------------------------------------------------------------
 */
class CharmedAlly {
  #enemy;
  #bard;
  #combat;
  #slot;
  #marker;
  #nextHitAt = 0;
  #recoilUntil = 0;
  #leaving = false;

  /**
   * @param {Enemy} enemy o bicho encantado
   * @param {Player} bard quem encantou (o aliado segue ele)
   * @param {CombatRegistry} combat de onde saem os alvos
   * @param {number} slot posição atrás do bardo (0 = mais perto)
   */
  constructor(enemy, bard, combat, slot) {
    const cfg = GameSettings.ALLY;
    this.#enemy = enemy;
    this.#bard = bard;
    this.#combat = combat;
    this.#slot = slot;

    combat.unregister(enemy); // os jogadores não acertam mais ele (nem se machucam nele)
    enemy.charm(this);
    const sprite = enemy.sprite;
    sprite.body.enable = true;
    sprite.body.setAllowGravity(false);
    sprite.body.setVelocity(0, 0);
    sprite.setAlpha(1).setTint(cfg.TINT);
    this.#marker = enemy.scene.add.image(sprite.x, sprite.y, FxTextureKeys.NOTE)
      .setScale(cfg.MARKER.SCALE).setTint(cfg.MARKER.TINT).setDepth(sprite.depth + 0.1);
  }

  /** Ainda está no jogo (não foi embora)? */
  get isActive() {
    return !this.#leaving && this.#enemy.isAlive;
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
      if (target) this.#attack(target, time);
      else this.#follow(time);
    }
    // a arte dos bichos encantáveis olha para a esquerda
    if (Math.abs(sprite.body.velocity.x) > 5) sprite.setFlipX(sprite.body.velocity.x > 0);
    this.#marker.setPosition(sprite.x, sprite.y - sprite.displayHeight / 2 - cfg.MARKER.Y + Math.sin(time * 0.006) * 2);
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
    enemy.scene.tweens.add({
      targets: sprite, y: sprite.y - 30, alpha: 0, scaleX: sprite.scaleX * 0.4, scaleY: sprite.scaleY * 0.4,
      duration: 420, onComplete: () => enemy.destroy()
    });
  }

  /** O bicho (ou chefão) mais perto dele, desde que esteja perto do bardo. Árvore não conta. */
  #pickTarget() {
    const { SIGHT } = GameSettings.ALLY;
    const sprite = this.#enemy.sprite;
    const bard = this.#bard;
    let best = null;
    let bestDistance = Infinity;
    this.#combat.targets.forEach(target => {
      if (target instanceof Player || target instanceof BreakableTree) return;
      if (Phaser.Math.Distance.Between(target.x, target.y, bard.x, bard.y) > SIGHT) return;
      const distance = Phaser.Math.Distance.Between(target.x, target.y, sprite.x, sprite.y);
      if (distance < bestDistance) {
        best = target;
        bestDistance = distance;
      }
    });
    return best;
  }

  /** Voa até o alvo e, encostando, bate (de tempos em tempos) e recua um pouquinho. */
  #attack(target, time) {
    const cfg = GameSettings.ALLY;
    const sprite = this.#enemy.sprite;
    const dx = target.x - sprite.x;
    const dy = target.y - sprite.y;
    const distance = Math.hypot(dx, dy) || 1;
    const targetBody = target.sprite.body;
    const reach = (targetBody ? targetBody.halfWidth : 16) + sprite.body.halfWidth + 4;
    if (distance <= reach && time >= this.#nextHitAt) {
      this.#nextHitAt = time + cfg.HIT_MS;
      this.#recoilUntil = time + 160;
      target.takeHit(this.#enemy, cfg.DAMAGE);
      sprite.body.setVelocity(-dx / distance * cfg.RECOIL, -dy / distance * cfg.RECOIL);
      return;
    }
    sprite.body.setVelocity(dx / distance * cfg.SPEED, dy / distance * cfg.SPEED);
  }

  /** Sem ninguém por perto: flutua atrás do bardo, dançando. */
  #follow(time) {
    const { FOLLOW, SPEED } = GameSettings.ALLY;
    const bard = this.#bard;
    const behind = bard.facingRight ? -1 : 1;
    const x = bard.x + behind * (FOLLOW.X + this.#slot * FOLLOW.GAP);
    const y = bard.y + FOLLOW.Y + Math.sin(time * 0.005 + this.#slot * 2) * FOLLOW.BOB;
    const sprite = this.#enemy.sprite;
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

  /** Reaparece do lado do bardo, com um brilho onde estava e onde chegou. */
  #rejoin() {
    const { FOLLOW } = GameSettings.ALLY;
    const sprite = this.#enemy.sprite;
    const bard = this.#bard;
    CharmedAlly.#sparkle(this.#enemy.scene, sprite.x, sprite.y);
    sprite.body.reset(bard.x + (bard.facingRight ? -1 : 1) * FOLLOW.X, bard.y + FOLLOW.Y);
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
