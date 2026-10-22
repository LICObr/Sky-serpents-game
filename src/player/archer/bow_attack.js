/**
 * bow_attack.js
 * -----------------------------------------------------------------------------
 * Arco da Arqueira: dispara uma flecha na direção em que ela está virada.
 *   - a flecha acerta o primeiro alvo atingível que tocar;
 *   - se bater no terreno (chão, paredão, ilha), fica cravada e vira uma
 *     plataformazinha (veja ArrowPool).
 * -----------------------------------------------------------------------------
 */
class BowAttack extends PlayerAttack {
  #arrows;

  /**
   * @param {Player} player
   * @param {InputController} input
   */
  constructor(player, input) {
    const cfg = GameSettings.BOW_ATTACK;
    super(player, input, { cooldownMs: cfg.COOLDOWN_MS, poseDurationMs: cfg.POSE_DURATION_MS });
    this.#arrows = new ArrowPool(player.scene);
  }

  /** @override Plataformas das flechas cravadas. */
  get platforms() {
    return this.#arrows.platforms;
  }

  /** @override Uma flecha para frente. */
  perform() {
    this.fireArrow(this.player.facingRight ? 0 : Math.PI);
    SoundFx.play(this.player.scene, SoundKeys.BOW);
  }

  /**
   * Dispara uma flecha numa direção (usado também pelo especial).
   * @param {number} angleRad direção em radianos (0 = direita)
   */
  fireArrow(angleRad) {
    const cfg = GameSettings.BOW_ATTACK;
    const player = this.player;
    this.#arrows.spawn(
      player.x + Math.cos(angleRad) * cfg.ARROW_OFFSET_X,
      player.y + cfg.ARROW_OFFSET_Y + Math.sin(angleRad) * cfg.ARROW_OFFSET_X,
      cfg.ARROW_TEXTURE,
      angleRad,
      cfg.ARROW_SPEED
    );
  }

  /** @override Flecha x alvos e flecha x terreno. */
  bindCollisions(combat, levelMap) {
    const physics = this.player.scene.physics.add;
    const arrows = this.#arrows;

    // Em colisões grupo x grupo o Phaser pode entregar os objetos em
    // qualquer ordem, então identificamos qual dos dois é a flecha.
    const split = (first, second) => (arrows.group.contains(first) ? [first, second] : [second, first]);

    physics.overlap(arrows.group, combat.hitboxes, (first, second) => {
      const [arrow, targetSprite] = split(first, second);
      const target = targetSprite.getData('owner');
      // a flecha não acerta quem atirou (sai de dentro dela) nem os aliados dela
      if (!arrows.isFlying(arrow) || !target || !this.player.canStrike(target) || !target.canBeHit) return;
      arrows.recycle(arrow);
      target.takeHit(arrow, GameSettings.BOW_ATTACK.DAMAGE);
    });

    // Bateu no terreno: crava
    const onTerrain = (first, second) => arrows.stick(split(first, second)[0]);
    const onlyFlying = (first, second) => arrows.isFlying(split(first, second)[0]);
    physics.collider(arrows.group, levelMap.solids, onTerrain, onlyFlying);
    // As ilhas só colidem "por cima" (para o jogador poder subir nelas pulando
    // por baixo). Para a flecha, qualquer toque vale: usa overlap, que ignora
    // esse lado único, e crava a flecha ao bater por qualquer lado.
    physics.overlap(arrows.group, levelMap.platforms, onTerrain, onlyFlying);
  }

  /** @override */
  updateProjectiles() {
    this.#arrows.update(this.player.scene.time.now);
  }
}
