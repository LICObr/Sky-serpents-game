/**
 * key_binding_panel.js
 * -----------------------------------------------------------------------------
 * Caixinha de TECLAS de um jogador na tela de opções: uma linha por ação
 * (esquerda, direita, pular, agachar, atacar, especial) com a tecla atual.
 * A linha escolhida acende; esperando a tecla nova ela mostra "...".
 * -----------------------------------------------------------------------------
 */
class KeyBindingPanel {
  #playerIndex;
  #rows = []; // { action, box, label, key }

  /**
   * @param {Phaser.Scene} scene
   * @param {number} centerX
   * @param {number} playerIndex 0 = jogador 1, 1 = jogador 2
   * @param {Function} onRowClick (playerIndex, linha) → clicou numa linha
   */
  constructor(scene, centerX, playerIndex, onRowClick) {
    const { PANEL, ROW_GAP } = GameSettings.OPTIONS;
    const left = centerX - PANEL.WIDTH / 2;
    const right = centerX + PANEL.WIDTH / 2;
    this.#playerIndex = playerIndex;

    scene.add.rectangle(centerX, PANEL.TOP + PANEL.HEIGHT / 2, PANEL.WIDTH, PANEL.HEIGHT, 0x1a1030, 0.85)
      .setStrokeStyle(3, 0x6a5a8a);
    // título com a cor do jogador (a mesma do pontinho na barra de progresso)
    scene.add.circle(centerX - 74, PANEL.TOP + 28, 7, GameSettings.PARTY.COLORS[playerIndex]).setStrokeStyle(2, 0x1a1020);
    scene.add.text(centerX + 8, PANEL.TOP + 28, `JOGADOR ${playerIndex + 1}`, UiStyle.text(12, '#ffe066')).setOrigin(0.5);

    Object.values(ControlAction).forEach((action, row) => {
      const y = PANEL.TOP + 70 + row * ROW_GAP;
      const box = scene.add.rectangle(centerX, y, PANEL.WIDTH - 24, ROW_GAP - 6, 0xffffff, 0)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => onRowClick(playerIndex, row));
      const label = scene.add.text(left + 26, y, CONTROLS.ACTION_LABELS[action], UiStyle.text(9)).setOrigin(0, 0.5);
      const key = scene.add.text(right - 26, y, '', UiStyle.text(9)).setOrigin(1, 0.5);
      this.#rows.push({ action, box, label, key });
    });
    this.refresh();
  }

  /** Relê as teclas guardadas (uma troca pode mexer nos dois jogadores). */
  refresh() {
    const keys = KeyBindings.forPlayer(this.#playerIndex);
    this.#rows.forEach(row => row.key.setText(KeyBindings.label(keys[row.action])));
  }

  /**
   * @param {number|null} focusedRow linha escolhida (null = nenhuma desta caixinha)
   * @param {boolean} waiting esperando a tecla nova para essa linha
   */
  render(focusedRow, waiting) {
    this.#rows.forEach((row, index) => {
      const focused = index === focusedRow;
      row.box.setFillStyle(0xffffff, focused ? 0.12 : 0);
      if (focused) row.box.setStrokeStyle(2, waiting ? 0x8fd18a : 0xffe066, 0.9);
      else row.box.setStrokeStyle();
      row.label.setColor(focused ? '#ffe066' : '#c8c0e0');
      row.key.setColor(focused ? (waiting ? '#8fd18a' : '#ffe066') : '#ffffff');
    });
    if (waiting && focusedRow !== null) this.#rows[focusedRow].key.setText('...');
  }
}
