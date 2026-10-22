/**
 * player_hud.js
 * -----------------------------------------------------------------------------
 * HUD de UM jogador, no canto dele (jogador 1 à esquerda, jogador 2 à
 * direita, embaixo das moedas — veja HUD.PLAYERS):
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
    const { HEARTS_X, Y, SIDE } = GameSettings.HUD.PLAYERS[player.slot];
    const { ROW_GAP } = GameSettings.HUD.COOLDOWN;
    const direction = SIDE === 'RIGHT' ? -1 : 1;
    const boxEdge = HEARTS_X - direction * 15; // caixinhas alinhadas com o primeiro coração

    new HeartsHUD(scene, player, eventBus, { x: HEARTS_X, y: Y, direction });
    // especial proibido (1v1): sem a caixinha dele, o escudinho sobe
    this.#special = player.special.isEnabled
      ? new CooldownHUD(scene, boxEdge, Y + ROW_GAP, {
        side: SIDE,
        text: KeyBindings.label(KeyBindings.forPlayer(player.slot).SPECIAL),
        remainingMs: () => player.special.remainingMs,
        totalMs: GameSettings.SPECIAL.COOLDOWN_MS,
        pulse: true
      })
      : null;
    this.#shield = new CooldownHUD(scene, boxEdge, Y + ROW_GAP * (this.#special ? 2 : 1), {
      side: SIDE,
      icon: FxTextureKeys.SHIELD,
      remainingMs: () => player.shield.remainingMs,
      totalMs: GameSettings.DUCK_SHIELD.COOLDOWN_MS
    });
  }

  /** Atualiza as recargas (chamar a cada frame). */
  update() {
    if (this.#special) this.#special.update();
    this.#shield.update();
  }
}
