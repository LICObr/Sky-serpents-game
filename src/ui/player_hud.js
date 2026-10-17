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
    this.#special = new CooldownHUD(scene, boxEdge, Y + ROW_GAP, {
      side: SIDE,
      text: KeyBindings.label(KeyBindings.forPlayer(player.slot).SPECIAL),
      remainingMs: () => player.special.remainingMs,
      totalMs: GameSettings.SPECIAL.COOLDOWN_MS,
      pulse: true
    });
    this.#shield = new CooldownHUD(scene, boxEdge, Y + ROW_GAP * 2, {
      side: SIDE,
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
