/**
 * characters.js
 * -----------------------------------------------------------------------------
 * Personagens jogáveis. Cada um define aparência, hitbox, velocidade e o
 * tipo de ataque. A classe de cada personagem é escolhida em PlayerFactory.
 *
 * VOICE (MALE/FEMALE) e VOICE_DETUNE (tom, em cents) escolhem o gemido de
 * dor quando o personagem perde um coração.
 *
 * Para criar um personagem novo:
 *   1. adicione as imagens no asset_manifest.js
 *   2. adicione uma entrada aqui
 *   3. crie uma subclasse de Player (ex.: knight_player.js) e registre-a
 *      em player_factory.js
 * -----------------------------------------------------------------------------
 */
const CharacterId = Object.freeze({
  KNIGHT: 'KNIGHT',
  ARCHER: 'ARCHER',
  VIKING: 'VIKING',
  NINJA: 'NINJA',
  BARD: 'BARD'
});

/**
 * Texturas de um conjunto de poses geradas pelas ferramentas (parado, os 4
 * passos, pulo, queda, ataque e agachado — veja poseImages no asset_manifest).
 */
const poseTextures = (base, attack) => {
  const side = name => ({ RIGHT: `${name}_direita`, LEFT: `${name}_esquerda` });
  const walk = ['passo_a', 'passo_a_meio', 'passo_b', 'passo_b_meio'];
  return {
    STAND:  side(base),
    WALK:   { RIGHT: walk.map(step => `${base}_${step}_direita`), LEFT: walk.map(step => `${base}_${step}_esquerda`) },
    JUMP:   side(`${base}_pulo`),
    FALL:   side(`${base}_queda`),
    ATTACK: side(attack),
    DUCK:   side(`${base}_agachado`)
  };
};

const CHARACTERS = deepFreeze({
  [CharacterId.KNIGHT]: {
    ID: CharacterId.KNIGHT,
    NAME: 'Guerreiro',
    VOICE: 'MALE', VOICE_DETUNE: 0,
    DESCRIPTION: 'Espada: golpe forte de perto',
    SCALE: 0.085,
    BODY: { WIDTH: 300, HEIGHT: 440 },
    WALK_SPEED: 120,
    // Agachar: na arte agachada os pés ficam 47px mais altos que em pé
    // (= 4px no jogo). Só o DESENHO desce; a hitbox fica no lugar, senão ela
    // entraria no chão e o personagem atravessaria o terreno.
    DUCK_VISUAL_OFFSET: 4,
    TEXTURES: {
      STAND:  { RIGHT: 'heroi_direita',          LEFT: 'heroi_esquerda' },
      // Caminhada: um passo de cada vez — apoia, levanta o pé de trás, apoia, levanta o outro (tools/walk_frames.py)
      WALK:   { RIGHT: ['heroi_passo_a_direita', 'heroi_passo_a_meio_direita', 'heroi_passo_b_direita', 'heroi_passo_b_meio_direita'],
                LEFT:  ['heroi_passo_a_esquerda', 'heroi_passo_a_meio_esquerda', 'heroi_passo_b_esquerda', 'heroi_passo_b_meio_esquerda'] },
      JUMP:   { RIGHT: 'heroi_pulo_direita',     LEFT: 'heroi_pulo_esquerda' },   // subindo (pernas encolhidas)
      FALL:   { RIGHT: 'heroi_queda_direita',    LEFT: 'heroi_queda_esquerda' },  // descendo
      ATTACK: { RIGHT: 'heroi_ataque_direita',   LEFT: 'heroi_ataque_esquerda' },
      DUCK:   { RIGHT: 'heroi_agachado_direita', LEFT: 'heroi_agachado_esquerda' }
    }
  },

  [CharacterId.ARCHER]: {
    ID: CharacterId.ARCHER,
    NAME: 'Arqueira',
    VOICE: 'FEMALE', VOICE_DETUNE: 0,
    DESCRIPTION: 'Arco: flechas de longe',
    SCALE: 0.085,
    BODY: { WIDTH: 300, HEIGHT: 440 },
    WALK_SPEED: 130,
    // A pose agachada já vem desenhada mais baixa, então não precisa deslocar
    DUCK_VISUAL_OFFSET: 0,
    TEXTURES: {
      STAND:  { RIGHT: 'arqueira_direita',          LEFT: 'arqueira_esquerda' },
      WALK:   { RIGHT: ['arqueira_passo_a_direita', 'arqueira_passo_a_meio_direita', 'arqueira_passo_b_direita', 'arqueira_passo_b_meio_direita'],
                LEFT:  ['arqueira_passo_a_esquerda', 'arqueira_passo_a_meio_esquerda', 'arqueira_passo_b_esquerda', 'arqueira_passo_b_meio_esquerda'] },
      JUMP:   { RIGHT: 'arqueira_pulo_direita',     LEFT: 'arqueira_pulo_esquerda' },
      FALL:   { RIGHT: 'arqueira_queda_direita',    LEFT: 'arqueira_queda_esquerda' },
      ATTACK: { RIGHT: 'arqueira_ataque_direita',   LEFT: 'arqueira_ataque_esquerda' },
      DUCK:   { RIGHT: 'arqueira_agachada_direita', LEFT: 'arqueira_agachada_esquerda' }
    }
  },

  // Viking: arremessa o martelo (que gira, cai fazendo terremoto e precisa
  // ser buscado); sem ele, dá soquinhos (tools/viking_from_image.py)
  [CharacterId.VIKING]: {
    ID: CharacterId.VIKING,
    NAME: 'Viking',
    VOICE: 'MALE', VOICE_DETUNE: -250,   // mais grave
    DESCRIPTION: 'Martelo: ataque de médio alcance',
    SCALE: 0.085,
    BODY: { WIDTH: 300, HEIGHT: 440 },
    WALK_SPEED: 115,            // um pouco mais lento (é pesado)
    DUCK_VISUAL_OFFSET: 0,
    // o soco é também a pose do arremesso: o braço vai para a frente e o martelo sai voando
    TEXTURES: poseTextures('viking', 'viking_soco'),
    // sem o martelo na mão (depois de arremessar, até pegar de volta)
    ALT_TEXTURES: { UNARMED: poseTextures('viking_sem_martelo', 'viking_soco') }
  },

  // Ninja: katana rápida (o primeiro golpe em cada bicho é furtivo: dobrado),
  // pulo duplo e bomba de fumaça (tools/ninja_from_image.py)
  [CharacterId.NINJA]: {
    ID: CharacterId.NINJA,
    NAME: 'Ninja',
    VOICE: 'MALE', VOICE_DETUNE: 120,   // um pouco mais agudo
    DESCRIPTION: 'Katana: ataque rápido e furtivo',
    SCALE: 0.085,
    BODY: { WIDTH: 300, HEIGHT: 440 },
    WALK_SPEED: 140,            // o mais rápido
    AIR_JUMPS: 1,               // pulo duplo (um pulo a mais no ar)
    DUCK_VISUAL_OFFSET: 0,
    TEXTURES: poseTextures('ninja', 'ninja_corte')
  },

  // Bardo: estocada de florete e, no especial, uma nota encantada que
  // transforma até 2 bichos em aliados (tools/bard_from_image.py)
  [CharacterId.BARD]: {
    ID: CharacterId.BARD,
    NAME: 'Bardo',
    VOICE: 'MALE', VOICE_DETUNE: -100,   // um pouquinho mais grave
    DESCRIPTION: 'Alaúde: encanta até 2 inimigos, que viram aliados',
    SCALE: 0.085,
    BODY: { WIDTH: 300, HEIGHT: 440 },
    WALK_SPEED: 125,
    DUCK_VISUAL_OFFSET: 0,
    TEXTURES: poseTextures('bardo', 'bardo_estocada')
  }
});
