/**
 * diver_enemy.js
 * -----------------------------------------------------------------------------
 * Vespa mergulhadora: patrulha voando como o morcego (herda de FlyerEnemy).
 * Quando o jogador chega perto ela para, TREME vermelha avisando e dá um
 * RASANTE em linha reta na direção dele; depois volta a patrulhar.
 *
 *   PATROL ──(jogador perto)──▶ WARN ──(aviso)──▶ DIVE ──(tempo)──▶ PATROL
 * -----------------------------------------------------------------------------
 */
const DiverState = Object.freeze({
  PATROL: 'PATROL',
  WARN: 'WARN',
  DIVE: 'DIVE'
});

class DiverEnemy extends FlyerEnemy {
  #state = DiverState.PATROL;
  #stateEndsAt = 0;
  #nextDiveTime = 0;

  /** @override */
  behave(time, player) {
    switch (this.#state) {
      case DiverState.PATROL: this.#patrol(time, player); break;
      case DiverState.WARN:   this.#warn(time, player); break;
      case DiverState.DIVE:   this.#dive(time); break;
    }
  }

  #patrol(time, player) {
    super.behave(time, player);
    if (time >= this.#nextDiveTime && this.distanceFrom(player) < this.type.DIVE_RANGE) {
      this.#state = DiverState.WARN;
      this.#stateEndsAt = time + this.type.DIVE_WARNING_MS;
    }
  }

  /** Para no ar tremendo e piscando vermelho. */
  #warn(time, player) {
    const sprite = this.sprite;
    sprite.setVelocity(Phaser.Math.Between(-40, 40), Phaser.Math.Between(-40, 40));
    if (Math.floor(time / 70) % 2 === 0) sprite.setTint(0xff5050);
    else this.restoreTint();

    if (time < this.#stateEndsAt) return;
    const speed = this.type.DIVE_SPEED;
    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    sprite.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    sprite.setFlipX(sprite.body.velocity.x > 0);
    this.restoreTint();
    this.#state = DiverState.DIVE;
    this.#stateEndsAt = time + this.type.DIVE_MS;
  }

  /** Rasante em linha reta até o tempo acabar. */
  #dive(time) {
    if (time < this.#stateEndsAt) return;
    this.#state = DiverState.PATROL;
    this.#nextDiveTime = time + this.type.DIVE_COOLDOWN_MS;
  }
}
