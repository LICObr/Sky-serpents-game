/**
 * coin_wallet.js
 * -----------------------------------------------------------------------------
 * CARTEIRA de moedas: o total que o jogador já juntou, guardado no navegador
 * (localStorage) para continuar lá na próxima vez que ele abrir o jogo.
 * As moedas vão servir para comprar coisas no futuro.
 *
 * Se o navegador não deixar guardar (ex.: aba anônima), o total vale só
 * enquanto o jogo estiver aberto.
 * -----------------------------------------------------------------------------
 */
class CoinWallet {
  static #unsaved = 0; // total quando o navegador não deixa guardar

  constructor() {
    throw new TypeError('CoinWallet é estático e não deve ser instanciado.');
  }

  /** Quantas moedas o jogador tem guardadas. */
  static get total() {
    try {
      const saved = localStorage.getItem(GameSettings.COIN.STORAGE_KEY);
      return saved === null ? CoinWallet.#unsaved : Number(saved) || 0;
    } catch {
      return CoinWallet.#unsaved;
    }
  }

  /**
   * Guarda mais moedas.
   * @param {number} amount
   * @returns {number} o novo total
   */
  static add(amount) {
    const total = CoinWallet.total + amount;
    CoinWallet.#unsaved = total;
    try {
      localStorage.setItem(GameSettings.COIN.STORAGE_KEY, String(total));
    } catch {
      // sem armazenamento: o total fica só na memória
    }
    return total;
  }
}
