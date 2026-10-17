/**
 * arrow_pool.js
 * -----------------------------------------------------------------------------
 * Flechas disparadas pela arqueira.
 *
 *   - Têm GRAVIDADE: voam em arco e giram acompanhando a trajetória.
 *   - Ao acertar chão, paredão ou ilha, ficam CRAVADAS e viram uma pequena
 *     plataforma (só por cima) onde o jogador pode subir e pular.
 *   - Há um limite de flechas cravadas: ao passar dele, a mais antiga some.
 * -----------------------------------------------------------------------------
 */
class ArrowPool extends ProjectilePool {
  #platforms;  // plataformas criadas pelas flechas cravadas
  #stuck = []; // flechas cravadas, da mais antiga para a mais nova

  /** @param {Phaser.Scene} scene */
  constructor(scene) {
    super(scene);
    this.#platforms = scene.physics.add.staticGroup();
  }

  /** Plataformas das flechas cravadas (o jogador colide com elas). */
  get platforms() {
    return this.#platforms;
  }

  /** @override */
  configure(arrow, angleRad) {
    const cfg = GameSettings.BOW_ATTACK;
    arrow.setScale(cfg.ARROW_SCALE);
    arrow.setDepth(cfg.ARROW_DEPTH);
    arrow.setOrigin(0.5, 0.5);
    arrow.setFlipX(false);
    arrow.setRotation(angleRad); // a arte aponta para a direita
    arrow.setData('stuck', false);

    // Gravidade própria (mais suave que a do mundo)
    arrow.body.setAllowGravity(true);
    arrow.body.setGravityY(cfg.ARROW_GRAVITY - GameSettings.PHYSICS.GRAVITY_Y);
    arrow.body.setSize(arrow.frame.realWidth * 0.8, arrow.frame.realHeight, true);
  }

  /** @override A flecha aponta sempre para onde está indo. */
  updateProjectile(arrow) {
    if (arrow.getData('stuck')) return;
    const { x, y } = arrow.body.velocity;
    if (x !== 0 || y !== 0) arrow.setRotation(Math.atan2(y, x));
  }

  /** @override Flecha cravada continua no cenário mesmo fora da tela. */
  keepsWhenOffscreen(arrow) {
    return arrow.getData('stuck');
  }

  /** @override Remove a plataforma junto com a flecha. */
  onRecycle(arrow) {
    const platform = arrow.getData('platform');
    if (platform) platform.destroy();
    arrow.setData('platform', null);
    arrow.setData('stuck', false);
    this.#stuck = this.#stuck.filter(a => a !== arrow);
  }

  /** É uma flecha voando (ainda não cravou)? */
  isFlying(arrow) {
    return arrow.active && !arrow.getData('stuck');
  }

  /** Crava a flecha no terreno e cria a plataformazinha. */
  stick(arrow) {
    if (!this.isFlying(arrow)) return;
    const cfg = GameSettings.BOW_ATTACK;

    // Para a flecha e afunda a ponta um pouco no terreno
    arrow.body.stop();
    arrow.body.setAllowGravity(false);
    arrow.body.enable = false; // não acerta mais ninguém
    arrow.x += Math.cos(arrow.rotation) * cfg.STUCK_EMBED;
    arrow.y += Math.sin(arrow.rotation) * cfg.STUCK_EMBED;
    arrow.setData('stuck', true);

    // Plataforma "só por cima" do tamanho da flecha
    const { WIDTH, HEIGHT } = cfg.STUCK_PLATFORM;
    const platform = this.scene.add.zone(arrow.x, arrow.y, WIDTH, HEIGHT);
    this.#platforms.add(platform);
    platform.body.updateFromGameObject();
    platform.body.checkCollision.down = false;
    platform.body.checkCollision.left = false;
    platform.body.checkCollision.right = false;
    arrow.setData('platform', platform);

    // Limite de flechas cravadas: some a mais antiga
    this.#stuck.push(arrow);
    if (this.#stuck.length > cfg.MAX_STUCK) this.recycle(this.#stuck[0]);
  }
}
