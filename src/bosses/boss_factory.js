/**
 * boss_factory.js
 * -----------------------------------------------------------------------------
 * Cria o chefão certo (padrão "Factory"): escolhe a CLASSE pelo tipo
 * (dragão, serpente, urso, colmeia ou abelha) e o PODER ESPECIAL pelo estilo
 * de ataque (a colmeia não tem). Para um chefão novo: crie a subclasse e
 * registre aqui.
 * -----------------------------------------------------------------------------
 */
class BossFactory {
  static #bossClasses = Object.freeze({
    [BossKind.DRAGON]: DragonBoss,
    [BossKind.SERPENT]: SerpentBoss,
    [BossKind.BEAR]: PolarBearBoss,
    [BossKind.HIVE]: HiveBoss,
    [BossKind.BEE]: QueenBeeBoss
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
   * @param {PlayerParty} players
   * @param {Phaser.Events.EventEmitter} eventBus
   * @param {FireballPool} projectiles
   * @returns {Boss}
   */
  static create(scene, stats, arena, players, eventBus, projectiles) {
    const BossClass = BossFactory.#bossClasses[stats.KIND];
    const AttackClass = stats.ATTACK_STYLE ? BossFactory.#attackClasses[stats.ATTACK_STYLE] : null;
    if (!BossClass) throw new RangeError(`Tipo de chefão desconhecido: ${stats.KIND}`);
    if (stats.ATTACK_STYLE && !AttackClass) throw new RangeError(`Estilo de ataque desconhecido: ${stats.ATTACK_STYLE}`);

    return new BossClass(scene, stats, arena, players, eventBus, projectiles, AttackClass);
  }
}
