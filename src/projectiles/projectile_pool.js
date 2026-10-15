/**
 * projectile_pool.js
 * -----------------------------------------------------------------------------
 * Classe base de "pool" (reaproveitamento) de projéteis.
 *
 * Por que pool? Criar e destruir sprites várias vezes por segundo gera lixo
 * para o coletor de memória e causa travadinhas. Aqui os projéteis que saem
 * da tela ou acertam algo são apenas desativados e reutilizados depois.
 *
 * Subclasses (FireballPool, ArrowPool) personalizam através de "ganchos":
 *   configure(p, ângulo)  → aparência e hitbox ao disparar (OBRIGATÓRIO)
 *   updateProjectile(p)   → animação a cada frame (opcional)
 *   onRecycle(p)          → limpar efeitos ao desativar (opcional)
 *   keepsWhenOffscreen(p) → não reciclar fora da tela (opcional)
 * -----------------------------------------------------------------------------
 */
class ProjectilePool {
  #scene;
  #group;

  /** @param {Phaser.Scene} scene */
  constructor(scene) {
    if (new.target === ProjectilePool) {
      throw new TypeError('ProjectilePool é abstrata: use FireballPool ou ArrowPool.');
    }
    this.#scene = scene;
    this.#group = scene.physics.add.group({ allowGravity: false });
  }

  get scene() { return this.#scene; }

  /** Grupo de física (usado para registrar colisões na cena). */
  get group() { return this.#group; }

  /**
   * Dispara um projétil.
   * @param {number} x origem
   * @param {number} y origem
   * @param {string} textureKey textura
   * @param {number} angleRad direção em radianos
   * @param {number} speed velocidade em px/s
   * @param {object} [data] informações extras guardadas no projétil (ex.: efeito)
   * @returns {Phaser.Physics.Arcade.Sprite|null}
   */
  spawn(x, y, textureKey, angleRad, speed, data = {}) {
    const projectile = this.#group.get(x, y, textureKey);
    if (!projectile) return null;

    // Reativa (caso seja um projétil reaproveitado)
    projectile.setTexture(textureKey);
    projectile.enableBody(true, x, y, true, true);
    projectile.body.setAllowGravity(false);
    projectile.body.moves = true;
    projectile.setCollideWorldBounds(false);
    projectile.setVelocity(Math.cos(angleRad) * speed, Math.sin(angleRad) * speed);
    Object.entries(data).forEach(([key, value]) => projectile.setData(key, value));

    this.configure(projectile, angleRad);
    return projectile;
  }

  /** Ajusta escala, rotação e hitbox. Subclasses DEVEM sobrescrever. */
  // eslint-disable-next-line no-unused-vars
  configure(projectile, angleRad) {
    throw new Error(`${this.constructor.name} precisa implementar configure().`);
  }

  /** Animação de um projétil ativo a cada frame (opcional). */
  // eslint-disable-next-line no-unused-vars
  updateProjectile(projectile, time) {}

  /** Limpeza extra ao desativar um projétil (opcional). */
  // eslint-disable-next-line no-unused-vars
  onRecycle(projectile) {}

  /** Projéteis que NÃO devem sumir fora da tela (opcional). */
  // eslint-disable-next-line no-unused-vars
  keepsWhenOffscreen(projectile) { return false; }

  /** Desativa o projétil e devolve ao pool. */
  recycle(projectile) {
    this.onRecycle(projectile);
    projectile.disableBody(true, true);
  }

  /** Anima os projéteis e recicla os que saíram da tela (chamar a cada frame). */
  update(time) {
    const margin = GameSettings.FIREBALL.DESPAWN_MARGIN;
    const view = this.#scene.cameras.main.worldView;

    this.#group.getChildren().forEach(projectile => {
      if (!projectile.active) return;
      const outside =
        projectile.x < view.left - margin || projectile.x > view.right + margin ||
        projectile.y < view.top - margin || projectile.y > view.bottom + margin;

      if (outside && !this.keepsWhenOffscreen(projectile)) this.recycle(projectile);
      else this.updateProjectile(projectile, time);
    });
  }
}
