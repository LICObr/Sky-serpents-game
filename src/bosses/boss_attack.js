/**
 * boss_attack.js
 * -----------------------------------------------------------------------------
 * Classe base ABSTRATA dos ataques dos chefões:
 *   1. Tiro comum: a cada frame há uma pequena chance de disparar — em
 *      direção aleatória ou mirando no jogador (SHOT.AIMED).
 *   2. Poder especial: abaixo de certa vida, de tempos em tempos há chance
 *      de usar o poder — definido pela SUBCLASSE em performSpecial():
 *        RadialBurstAttack (anel) | DoubleRingAttack (anel duplo) |
 *        SpiralAttack (espiral)
 * -----------------------------------------------------------------------------
 */
class BossAttack {
  #boss;
  #projectiles;
  #nextSpecialTime = 0;

  /**
   * @param {Boss} boss dono do ataque
   * @param {FireballPool} projectiles pool de onde saem os projéteis
   */
  constructor(boss, projectiles) {
    if (new.target === BossAttack) {
      throw new TypeError('BossAttack é abstrata: use uma subclasse (RadialBurstAttack...).');
    }
    this.#boss = boss;
    this.#projectiles = projectiles;
  }

  get boss()    { return this.#boss; }
  get special() { return this.#boss.stats.SPECIAL; }

  /** Tenta o tiro comum deste frame. */
  updateShot() {
    const shot = this.#boss.stats.SHOT;
    if (!RandomUtils.chance(shot.CHANCE_PERCENT)) return;

    const angle = shot.AIMED ? this.#aimAtTarget(shot.AIM_SPREAD_DEG) : RandomUtils.angleRad();
    this.fire(angle, shot.SPEED, shot.TEXTURE, shot.EFFECT);
  }

  /** Verifica se é hora de tentar o poder especial. */
  updateSpecial() {
    const special = this.special;
    const now = this.#boss.scene.time.now;

    if (this.#boss.health.ratio >= special.HP_RATIO_THRESHOLD) return;
    if (now <= this.#nextSpecialTime) return;

    if (RandomUtils.chance(special.CHANCE_PERCENT)) {
      this.#boss.onSpecialAttack();
      this.performSpecial();
    }
    // Próxima tentativa só depois do intervalo (acertando o sorteio ou não)
    this.#nextSpecialTime = now + special.INTERVAL_MS;
  }

  /** O poder especial. Subclasses DEVEM sobrescrever. */
  performSpecial() {
    throw new Error(`${this.constructor.name} precisa implementar performSpecial().`);
  }

  /**
   * Dispara um projétil saindo da boca do chefão.
   * @param {number} angleRad
   * @param {number} speed
   * @param {string} texture
   * @param {string} effect valor de ProjectileEffect
   */
  fire(angleRad, speed, texture, effect = ProjectileEffect.NONE) {
    if (!this.#boss.canBeHit) return; // morreu enquanto um ataque em sequência acontecia
    const { x, y } = this.#boss.mouth;
    this.fireFrom(x, y, angleRad, speed, texture, effect);
    this.#boss.onAttack();
  }

  /** Dispara um projétil a partir de um ponto qualquer (ex.: gelo caindo do céu). */
  fireFrom(x, y, angleRad, speed, texture, effect = ProjectileEffect.NONE) {
    if (!this.#boss.canBeHit) return;
    this.#projectiles.spawn(x, y, texture, angleRad, speed, { effect });
  }

  /** Dispara um anel de projéteis igualmente espaçados. */
  fireRing(count, speed, texture, effect, angleOffset = 0) {
    const step = (Math.PI * 2) / count;
    for (let i = 0; i < count; i++) this.fire(angleOffset + step * i, speed, texture, effect);
  }

  /** Ângulo até o jogador com uma pequena imprecisão. */
  #aimAtTarget(spreadDeg = 0) {
    const { x, y } = this.#boss.mouth;
    const target = this.#boss.target;
    const spread = Phaser.Math.DegToRad(Phaser.Math.FloatBetween(-spreadDeg, spreadDeg));
    return Phaser.Math.Angle.Between(x, y, target.x, target.y) + spread;
  }
}
