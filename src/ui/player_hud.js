/**
 * player_hud.js
 * -----------------------------------------------------------------------------
 * HUD de UM jogador, no canto da tela:
 *   corações
 *   [G] especial      → PRONTO ou o tempo da recarga
 *   [escudo] defesa   → escudinho do agachar: PRONTO ou o tempo da recarga
 * -----------------------------------------------------------------------------
 */
class PlayerHUD {
  #special;
  #shield;

  /**
   * @param {Phaser.Scene} scene
   * @param {Player} player
   * @param {Phaser.Events.EventEmitter} eventBus
   */
  constructor(scene, player, eventBus) {
    const hearts = GameSettings.HUD.HEARTS;
    const { ROW_GAP } = GameSettings.HUD.COOLDOWN;
    const x = hearts.X - 15;

    new HeartsHUD(scene, player.health.maxHearts, eventBus);
    this.#special = new CooldownHUD(scene, x, hearts.Y + ROW_GAP, {
      text: KeyBindings.label(KeyBindings.forPlayer(0).SPECIAL),
      remainingMs: () => player.special.remainingMs,
      totalMs: GameSettings.SPECIAL.COOLDOWN_MS,
      pulse: true
    });
    this.#shield = new CooldownHUD(scene, x, hearts.Y + ROW_GAP * 2, {
      icon: FxTextureKeys.SHIELD,
      remainingMs: () => player.shield.remainingMs,
      totalMs: GameSettings.DUCK_SHIELD.COOLDOWN_MS
    });
  }

  /** Atualiza as recargas (chamar a cada frame). */
  update() {
    this.#special.update();
    this.#shield.update();
  }
}
