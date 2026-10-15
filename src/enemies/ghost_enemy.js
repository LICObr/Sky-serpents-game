/**
 * ghost_enemy.js
 * -----------------------------------------------------------------------------
 * Fantasminha: voa como o morcego (herda de FlyerEnemy), mas de tempos em
 * tempos fica transparente e INTANGÍVEL — nesse momento não apanha e não
 * machuca. É preciso esperar ele reaparecer para atacar.
 * -----------------------------------------------------------------------------
 */
class GhostEnemy extends FlyerEnemy {
  #isFaded = false;
  #nextToggleTime = 0;

  /** @override */
  get canBeHit() {
    return super.canBeHit && !this.#isFaded;
  }

  /** @override Machuca enquanto estiver visível (mesmo durante o piscar). */
  get canHurt() {
    return this.canBeHit;
  }

  /** @override */
  behave(time, player) {
    this.#updateVisibility(time);
    super.behave(time, player);
  }

  /** Alterna entre visível e intangível. */
  #updateVisibility(time) {
    if (time < this.#nextToggleTime) return;

    const type = this.type;
    this.#isFaded = !this.#isFaded;
    this.#nextToggleTime = time + (this.#isFaded ? type.FADED_MS : type.VISIBLE_MS);
    this.sprite.setAlpha(this.#isFaded ? type.FADED_ALPHA : 1);
  }
}
