/**
 * bear_sprite_sheet.js
 * -----------------------------------------------------------------------------
 * Registra a FOLHA DE ANIMAÇÃO do Urso Polar no Phaser.
 *
 * Na pasta assets/chefoes/urso_polar:
 *   urso_animacoes.png  → todos os quadros numa grade (gerada por
 *                         tools/bear_sheet.py a partir das sprite sheets)
 *   urso_animacoes.json → tamanho do quadro e quais quadros cada animação usa
 *
 * Cada clipe de GameSettings.POLAR_BEAR.CLIPS vira uma animação do Phaser
 * com nome "bear:<clipe>", ex.: bear:correndo. Todos os quadros foram
 * desenhados olhando para a DIREITA.
 * -----------------------------------------------------------------------------
 */
const BEAR_SHEET = Object.freeze({ KEY: 'bear', FOLDER: 'chefoes/urso_polar' });

class BearSpriteSheet {
  constructor() {
    throw new TypeError('BearSpriteSheet é estático e não deve ser instanciado.');
  }

  static get key() { return BEAR_SHEET.KEY; }

  /** Entradas do manifesto: a imagem e o JSON da folha. */
  static manifestEntries() {
    const { KEY, FOLDER } = BEAR_SHEET;
    return [
      { type: 'image', key: `${KEY}__src`, path: `assets/${FOLDER}/urso_animacoes.png` },
      { type: 'json', key: `${KEY}__meta`, path: `assets/${FOLDER}/urso_animacoes.json` }
    ];
  }

  /** Nome do clipe do Phaser. */
  static clipKey(clip) {
    return `${BEAR_SHEET.KEY}:${clip}`;
  }

  /** Cria a spritesheet e os clipes (chamar uma vez, ao carregar o jogo). */
  static registerAll(scene) {
    const key = BEAR_SHEET.KEY;
    if (scene.textures.exists(key)) return;
    const meta = scene.cache.json.get(`${key}__meta`);
    const source = scene.textures.get(`${key}__src`).getSourceImage();
    scene.textures.addSpriteSheet(key, source, { frameWidth: meta.frameWidth, frameHeight: meta.frameHeight });

    // SOURCE = animação da folha de onde o clipe tira os quadros (se for outra)
    Object.entries(GameSettings.POLAR_BEAR.CLIPS).forEach(([name, clip]) => {
      const frames = meta.animations[clip.SOURCE || name];
      if (!frames) return;
      const used = clip.FRAMES ? clip.FRAMES.map(i => frames[i]) : frames;
      scene.anims.create({
        key: BearSpriteSheet.clipKey(name),
        frames: used.map(frame => ({ key, frame })),
        frameRate: clip.FPS,
        repeat: clip.REPEAT
      });
    });
  }
}
