/**
 * asset_manifest.js
 * -----------------------------------------------------------------------------
 * Lista de todos os arquivos (imagens e áudio) usados pelo jogo e a classe
 * responsável por carregá-los no Phaser.
 *
 * Os arquivos ficam organizados por "dono" dentro de assets/:
 *   personagens/guerreiro | personagens/arqueira
 *   inimigos/slime | inimigos/morcego | inimigos/fantasma
 *   chefoes/dragao_vermelho | chefoes/dragao_rosa | chefoes/serpente_glacial | chefoes/urso_polar
 *   cenario | itens | hud | audio
 *
 * Para adicionar um novo asset basta incluir uma linha na pasta certa.
 * Imagens geradas por código: veja tools/ (creature_sprites.py,
 * dragon_variants.py, archer_from_image.py).
 * As artes ORIGINAIS que as ferramentas usam ficam em source_art/ (o jogo não
 * carrega nada de lá).
 * -----------------------------------------------------------------------------
 */

/**
 * Monta as entradas de imagens de uma pasta.
 * @param {string} folder pasta dentro de assets/
 * @param {Object<string, string>} images { chave usada no código: nome do arquivo }
 */
function imagesIn(folder, images) {
  return Object.entries(images).map(([key, file]) => ({ type: 'image', key, path: `assets/${folder}/${file}` }));
}

const ASSET_MANIFEST = Object.freeze([
  // Cenário (fundos, chão e ilhas)
  ...imagesIn('cenario', {
    bg: 'fundo.png',
    bg_phase_80: 'fundo_chefao_80.png',
    bg_phase_40: 'fundo_chefao_40.png',
    platform: 'plataforma.png',
    platform_gelo: 'plataforma_gelo.png',  // ilhas na cor de cada fase (tools/terrain_variants.py)
    platform_rosa: 'plataforma_rosa.png',
    platform_selva: 'plataforma_selva.png',
    bg_selva: 'fundo_selva.png',
    chao_selva: 'chao_selva.png', terra_selva: 'terra_selva.png',
    arvore_0: 'arvore_0.png', arvore_1: 'arvore_1.png',
    bandeira: 'bandeira.png',
    chao: 'chao.png', chao_gelo: 'chao_gelo.png', chao_rosa: 'chao_rosa.png',
    terra: 'terra.png', terra_gelo: 'terra_gelo.png', terra_rosa: 'terra_rosa.png'
  }),

  // Guerreiro
  ...imagesIn('personagens/guerreiro', {
    heroi_direita: 'heroi_direita.png',
    heroi_esquerda: 'heroi_esquerda.png',
    heroi_ataque_direita: 'heroi_ataque_direita.png',
    heroi_ataque_esquerda: 'heroi_ataque_esquerda.png',
    heroi_agachado_direita: 'heroi_agachado_direita.png',
    heroi_agachado_esquerda: 'heroi_agachado_esquerda.png'
  }),

  // Arqueira
  ...imagesIn('personagens/arqueira', {
    arqueira_direita: 'arqueira_direita.png',
    arqueira_esquerda: 'arqueira_esquerda.png',
    arqueira_ataque_direita: 'arqueira_ataque_direita.png',
    arqueira_ataque_esquerda: 'arqueira_ataque_esquerda.png',
    arqueira_agachada_direita: 'arqueira_agachada_direita.png',
    arqueira_agachada_esquerda: 'arqueira_agachada_esquerda.png',
    flecha: 'flecha.png'
  }),

  // Bichos pequenos
  ...imagesIn('inimigos/slime', {
    slime_0: 'slime_0.png', slime_1: 'slime_1.png',
    slime_gelo_0: 'slime_gelo_0.png', slime_gelo_1: 'slime_gelo_1.png',
    slime_rosa_0: 'slime_rosa_0.png', slime_rosa_1: 'slime_rosa_1.png'
  }),
  ...imagesIn('inimigos/morcego', {
    morcego_0: 'morcego_0.png', morcego_1: 'morcego_1.png',
    morcego_rosa_0: 'morcego_rosa_0.png', morcego_rosa_1: 'morcego_rosa_1.png'
  }),
  ...imagesIn('inimigos/fantasma', {
    fantasma_0: 'fantasma_0.png', fantasma_1: 'fantasma_1.png'
  }),
  ...imagesIn('inimigos/sapo', { sapo_0: 'sapo_0.png', sapo_1: 'sapo_1.png' }),
  ...imagesIn('inimigos/planta', { planta_0: 'planta_0.png', planta_1: 'planta_1.png', semente: 'semente.png' }),
  ...imagesIn('inimigos/vespa', { vespa_0: 'vespa_0.png', vespa_1: 'vespa_1.png' }),
  ...imagesIn('inimigos/ourico', { ourico_0: 'ourico_0.png', ourico_1: 'ourico_1.png' }),
  ...imagesIn('inimigos/aguia', {
    aguia_0: 'aguia_0.png', aguia_1: 'aguia_1.png', aguia_mergulho: 'aguia_mergulho.png', aguia_ovo: 'aguia_ovo.png',
    aguia_chao_0: 'aguia_chao_0.png', aguia_chao_1: 'aguia_chao_1.png'
  }),

  // Chefões (cada um com o seu projétil)
  // (as animações dos dragões são carregadas por DragonSpriteSheets)
  // (*_intro = imagem da abertura da fase; geradas por tools/boss_intros.py)
  ...imagesIn('chefoes/dragao_vermelho', {
    bola_fogo: 'bola_fogo.png',
    bola_fogo_azul: 'bola_fogo_azul.png',
    dragon_red_intro: 'dragao_intro.png'
  }),
  ...imagesIn('chefoes/dragao_rosa', {
    bola_rosa: 'bola_rosa.png',
    dragon_pink_intro: 'dragao_intro.png'
  }),
  ...imagesIn('chefoes/urso_polar', { bear_intro: 'urso_intro.png' }),
  ...imagesIn('chefoes/serpente_glacial', {
    serpent_head: 'serpente_cabeca.png',
    serpent_body: 'serpente_corpo.png',
    serpent_tail: 'serpente_cauda.png',
    bola_gelo: 'bola_gelo.png',
    serpent_intro: 'serpente_intro.png'
  }),

  // Itens e HUD
  ...imagesIn('itens', { pocao: 'pocao.png' }),
  ...imagesIn('hud', { heart: 'heart.png' }),

  // Áudio
  { type: 'audio', key: 'backgroundMusic', path: 'assets/audio/music.mp3' }
]);

/**
 * Carrega todos os assets do manifesto. Classe "estática": não precisa ser
 * instanciada, basta chamar AssetLoader.load(scene) no preload da cena.
 */
class AssetLoader {
  constructor() {
    throw new TypeError('AssetLoader é estático e não deve ser instanciado.');
  }

  /**
   * @param {Phaser.Scene} scene cena cujo loader será usado
   * @param {object[]} [extraEntries] entradas adicionais (ex.: folhas dos dragões)
   */
  static load(scene, extraEntries = []) {
    [...ASSET_MANIFEST, ...extraEntries].forEach(({ type, key, path }) => {
      switch (type) {
        case 'image': scene.load.image(key, path); break;
        case 'json':  scene.load.json(key, path); break;
        case 'audio': scene.load.audio(key, path); break;
        default: console.warn(`[AssetLoader] Tipo de asset desconhecido: ${type}`);
      }
    });
  }
}
