/**
 * seamless_texture.js
 * -----------------------------------------------------------------------------
 * Gera versões "SEM EMENDA" das imagens de fundo, ao carregar o jogo.
 *
 * Problema: o fundo rola repetindo a imagem lado a lado; se a borda direita
 * não combina com a esquerda, aparece um CORTE vertical passando na tela.
 *
 * Solução: a faixa final da imagem é misturada gradualmente (crossfade) com
 * o começo dela. Assim o fim da imagem nova "continua" exatamente no começo
 * e a repetição fica contínua, dando a impressão de cenário infinito.
 * -----------------------------------------------------------------------------
 */
class SeamlessTexture {
  constructor() {
    throw new TypeError('SeamlessTexture é estático e não deve ser instanciado.');
  }

  /**
   * Substitui a textura `key` por uma versão que repete sem corte.
   * @param {Phaser.Scene} scene
   * @param {string} key textura carregada
   * @param {number} blendRatio fração da largura usada na mistura (0 a 0.5)
   */
  static makeSeamless(scene, key, blendRatio = 0.3) {
    const textures = scene.textures;
    const source = textures.get(key).getSourceImage();
    const width = source.width;
    const height = source.height;
    const blend = Math.floor(width * blendRatio);
    const outWidth = width - blend;

    const canvas = document.createElement('canvas');
    canvas.width = outWidth;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Parte "intocada" da imagem
    ctx.drawImage(source, 0, 0, outWidth, height, 0, 0, outWidth, height);

    // Transição: em cada coluna, o fim da imagem vai dando lugar ao começo
    for (let x = 0; x < blend; x++) {
      const t = x / (blend - 1);
      const weight = t * t * (3 - 2 * t); // suavização (smoothstep)
      ctx.globalAlpha = 1;
      ctx.drawImage(source, outWidth + x, 0, 1, height, x, 0, 1, height);
      ctx.globalAlpha = weight;
      ctx.drawImage(source, x, 0, 1, height, x, 0, 1, height);
    }
    ctx.globalAlpha = 1;

    // Troca a textura original pela versão sem emenda (mesma chave)
    textures.remove(key);
    textures.addCanvas(key, canvas);
  }
}
