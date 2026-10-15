/**
 * fireball_pool.js
 * -----------------------------------------------------------------------------
 * Bolas de fogo/gelo/magia lançadas pelos chefões.
 *
 * Direção: a arte tem o núcleo da bola embaixo à esquerda e o rastro subindo
 * para a direita. Para o rastro ficar sempre PARA TRÁS do movimento, o ponto
 * de origem do sprite fica no núcleo e o sprite gira pela diferença entre a
 * direção do movimento e a direção "desenhada" na arte. A hitbox (que não
 * gira no Arcade Physics) fica centrada no núcleo.
 *
 * Efeitos (para parecer fogo de verdade):
 *   - brilho (aura) pulsante atrás da bola, com mistura aditiva
 *   - chama tremulando: tamanho e ângulo variam um pouco o tempo todo
 *   - rastro de faíscas (partículas) que se apagam ao ficar para trás
 * Cada tipo de projétil tem suas cores (GameSettings.FIREBALL.COLORS).
 * -----------------------------------------------------------------------------
 */
class FireballPool extends ProjectilePool {
  #particles;

  /** @param {Phaser.Scene} scene */
  constructor(scene) {
    super(scene);
    this.#particles = scene.add.particles(FxTextureKeys.SPARK).setDepth(GameSettings.BOSS.DEPTH + 0.3);
  }

  /** @override */
  configure(fireball, angleRad) {
    const cfg = GameSettings.FIREBALL;
    const frame = fireball.frame;
    const colors = cfg.COLORS[fireball.texture.key] || cfg.COLORS.bola_fogo;

    fireball.setScale(cfg.SCALE);
    fireball.setOrigin(cfg.CORE_ORIGIN.X, cfg.CORE_ORIGIN.Y);
    fireball.setDepth(GameSettings.BOSS.DEPTH + 0.4);

    const baseRotation = angleRad - cfg.ART_DIRECTION_RAD;
    fireball.setRotation(baseRotation);
    fireball.setData('baseRotation', baseRotation);
    fireball.setData('seed', Math.random() * 1000);
    fireball.setData('sparkColors', colors.SPARKS);

    // Hitbox quadrada centrada no núcleo (coordenadas da imagem original)
    const coreX = frame.realWidth * cfg.CORE_ORIGIN.X;
    const coreY = frame.realHeight * cfg.CORE_ORIGIN.Y;
    fireball.body.setSize(cfg.BODY_SIZE, cfg.BODY_SIZE, false);
    fireball.body.setOffset(coreX - cfg.BODY_SIZE / 2, coreY - cfg.BODY_SIZE / 2);

    this.#attachGlow(fireball, colors.GLOW);
    this.#attachTrail(fireball);
  }

  /** @override Chama tremulando + brilho pulsando. */
  updateProjectile(fireball, time) {
    const cfg = GameSettings.FIREBALL;
    const seed = fireball.getData('seed');

    const flicker = Math.sin(time * 0.031 + seed) * 0.6 + (Math.random() - 0.5) * 0.8;
    fireball.setScale(cfg.SCALE * (1 + flicker * cfg.FLICKER_SCALE));
    fireball.setRotation(fireball.getData('baseRotation') +
      Phaser.Math.DegToRad(Math.sin(time * 0.02 + seed) * cfg.FLICKER_ANGLE_DEG));

    const glow = fireball.getData('glow');
    glow.setPosition(fireball.x, fireball.y);
    glow.setScale(cfg.GLOW_SCALE * (1 + Math.sin(time * 0.025 + seed) * 0.18));
  }

  /** @override Apaga o brilho e para o rastro. */
  onRecycle(fireball) {
    const glow = fireball.getData('glow');
    if (glow) glow.setVisible(false);
    const trail = fireball.getData('trail');
    if (trail) {
      trail.stop();
      trail.stopFollow();
    }
  }

  /** Aura brilhante atrás da bola (reaproveitada junto com a bola). */
  #attachGlow(fireball, color) {
    let glow = fireball.getData('glow');
    if (!glow) {
      glow = this.scene.add.image(fireball.x, fireball.y, FxTextureKeys.GLOW)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(GameSettings.BOSS.DEPTH + 0.35);
      fireball.setData('glow', glow);
    }
    glow.setTint(color).setAlpha(0.8).setVisible(true).setPosition(fireball.x, fireball.y);
  }

  /** Rastro de faíscas que segue a bola (reaproveitado junto com a bola). */
  #attachTrail(fireball) {
    let trail = fireball.getData('trail');
    if (!trail) {
      const cfg = GameSettings.FIREBALL;
      trail = this.#particles.createEmitter({
        speed: { min: 8, max: 40 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.6, end: 0 },
        alpha: { start: 0.95, end: 0 },
        lifespan: { min: cfg.TRAIL_LIFESPAN_MS * 0.6, max: cfg.TRAIL_LIFESPAN_MS },
        frequency: cfg.TRAIL_FREQUENCY_MS,
        quantity: 1,
        blendMode: 'ADD',
        // A cor de cada faísca é sorteada entre as cores do tipo da bola
        tint: { onEmit: () => Phaser.Utils.Array.GetRandom(fireball.getData('sparkColors')) }
      });
      fireball.setData('trail', trail);
    }
    trail.startFollow(fireball);
    trail.start();
  }
}
