/**
 * smoke_bomb_special.js
 * -----------------------------------------------------------------------------
 * Especial do NINJA — "Bomba de Fumaça": puf! ele some numa nuvem e fica
 * quase invisível por 3 segundos: nada machuca ele e TODO golpe de katana
 * vira furtivo (dano dobrado). Dá para andar, pular e atacar normalmente;
 * vai deixando fiapos de fumaça e reaparece com outro puf.
 * -----------------------------------------------------------------------------
 */
class SmokeBombSpecial extends PlayerSpecial {
  #katana;
  #smoke;
  #nextWispAt = 0;

  /**
   * @param {Player} player
   * @param {InputController} input
   * @param {KatanaAttack} katana a katana do ninja (fica furtiva)
   */
  constructor(player, input, katana) {
    super(player, input);
    this.#katana = katana;
    this.#smoke = player.scene.add.particles(FxTextureKeys.GLOW).setDepth(GameSettings.PLAYER.DEPTH + 0.3)
      .createEmitter({
        on: false,
        lifespan: 700,
        speed: { min: 20, max: 110 },
        scale: { start: 0.35, end: 0.9 },
        alpha: { start: 0.75, end: 0 },
        tint: [0x6a6478, 0x8a8498, 0x4e4a5a]
      });
  }

  /** @override */
  get name() { return 'Bomba de Fumaça'; }

  /** @override */
  get durationMs() { return GameSettings.SPECIAL.SMOKE_BOMB.DURATION_MS; }

  /** @override Escondido ele continua atacando (e cada golpe é furtivo). */
  get blocksAttack() { return false; }

  /** @override Puf: some na fumaça. */
  start() {
    const cfg = GameSettings.SPECIAL.SMOKE_BOMB;
    const player = this.player;
    const sprite = player.sprite;
    this.#smoke.explode(cfg.PUFF, player.x, player.y);
    SoundFx.play(player.scene, SoundKeys.SMOKE);
    player.health.grantInvulnerability(cfg.DURATION_MS);
    this.#katana.ambushFor(cfg.DURATION_MS);
    sprite.setAlpha(cfg.ALPHA).setTint(cfg.TINT);
    this.#nextWispAt = 0;
    player.scene.time.delayedCall(cfg.DURATION_MS, () => {
      if (!sprite.active) return;
      sprite.setAlpha(1).clearTint();
      if (player.isKnockedOut) return;
      this.#smoke.explode(cfg.PUFF / 2, player.x, player.y); // reaparece
      SoundFx.play(player.scene, SoundKeys.SMOKE, { volume: 0.5, detune: 300 });
    });
  }

  /** @override Continua quase invisível (mesmo se estava piscando de um dano) e solta fiapos de fumaça. */
  whileActive(combat, now) {
    const cfg = GameSettings.SPECIAL.SMOKE_BOMB;
    this.player.sprite.setAlpha(cfg.ALPHA);
    if (now < this.#nextWispAt) return;
    this.#nextWispAt = now + cfg.WISP_EVERY_MS;
    this.#smoke.explode(2, this.player.x, this.player.y + 6);
  }
}
