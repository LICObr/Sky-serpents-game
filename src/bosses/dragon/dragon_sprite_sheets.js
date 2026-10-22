/**
 * dragon_sprite_sheets.js
 * -----------------------------------------------------------------------------
 * Registra as FOLHAS DE ANIMAÇÃO dos dragões no Phaser.
 *
 * Cada dragão tem, na sua pasta de assets:
 *   dragao_animacoes.png  → todos os quadros numa grade (gerada por
 *                           tools/dragon_sheet.py a partir da sprite sheet)
 *   dragao_animacoes.json → tamanho do quadro e quais quadros cada animação usa
 *
 * Aqui a imagem vira uma "spritesheet" (quadros numerados) e cada animação
 * vira um clipe do Phaser com nome "<folha>:<animação>", ex.: dragon_red:ataque.
 * -----------------------------------------------------------------------------
 */
const DRAGON_SHEETS = Object.freeze([
  { KEY: 'dragon_red', FOLDER: 'chefoes/dragao_vermelho' },
  { KEY: 'dragon_pink', FOLDER: 'chefoes/dragao_rosa' }
]);

class DragonSpriteSheets {
  constructor() {
    throw new TypeError('DragonSpriteSheets é estático e não deve ser instanciado.');
  }

  /** Entradas do manifesto: a imagem e o JSON de cada folha. */
  static manifestEntries() {
    return DRAGON_SHEETS.flatMap(({ KEY, FOLDER }) => [
      { type: 'image', key: `${KEY}__src`, path: `assets/${FOLDER}/dragao_animacoes.png` },
      { type: 'json', key: `${KEY}__meta`, path: `assets/${FOLDER}/dragao_animacoes.json` }
    ]);
  }

  /** Nome do clipe do Phaser para uma animação de uma folha. */
  static clipKey(sheetKey, animation) {
    return `${sheetKey}:${animation}`;
  }

  /** A animação foi desenhada olhando para a direita? */
  static facesRight(animation) {
    return !GameSettings.DRAGON_ANIMATION.CLIPS_FACING_LEFT.includes(animation);
  }

  /** Cria as spritesheets e os clipes (chamar uma vez, ao carregar o jogo). */
  static registerAll(scene) {
    DRAGON_SHEETS.forEach(({ KEY }) => DragonSpriteSheets.register(scene, KEY));
  }

  /** Cria a spritesheet e os clipes de UM dragão (ex.: só o da tela de carregamento). */
  static register(scene, key) {
    if (scene.textures.exists(key)) return;
    const meta = scene.cache.json.get(`${key}__meta`);
    const source = scene.textures.get(`${key}__src`).getSourceImage();
    scene.textures.addSpriteSheet(key, source, {
      frameWidth: meta.frameWidth,
      frameHeight: meta.frameHeight
    });

    // Clipes configurados (alguns usam quadros de outra animação, via SOURCE)
    // + animações da sheet que não têm configuração própria
    const clips = { ...GameSettings.DRAGON_ANIMATION.CLIPS };
    Object.keys(meta.animations).forEach(name => { clips[name] = clips[name] || { FPS: 10, REPEAT: -1 }; });

    Object.entries(clips).forEach(([name, clip]) => {
      const frames = meta.animations[clip.SOURCE || name];
      if (!frames) return;
      const used = clip.FRAMES ? clip.FRAMES.map(i => frames[i]) : frames;
      scene.anims.create({
        key: DragonSpriteSheets.clipKey(key, name),
        frames: used.map(frame => ({ key, frame })),
        frameRate: clip.FPS,
        repeat: clip.REPEAT
      });
    });
  }
}
