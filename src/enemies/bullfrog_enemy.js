/**
 * bullfrog_enemy.js
 * -----------------------------------------------------------------------------
 * Sapo-Boi (pântano): grandão e pesado, pula alto e devagar. Quando cai no
 * chão faz um TREMOR: a tela treme, duas ondas de lama correm pelo chão e
 * quem estiver de pé no chão perto dele é jogado para longe (pule na hora
 * em que ele cair para escapar!).
 * -----------------------------------------------------------------------------
 */
class BullfrogEnemy extends HopperEnemy {
  #jumped = false; // está no ar por causa de um pulo (não da queda ao nascer)

  /** @override Pula como sapo; ao cair do pulo, tremor. */
  behave(time, player) {
    const body = this.sprite.body;
    if (!body.blocked.down && body.velocity.y < 0) this.#jumped = true;
    if (body.blocked.down && this.#jumped) {
      this.#jumped = false;
      this.#quake(player);
    }
    super.behave(time, player);
  }

  /** Caiu de barriga: ondas de lama para os dois lados e um empurrão em quem está no chão perto. */
  #quake(player) {
    const cfg = this.type.QUAKE;
    const scene = this.scene;
    const groundY = this.sprite.body.bottom;
    [-1, 1].forEach(side => {
      const wave = scene.add.ellipse(this.x, groundY - 3, 18, 8, cfg.COLOR, 0.85).setDepth(GameSettings.ENEMY.DEPTH + 0.2);
      scene.tweens.add({
        targets: wave, x: this.x + side * cfg.RADIUS, alpha: 0, scaleY: 0.5, duration: 400, ease: 'Quad.easeOut',
        onComplete: () => wave.destroy()
      });
    });
    scene.cameras.main.shake(160, 0.006);

    const onGroundNear = player.sprite.body.blocked.down &&
      Math.abs(player.x - this.x) < cfg.RADIUS && Math.abs(player.feetY - groundY) < 30;
    if (onGroundNear) player.pushBack(Math.sign(player.x - this.x) || 1, cfg.FORCE);
  }
}
