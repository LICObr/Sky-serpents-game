/**
 * key_bindings.js
 * -----------------------------------------------------------------------------
 * TECLAS escolhidas para cada jogador (tela de OPÇÕES), guardadas no
 * navegador. Sem nada guardado — ou se o navegador não deixar guardar —
 * valem as teclas padrão de controls.js.
 *
 *   forPlayer(i)          → { LEFT: 'A', RIGHT: 'D', ... } do jogador i
 *   inputKeys(i)          → teclas do InputController de um jogador
 *   soloInputKeys()       → jogando sozinho: as teclas dos dois jogadores
 *   assign(i, ação, tecla) → troca a tecla; se ela já era de outra ação,
 *                            as duas trocam (nunca fica tecla repetida)
 * -----------------------------------------------------------------------------
 */
class KeyBindings {
  static #unsaved = null; // escolha atual quando o navegador não deixa guardar

  constructor() {
    throw new TypeError('KeyBindings é estático e não deve ser instanciado.');
  }

  /** Teclas de um jogador: { LEFT: 'A', RIGHT: 'D', ... } (nomes do Phaser). */
  static forPlayer(index) {
    return KeyBindings.#load()[index];
  }

  /** Teclas do InputController de um jogador: cada ação → [tecla]. */
  static inputKeys(index) {
    const keys = KeyBindings.forPlayer(index);
    return KeyBindings.#perAction(action => [keys[action]]);
  }

  /** Jogando sozinho: valem as teclas dos dois jogadores (e as extras). */
  static soloInputKeys() {
    const players = KeyBindings.#load();
    return KeyBindings.#perAction(action =>
      [...players.map(keys => keys[action]), ...(CONTROLS.SOLO_EXTRAS[action] || [])]);
  }

  /**
   * Muda a tecla de uma ação de um jogador. Se a tecla já era usada por
   * outra ação (de qualquer jogador), essa outra fica com a tecla antiga.
   */
  static assign(index, action, keyName) {
    const players = KeyBindings.#load();
    const previous = players[index][action];
    players.forEach(keys => Object.keys(keys).forEach(other => {
      if (keys[other] === keyName) keys[other] = previous;
    }));
    players[index][action] = keyName;
    KeyBindings.#save(players);
  }

  /** Volta para as teclas padrão. */
  static reset() {
    KeyBindings.#save(KeyBindings.#defaults());
  }

  /** Tecla da pausa/menu (não pode virar controle)? */
  static isReserved(keyName) {
    return CONTROLS.RESERVED.includes(keyName);
  }

  /** Nome da tecla para mostrar na tela (ex.: 'SPACE' → 'ESPAÇO', 'ONE' → '1'). */
  static label(keyName) {
    if (CONTROLS.KEY_LABELS[keyName]) return CONTROLS.KEY_LABELS[keyName];
    const digits = ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
    const digit = digits.indexOf(keyName.replace('NUMPAD_', ''));
    if (digit >= 0) return keyName.startsWith('NUMPAD_') ? `NUM ${digit}` : String(digit);
    return keyName.replace(/_/g, ' ');
  }

  /** Nome do Phaser para a tecla apertada (null se for uma tecla desconhecida). */
  static nameFromCode(keyCode) {
    const codes = Phaser.Input.Keyboard.KeyCodes;
    const names = Object.keys(codes).filter(name => codes[name] === keyCode);
    return names.find(name => !name.includes('FIREFOX')) || names[0] || null;
  }

  /** Resumo das teclas para quem joga sozinho (rodapé do menu). */
  static soloHint() {
    const [first, second] = KeyBindings.#load();
    const both = action => `${KeyBindings.label(first[action])}/${KeyBindings.label(second[action])}`;
    return `${KeyBindings.#movementLabel(first)} ou ${KeyBindings.#movementLabel(second)} mover   ` +
      `${both(ControlAction.ATTACK)} atacar   ${both(ControlAction.SPECIAL)} especial`;
  }

  /** "WASD", "SETAS" ou as quatro teclas (pular, esquerda, agachar, direita). */
  static #movementLabel(keys) {
    const order = [keys.JUMP, keys.LEFT, keys.DUCK, keys.RIGHT];
    if (order.join() === 'UP,LEFT,DOWN,RIGHT') return 'SETAS';
    const labels = order.map(KeyBindings.label);
    return labels.every(label => label.length === 1) ? labels.join('') : labels.join(' ');
  }

  /** Monta { ação: valor } para todas as ações. */
  static #perAction(valueOf) {
    return Object.fromEntries(Object.values(ControlAction).map(action => [action, valueOf(action)]));
  }

  static #defaults() {
    return CONTROLS.DEFAULTS.map(keys => ({ ...keys }));
  }

  /** Teclas guardadas (cópia nova a cada chamada) ou as padrão se algo estiver errado. */
  static #load() {
    let saved = KeyBindings.#unsaved;
    try {
      const text = localStorage.getItem(CONTROLS.STORAGE_KEY);
      if (text !== null) saved = JSON.parse(text);
    } catch {
      // sem armazenamento (ou guardado quebrado): fica com o que tiver na memória
    }
    return KeyBindings.#isValid(saved) ? saved.map(keys => ({ ...keys })) : KeyBindings.#defaults();
  }

  static #save(players) {
    KeyBindings.#unsaved = players;
    try {
      localStorage.setItem(CONTROLS.STORAGE_KEY, JSON.stringify(players));
    } catch {
      // sem armazenamento: a escolha vale só enquanto o jogo estiver aberto
    }
  }

  /** Dois jogadores, todas as ações com teclas conhecidas, sem repetir e sem reservadas. */
  static #isValid(players) {
    if (!Array.isArray(players) || players.length !== CONTROLS.DEFAULTS.length) return false;
    const keys = players.flatMap(player => Object.values(ControlAction).map(action => player && player[action]));
    const known = keys.every(name => name in Phaser.Input.Keyboard.KeyCodes && !KeyBindings.isReserved(name));
    return known && new Set(keys).size === keys.length;
  }
}
