/**
 * boss_factory.js
 * -----------------------------------------------------------------------------
 * Cria o chefão certo (padrão "Factory"): escolhe a CLASSE pelo tipo
 * (dragão, serpente ou urso) e o PODER ESPECIAL pelo estilo de ataque.
 * Para um chefão novo: crie a subclasse e registre aqui.
 * -----------------------------------------------------------------------------
 */
class BossFactory {
  static #bossClasses = Object.freeze({
    [BossKind.DRAGON]: DragonBoss,
    [BossKind.SERPENT]: SerpentBoss,
    [BossKind.BEAR]: PolarBearBoss
  });

  static #attackClasses = Object.freeze({
    RADIAL_BURST: RadialBurstAttack,
    DOUBLE_RING: DoubleRingAttack,
    SPIRAL: SpiralAttack,
    ICE_BALLS: IceBallAttack
  });

  constructor() {
    throw new TypeError('BossFactory é estática e não deve ser instanciada.');
  }

  /**
   * @param {Phaser.Scene} scene
   * @param {object} stats MatchConfig.boss
   * @param {BossArena} arena
   * @param {Player} target
   * @param {Phaser.Events.EventEmitter} eventBus
   * @param {FireballPool} projectiles
   * @returns {Boss}
   */
  static create(scene, stats, arena, target, eventBus, projectiles) {
    const BossClass = BossFactory.#bossClasses[stats.KIND];
    const AttackClass = BossFactory.#attackClasses[stats.ATTACK_STYLE];
    if (!BossClass) throw new RangeError(`Tipo de chefão desconhecido: ${stats.KIND}`);
    if (!AttackClass) throw new RangeError(`Estilo de ataque desconhecido: ${stats.ATTACK_STYLE}`);

    return new BossClass(scene, stats, arena, target, eventBus, projectiles, AttackClass);
  }
}
