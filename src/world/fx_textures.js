/**
 * fx_textures.js
 * -----------------------------------------------------------------------------
 * Texturas de EFEITOS gerados por código (não precisam de arquivo):
 *   - fx_glow:  brilho redondo e suave (aura das bolas de fogo)
 *   - fx_spark: faísca pequena e macia (rastro de partículas do fogo)
 *   - fx_ice_wave:  espinhos de gelo (onda do terremoto do Urso Polar)
 *   - fx_snowball:  bola de neve (o urso vira uma quando é derrotado)
 *   - fx_ice_block: bloco de gelo transparente (jogador congelado)
 *   - fx_icicle:    pino de gelo pontudo (cai do céu na luta do urso)
 *   - fx_shield:    escudinho azul-claro (defesa do agachar)
 *   - fx_note:      nota musical (a nota encantada do bardo e os aliados)
 *   - fx_speaker:   alto-falante (botão de ligar/desligar os sons)
 *
 * fx_glow, fx_spark e fx_note são brancas: a cor é aplicada com "tint" na hora de usar.
 * -----------------------------------------------------------------------------
 */
const FxTextureKeys = Object.freeze({
  GLOW: 'fx_glow',
  SPARK: 'fx_spark',
  ICE_WAVE: 'fx_ice_wave',
  SNOWBALL: 'fx_snowball',
  ICE_BLOCK: 'fx_ice_block',
  ICICLE: 'fx_icicle',
  SHIELD: 'fx_shield',
  RAIN: 'fx_rain',     // gota de chuva comprida (tempestade)
  LEAF: 'fx_leaf',     // folhinha voando no vento (tempestade)
  NOTE: 'fx_note',     // nota musical (bardo)
  SPEAKER: 'fx_speaker' // alto-falante (botão dos sons)
});

class FxTextures {
  constructor() {
    throw new TypeError('FxTextures é estático e não deve ser instanciado.');
  }

  /** Cria todas as texturas de efeito (chamar uma vez, ao carregar o jogo). */
  static createAll(scene) {
    FxTextures.#radial(scene, FxTextureKeys.GLOW, 64, [[0, 1], [0.35, 0.55], [1, 0]]);
    FxTextures.#radial(scene, FxTextureKeys.SPARK, 16, [[0, 1], [0.5, 0.8], [1, 0]]);
    FxTextures.#iceWave(scene, FxTextureKeys.ICE_WAVE);
    FxTextures.#snowball(scene, FxTextureKeys.SNOWBALL);
    FxTextures.#iceBlock(scene, FxTextureKeys.ICE_BLOCK);
    FxTextures.#icicle(scene, FxTextureKeys.ICICLE);
    FxTextures.#shield(scene, FxTextureKeys.SHIELD);
    FxTextures.#rain(scene, FxTextureKeys.RAIN);
    FxTextures.#leaf(scene, FxTextureKeys.LEAF);
    FxTextures.#note(scene, FxTextureKeys.NOTE);
    FxTextures.#speaker(scene, FxTextureKeys.SPEAKER);
  }

  /** Alto-falante com duas ondas de som; branco com contorno escuro. */
  static #speaker(scene, key) {
    if (scene.textures.exists(key)) return;
    const texture = scene.textures.createCanvas(key, 24, 20);
    const ctx = texture.getContext();
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#2a1a30';
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); // caixinha e cone
    ctx.moveTo(2, 7);
    ctx.lineTo(6, 7);
    ctx.lineTo(11, 2);
    ctx.lineTo(11, 18);
    ctx.lineTo(6, 13);
    ctx.lineTo(2, 13);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    [[4, -0.9, 0.9], [8, -0.95, 0.95]].forEach(([radius, from, to]) => { // ondas
      ctx.beginPath();
      ctx.arc(12, 10, radius + 2, from, to);
      ctx.stroke();
    });
    texture.refresh();
  }

  /** Colcheia (♪): cabeça inclinada, haste e bandeirinha; branca com contorno escuro. */
  static #note(scene, key) {
    if (scene.textures.exists(key)) return;
    const texture = scene.textures.createCanvas(key, 24, 30);
    const ctx = texture.getContext();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#2a1a30';
    ctx.fillStyle = '#ffffff';
    ctx.lineJoin = 'round';
    // haste e bandeirinha
    ctx.beginPath();
    ctx.moveTo(13, 22);
    ctx.lineTo(13, 3);
    ctx.quadraticCurveTo(22, 7, 21, 16);
    ctx.quadraticCurveTo(20, 11, 16, 10);
    ctx.lineTo(16, 22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // cabeça
    ctx.save();
    ctx.translate(9.5, 23);
    ctx.rotate(-0.4);
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    texture.refresh();
  }

  /** Gota de chuva: risquinho vertical, transparente em cima e claro embaixo. */
  static #rain(scene, key) {
    if (scene.textures.exists(key)) return;
    const texture = scene.textures.createCanvas(key, 3, 24);
    const ctx = texture.getContext();
    const gradient = ctx.createLinearGradient(0, 0, 0, 24);
    gradient.addColorStop(0, 'rgba(200,220,255,0)');
    gradient.addColorStop(1, 'rgba(225,238,255,0.9)');
    ctx.fillStyle = gradient;
    ctx.fillRect(1, 0, 1, 24);
    ctx.fillStyle = 'rgba(200,220,255,0.35)';
    ctx.fillRect(0, 12, 3, 12);
    texture.refresh();
  }

  /** Folhinha escura (voa nas rajadas de vento). */
  static #leaf(scene, key) {
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({ add: false });
    g.fillStyle(0x2e5a30, 1).fillEllipse(5, 3, 10, 5);
    g.fillStyle(0x4a7a3a, 1).fillEllipse(4, 2, 5, 2);
    g.generateTexture(key, 10, 6);
    g.destroy();
  }

  /** Escudinho de cavaleiro (borda reta em cima e ponta embaixo) com uma cruz. */
  static #shield(scene, key) {
    if (scene.textures.exists(key)) return;
    const texture = scene.textures.createCanvas(key, 36, 42);
    const ctx = texture.getContext();
    ctx.beginPath();
    ctx.moveTo(4, 5);
    ctx.quadraticCurveTo(18, 0, 32, 5);   // borda de cima
    ctx.lineTo(32, 20);
    ctx.quadraticCurveTo(31, 33, 18, 40); // lado direito até a ponta
    ctx.quadraticCurveTo(5, 33, 4, 20);   // lado esquerdo
    ctx.closePath();
    const gradient = ctx.createLinearGradient(0, 0, 36, 42);
    gradient.addColorStop(0, '#e8f7ff');
    gradient.addColorStop(1, '#6fb8ff');
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(18, 8); ctx.lineTo(18, 34);
    ctx.moveTo(10, 16); ctx.lineTo(26, 16);
    ctx.strokeStyle = 'rgba(42, 95, 158, 0.8)';
    ctx.stroke();
    texture.refresh();
  }

  /** Pino de gelo (estalactite) com a ponta para baixo. */
  static #icicle(scene, key) {
    if (scene.textures.exists(key)) return;
    const texture = scene.textures.createCanvas(key, 24, 44);
    const ctx = texture.getContext();
    ctx.beginPath();
    ctx.moveTo(2, 2); ctx.lineTo(22, 2); ctx.lineTo(13, 42); ctx.lineTo(11, 42); ctx.closePath();
    const gradient = ctx.createLinearGradient(0, 0, 24, 0);
    gradient.addColorStop(0, '#e9fbff');
    gradient.addColorStop(0.5, '#a8e4ff');
    gradient.addColorStop(1, '#5fb4e6');
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#2a5f9e';
    ctx.stroke();
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(7, 6); ctx.lineTo(11, 30); ctx.stroke();
    texture.refresh();
  }

  /** Três espinhos de gelo com contorno azul e brilho branco. */
  static #iceWave(scene, key) {
    if (scene.textures.exists(key)) return;
    const texture = scene.textures.createCanvas(key, 44, 40);
    const ctx = texture.getContext();
    const spikes = [[3, 40, 11, 14, 19, 40], [13, 40, 23, 2, 33, 40], [27, 40, 34, 18, 41, 40]];
    spikes.forEach(([x0, y0, x1, y1, x2, y2]) => {
      ctx.beginPath();
      ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.closePath();
      ctx.fillStyle = '#bdefff';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#2f7fb8';
      ctx.stroke();
      // brilho na face esquerda do espinho
      ctx.beginPath();
      ctx.moveTo(x1, y1 + 4); ctx.lineTo((x0 + x1) / 2 + 2, (y0 + y1) / 2 + 4);
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    });
    texture.refresh();
  }

  /** Bola de neve com sombra azulada e contorno. */
  static #snowball(scene, key) {
    if (scene.textures.exists(key)) return;
    const size = 40;
    const texture = scene.textures.createCanvas(key, size, size);
    const ctx = texture.getContext();
    const gradient = ctx.createRadialGradient(15, 13, 2, 20, 20, 19);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.6, '#eaf8ff');
    gradient.addColorStop(1, '#a9d9f2');
    ctx.beginPath();
    ctx.arc(20, 20, 18, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#4f9fcf';
    ctx.stroke();
    ctx.fillStyle = '#cbe9f8';
    [[26, 26, 3], [12, 27, 2], [27, 12, 2]].forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); });
    texture.refresh();
  }

  /** Bloco de gelo translúcido com reflexos. */
  static #iceBlock(scene, key) {
    if (scene.textures.exists(key)) return;
    const texture = scene.textures.createCanvas(key, 48, 64);
    const ctx = texture.getContext();
    ctx.fillStyle = 'rgba(160, 225, 255, 0.45)';
    ctx.fillRect(2, 2, 44, 60);
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(235, 250, 255, 0.95)';
    ctx.strokeRect(2, 2, 44, 60);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(9, 14); ctx.lineTo(20, 6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(9, 24); ctx.lineTo(30, 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(30, 56); ctx.lineTo(40, 48); ctx.stroke();
    texture.refresh();
  }

  /**
   * Círculo branco com degradê radial de transparência.
   * @param {Array<[number, number]>} stops pares [posição 0..1, opacidade]
   */
  static #radial(scene, key, size, stops) {
    if (scene.textures.exists(key)) return;
    const texture = scene.textures.createCanvas(key, size, size);
    const ctx = texture.getContext();
    const half = size / 2;
    const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
    stops.forEach(([position, alpha]) => gradient.addColorStop(position, `rgba(255,255,255,${alpha})`));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    texture.refresh();
  }
}
