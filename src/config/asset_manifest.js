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
 *   chefoes/colmeia | chefoes/abelha_rainha | chefoes/filhote_aguia
 *   cenario | itens | hud | audio
 *
 * Para adicionar um novo asset basta incluir uma linha na pasta certa.
 * Imagens geradas por código: veja tools/ (creature_sprites.py,
 * dragon_variants.py, archer_from_image.py, honey_background.py...).
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
    // fundos dos castelos (tools/castle_background.py): pôr do sol (Serpente) e neve (Urso)
    bg_por_do_sol: 'fundo_por_do_sol.png', bg_neve: 'fundo_neve.png',
    // terreno todo de neve da fase do Urso (tools/snow_terrain.py)
    chao_branco: 'chao_branco.png', terra_branca: 'terra_branca.png', platform_branca: 'plataforma_branca.png',
    chao_selva: 'chao_selva.png', terra_selva: 'terra_selva.png',
    arvore_0: 'arvore_0.png', arvore_1: 'arvore_1.png',
    arvore_campo_0: 'arvore_campo_0.png', arvore_campo_1: 'arvore_campo_1.png', // tutorial (tools/meadow_trees.py)
    bandeira: 'bandeira.png',
    chao: 'chao.png', chao_gelo: 'chao_gelo.png', chao_rosa: 'chao_rosa.png',
    terra: 'terra.png', terra_gelo: 'terra_gelo.png', terra_rosa: 'terra_rosa.png',
    // Floresta do mel (tools/honey_background.py e tools/honey_terrain.py)
    bg_mel: 'fundo_mel.png', chao_mel: 'chao_mel.png', terra_mel: 'terra_mel.png', platform_mel: 'plataforma_mel.png',
    arvore_mel_0: 'arvore_mel_0.png', arvore_mel_1: 'arvore_mel_1.png',
    // Montanha da selva (tools/tall_jungle_background.py e tools/moss_terrain.py)
    bg_selva_alta: 'fundo_selva_alta.png', chao_musgo: 'chao_musgo.png', chao_neve: 'chao_neve.png',
    platform_musgo: 'plataforma_musgo.png',
    // Caverna (tools/cave_background.py, tools/cave_terrain.py, tools/cave_creatures.py)
    bg_caverna: 'fundo_caverna.png', chao_caverna: 'chao_caverna.png', terra_caverna: 'terra_caverna.png',
    platform_caverna: 'plataforma_caverna.png', pedra_caverna: 'pedra_caverna.png',
    // Pântano (tools/swamp_background.py, tools/swamp_terrain.py, tools/swamp_creatures.py)
    bg_pantano: 'fundo_pantano.png', chao_pantano: 'chao_pantano.png', terra_pantano: 'terra_pantano.png',
    platform_pantano: 'plataforma_pantano.png', vitoria_regia: 'vitoria_regia.png',
    vitoria_regia_flor: 'vitoria_regia_flor.png', lama: 'lama.png'
  }),

  // Guerreiro
  ...imagesIn('personagens/guerreiro', {
    heroi_direita: 'heroi_direita.png',
    heroi_esquerda: 'heroi_esquerda.png',
    heroi_ataque_direita: 'heroi_ataque_direita.png',
    heroi_ataque_esquerda: 'heroi_ataque_esquerda.png',
    heroi_agachado_direita: 'heroi_agachado_direita.png',
    heroi_agachado_esquerda: 'heroi_agachado_esquerda.png',
    // caminhada e pulo (tools/walk_frames.py)
    heroi_passo_a_direita: 'heroi_passo_a_direita.png', heroi_passo_a_meio_direita: 'heroi_passo_a_meio_direita.png', heroi_passo_b_direita: 'heroi_passo_b_direita.png',
    heroi_passo_b_meio_direita: 'heroi_passo_b_meio_direita.png', heroi_pulo_direita: 'heroi_pulo_direita.png', heroi_queda_direita: 'heroi_queda_direita.png',
    heroi_passo_a_esquerda: 'heroi_passo_a_esquerda.png', heroi_passo_a_meio_esquerda: 'heroi_passo_a_meio_esquerda.png', heroi_passo_b_esquerda: 'heroi_passo_b_esquerda.png',
    heroi_passo_b_meio_esquerda: 'heroi_passo_b_meio_esquerda.png', heroi_pulo_esquerda: 'heroi_pulo_esquerda.png', heroi_queda_esquerda: 'heroi_queda_esquerda.png'
  }),

  // Arqueira
  ...imagesIn('personagens/arqueira', {
    arqueira_direita: 'arqueira_direita.png',
    arqueira_esquerda: 'arqueira_esquerda.png',
    arqueira_ataque_direita: 'arqueira_ataque_direita.png',
    arqueira_ataque_esquerda: 'arqueira_ataque_esquerda.png',
    arqueira_agachada_direita: 'arqueira_agachada_direita.png',
    arqueira_agachada_esquerda: 'arqueira_agachada_esquerda.png',
    // caminhada e pulo (tools/walk_frames.py)
    arqueira_passo_a_direita: 'arqueira_passo_a_direita.png', arqueira_passo_a_meio_direita: 'arqueira_passo_a_meio_direita.png', arqueira_passo_b_direita: 'arqueira_passo_b_direita.png',
    arqueira_passo_b_meio_direita: 'arqueira_passo_b_meio_direita.png', arqueira_pulo_direita: 'arqueira_pulo_direita.png', arqueira_queda_direita: 'arqueira_queda_direita.png',
    arqueira_passo_a_esquerda: 'arqueira_passo_a_esquerda.png', arqueira_passo_a_meio_esquerda: 'arqueira_passo_a_meio_esquerda.png', arqueira_passo_b_esquerda: 'arqueira_passo_b_esquerda.png',
    arqueira_passo_b_meio_esquerda: 'arqueira_passo_b_meio_esquerda.png', arqueira_pulo_esquerda: 'arqueira_pulo_esquerda.png', arqueira_queda_esquerda: 'arqueira_queda_esquerda.png',
    flecha: 'flecha.png'
  }),

  // Bichos pequenos
  ...imagesIn('inimigos/slime', {
    slime_0: 'slime_0.png', slime_1: 'slime_1.png',
    slime_gelo_0: 'slime_gelo_0.png', slime_gelo_1: 'slime_gelo_1.png',
    slime_rosa_0: 'slime_rosa_0.png', slime_rosa_1: 'slime_rosa_1.png'
  }),
  // bichos da caverna (tools/cave_creatures.py)
  ...imagesIn('inimigos/caverna', {
    morcego_vampiro_0: 'morcego_vampiro_0.png', morcego_vampiro_1: 'morcego_vampiro_1.png',
    morcego_sonico_0: 'morcego_sonico_0.png', morcego_sonico_1: 'morcego_sonico_1.png',
    morcego_gigante_0: 'morcego_gigante_0.png', morcego_gigante_1: 'morcego_gigante_1.png',
    centopeia_0: 'centopeia_0.png', centopeia_1: 'centopeia_1.png',
    aranha_0: 'aranha_0.png', aranha_1: 'aranha_1.png',
    besouro_dormindo: 'besouro_dormindo.png', besouro_0: 'besouro_0.png', besouro_1: 'besouro_1.png',
    traca_0: 'traca_0.png', traca_1: 'traca_1.png'
  }),
  // bichos do pântano (tools/swamp_creatures.py)
  ...imagesIn('inimigos/pantano', {
    sapo_lingua_0: 'sapo_lingua_0.png', sapo_lingua_1: 'sapo_lingua_1.png',
    sapo_venenoso_0: 'sapo_venenoso_0.png', sapo_venenoso_1: 'sapo_venenoso_1.png',
    sapo_boi_0: 'sapo_boi_0.png', sapo_boi_1: 'sapo_boi_1.png',
    jacare_0: 'jacare_0.png', jacare_1: 'jacare_1.png', jacare_bote: 'jacare_bote.png', jacare_olhos: 'jacare_olhos.png',
    jacare_tronco: 'jacare_tronco.png', jacare_acordado: 'jacare_acordado.png',
    libelula_0: 'libelula_0.png', libelula_1: 'libelula_1.png',
    mosquito_0: 'mosquito_0.png', mosquito_1: 'mosquito_1.png',
    cobra_agua_0: 'cobra_agua_0.png', cobra_agua_1: 'cobra_agua_1.png',
    tartaruga_0: 'tartaruga_0.png', tartaruga_1: 'tartaruga_1.png', tartaruga_casco: 'tartaruga_casco.png',
    piranha_0: 'piranha_0.png', piranha_1: 'piranha_1.png',
    poraque_0: 'poraque_0.png', poraque_1: 'poraque_1.png',
    garca_0: 'garca_0.png', garca_1: 'garca_1.png',
    sanguessuga_0: 'sanguessuga_0.png', sanguessuga_1: 'sanguessuga_1.png'
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
    aguia_chao_0: 'aguia_chao_0.png', aguia_chao_1: 'aguia_chao_1.png',
    // variações (tools/eagle_variants.py)
    aguia_pena: 'aguia_pena.png',
    ...['lanca', 'dourada', 'leque', 'larga', 'negra'].reduce((files, name) => ({
      ...files,
      [`aguia_${name}_0`]: `aguia_${name}_0.png`, [`aguia_${name}_1`]: `aguia_${name}_1.png`,
      [`aguia_${name}_mergulho`]: `aguia_${name}_mergulho.png`,
      [`aguia_${name}_chao_0`]: `aguia_${name}_chao_0.png`, [`aguia_${name}_chao_1`]: `aguia_${name}_chao_1.png`
    }), {})
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
  // Fase 5 (tools/bee_boss_sprites.py; a folha da rainha é carregada por QueenBeeSpriteSheet)
  ...imagesIn('chefoes/colmeia', { hive: 'colmeia.png', hive_scene: 'colmeia_cenario_vazio.png' }),
  { type: 'json', key: 'hive_layout', path: 'assets/chefoes/colmeia/colmeia.json' },
  ...imagesIn('chefoes/abelha_rainha', { gota_mel: 'gota_mel.png', espirro_mel: 'espirro_mel.png' }),
  ...imagesIn('chefoes/filhote_aguia', {
    eaglet_scene: 'ninho_cenario.png', nest_front: 'ninho_frente.png',
    eaglet_right: 'filhote_direita.png', eaglet_left: 'filhote_esquerda.png', eaglet_call: 'filhote_chamando.png',
    minhoca: 'minhoca.png', graveto: 'graveto.png'
  }),
  { type: 'json', key: 'eaglet_layout', path: 'assets/chefoes/filhote_aguia/filhote.json' },

  // Itens e HUD
  ...imagesIn('itens', { pocao: 'pocao.png', moeda: 'moeda.png' }),
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
