/**
 * heart_donation.js
 * -----------------------------------------------------------------------------
 * DOAR CORAÇÃO (modo 2 jogadores): o parceiro ficou sem corações e está
 * deitado no chão? Quem ainda tem pelo menos 2 corações pode AGACHAR em cima
 * dele: segurando agachado um instante (um coração vai enchendo em cima do
 * parceiro), passa um dos seus corações e o parceiro levanta com ele.
 * -----------------------------------------------------------------------------
 */
class HeartDonation {
  #scene;
  #party;
  #heart;           // coração que vai enchendo em cima do parceiro caído
  #donor = null;
  #fallen = null;
  #progressMs = 0;
  #lastTime = 0;

  /**
   * @param {Phaser.Scene} scene
   * @param {PlayerParty} party
   */
  constructor(scene, party) {
    this.#scene = scene;
    this.#party = party;
    this.#heart = scene.add.image(0, 0, GameSettings.HUD.HEARTS.TEXTURE)
      .setDepth(GameSettings.PLAYER.DEPTH + 0.5)
      .setVisible(false);
  }

  /** Confere quem está agachado em cima do parceiro caído (chamar a cada frame). */
  update() {
    const cfg = GameSettings.PARTY.REVIVE;
    const time = this.#scene.time.now;
    const delta = this.#lastTime ? Math.min(time - this.#lastTime, 100) : 0;
    this.#lastTime = time;

    const pair = this.#findPair();
    if (!pair) {
      this.#cancel();
      return;
    }
    if (pair.donor !== this.#donor || pair.fallen !== this.#fallen) this.#progressMs = 0;
    this.#donor = pair.donor;
    this.#fallen = pair.fallen;
    this.#progressMs += delta;

    const progress = Math.min(1, this.#progressMs / cfg.HOLD_MS);
    this.#heart.setVisible(true)
      .setPosition(pair.fallen.x, pair.fallen.y - 34 - Math.sin(time * 0.01) * 2)
      .setScale(cfg.HEART_SCALE * (0.4 + 0.8 * progress))
      .setAlpha(0.45 + 0.55 * progress);
    if (progress >= 1) this.#donate(pair);
  }

  /** Alguém agachado (com corações sobrando) em cima de um parceiro caído? */
  #findPair() {
    const cfg = GameSettings.PARTY.REVIVE;
    for (const donor of this.#party.inGame) {
      if (!donor.isDucking || donor.health.hearts < cfg.MIN_HEARTS) continue;
      const fallen = this.#party.players.find(player => player !== donor && player.isKnockedOut &&
        Math.abs(player.x - donor.x) < cfg.RANGE_X && Math.abs(player.y - donor.y) < cfg.RANGE_Y);
      if (fallen) return { donor, fallen };
    }
    return null;
  }

  /** Passa o coração: um coraçãozinho voa de um para o outro e o parceiro levanta. */
  #donate({ donor, fallen }) {
    if (!donor.health.giveHeart()) return;
    fallen.revive();
    const flying = this.#scene.add.image(donor.x, donor.y - 20, GameSettings.HUD.HEARTS.TEXTURE)
      .setScale(GameSettings.PARTY.REVIVE.HEART_SCALE)
      .setDepth(GameSettings.PLAYER.DEPTH + 0.6);
    this.#scene.tweens.add({
      targets: flying, x: fallen.x, y: fallen.y - 40, scale: flying.scale * 1.6, alpha: 0,
      duration: 500, ease: 'Sine.easeOut', onComplete: () => flying.destroy()
    });
    this.#cancel();
  }

  #cancel() {
    this.#donor = null;
    this.#fallen = null;
    this.#progressMs = 0;
    this.#heart.setVisible(false);
  }
}
