/**
 * characters.js
 * -----------------------------------------------------------------------------
 * Personagens jogáveis. Cada um define aparência, hitbox, velocidade e o
 * tipo de ataque. A classe de cada personagem é escolhida em PlayerFactory.
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
  ARCHER: 'ARCHER'
});

const CHARACTERS = deepFreeze({
  [CharacterId.KNIGHT]: {
    ID: CharacterId.KNIGHT,
    NAME: 'Guerreiro',
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
  }
});
