/**
 * queen_bee_sprite_sheet.js
 * -----------------------------------------------------------------------------
 * Registra a FOLHA DE ANIMAÇÃO da Abelha Rainha no Phaser.
 *
 * Na pasta assets/chefoes/abelha_rainha (geradas por tools/bee_boss_sprites.py
 * a partir de source_art/chefoes/abelha_rainha/abelha_original.png):
 *   abelha_animacoes.png  → os quadros lado a lado
 *   abelha_animacoes.json → tamanho do quadro e quais quadros cada animação usa
 *
 * Cada clipe de GameSettings.QUEEN_BEE.CLIPS vira uma animação do Phaser com
 * nome "queen_bee:<clipe>". Os quadros foram desenhados olhando para a ESQUERDA.
 * -----------------------------------------------------------------------------
 */
const QUEEN_BEE_SHEET = Object.freeze({ KEY: 'queen_bee', FOLDER: 'chefoes/abelha_rainha' });

class QueenBeeSpriteSheet {
  constructor() {
    throw new TypeError('QueenBeeSpriteSheet é estático e não deve ser instanciado.');
  }

  static get key() { return QUEEN_BEE_SHEET.KEY; }

  /** Entradas do manifesto: a imagem e o JSON da folha. */
  static manifestEntries() {
    const { KEY, FOLDER } = QUEEN_BEE_SHEET;
    return [
      { type: 'image', key: `${KEY}__src`, path: `assets/${FOLDER}/abelha_animacoes.png` },
      { type: 'json', key: `${KEY}__meta`, path: `assets/${FOLDER}/abelha_animacoes.json` }
    ];
  }

  /** Nome do clipe do Phaser. */
  static clipKey(clip) {
    return `${QUEEN_BEE_SHEET.KEY}:${clip}`;
  }

  /** Cria a spritesheet e os clipes (chamar uma vez, ao carregar o jogo). */
  static registerAll(scene) {
    const key = QUEEN_BEE_SHEET.KEY;
    if (scene.textures.exists(key)) return;
    const meta = scene.cache.json.get(`${key}__meta`);
    const source = scene.textures.get(`${key}__src`).getSourceImage();
    scene.textures.addSpriteSheet(key, source, { frameWidth: meta.frameWidth, frameHeight: meta.frameHeight });

    Object.entries(GameSettings.QUEEN_BEE.CLIPS).forEach(([name, clip]) => {
      const frames = meta.animations[name];
      if (!frames) return;
      scene.anims.create({
        key: QueenBeeSpriteSheet.clipKey(name),
        frames: frames.map(frame => ({ key, frame })),
        frameRate: clip.FPS,
        repeat: clip.REPEAT
      });
    });
  }
}
