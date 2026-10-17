/**
 * swamp_zones.js
 * -----------------------------------------------------------------------------
 * ÁGUA e LAMA do pântano (WATER e MUD no arquivo da fase):
 *   - LAGOAS: buracos compridos cheios de água. Quem cai nela NADA: anda
 *     mais devagar, afunda devagarzinho e, segurando pular, dá braçadas
 *     para cima (perto da superfície o pulo é o normal, para sair da água).
 *     Lagoa não é buraco: tem um fundo de lama, ninguém perde coração.
 *     A água é desenhada NA FRENTE de todo mundo (parecem dentro dela).
 *   - LAMA: faixas no chão que deixam o jogador lento e com o pulo mais
 *     baixo (gruda nos pés). Borbulha de vez em quando.
 * -----------------------------------------------------------------------------
 */
class SwampZones {
  static WAVE_TEXTURE = 'agua_ondinhas';

  #scene;
  #levelMap;
  #party;
  #mud;           // faixas de lama { left, right, top }
  #surfaces = []; // linhas da superfície (ondinhas que correm)
  #bubbles;
  #mudBubbles;
  #nextBubbleAt = 0;
  #nextMudBubbleAt = 0;

  /**
   * @param {Phaser.Scene} scene
   * @param {object} level WATER e MUD da fase
   * @param {LevelMap} levelMap onde ficam as lagoas e o chão
   * @param {PlayerParty} party
   */
  constructor(scene, level, levelMap, party) {
    this.#scene = scene;
    this.#levelMap = levelMap;
    this.#party = party;
    SwampZones.#createWaveTexture(scene);
    (level.WATER || []).forEach(([x]) => this.#drawLake(levelMap.waterAt(x)));
    this.#mud = (level.MUD || []).map(([x, width]) => this.#drawMud(x, width));

    const particles = (depth, config) => scene.add.particles(FxTextureKeys.SPARK).setDepth(depth).createEmitter({ on: false, ...config });
    this.#bubbles = particles(GameSettings.SWIM.DEPTH + 0.1, {
      speedY: { min: -70, max: -40 },
      speedX: { min: -10, max: 10 },
      lifespan: 700,
      scale: { start: 0.25, end: 0.45 },
      alpha: { start: 0.8, end: 0.2 },
      tint: 0xd8f4f0
    });
    this.#mudBubbles = particles(GameSettings.ENEMY.DEPTH - 0.4, {
      speedY: { min: -14, max: -6 },
      lifespan: 500,
      scale: { start: 0.2, end: 0.55 },
      alpha: { start: 0.9, end: 0 },
      tint: 0x8a7a64
    });
  }

  /** Quem está na água nada; quem pisa na lama fica lento (chamar a cada frame, antes de mover). */
  update(time) {
    const { ENTER_DEPTH, BUBBLE_MS } = GameSettings.SWIM;
    const bubbleNow = time >= this.#nextBubbleAt;
    if (bubbleNow) this.#nextBubbleAt = time + BUBBLE_MS;

    this.#party.inGame.forEach(player => {
      const lake = this.#levelMap.waterAt(player.x);
      const depth = lake ? player.feetY - lake.surfaceY : null;
      const swimming = depth !== null && depth > ENTER_DEPTH;
      if (swimming && !player.status.isSwimming) WaterSplash.at(this.#scene, player.x, lake.surfaceY);
      player.setWaterDepth(swimming ? depth : null);
      if (swimming && bubbleNow && depth > ENTER_DEPTH * 4) {
        this.#bubbles.explode(1, player.x + (player.facingRight ? 8 : -8), player.sprite.body.top + 4);
      }
      player.status.setInMud(this.#isInMud(player));
    });

    this.#surfaces.forEach(surface => { surface.tilePositionX += 0.25; });
    if (this.#mud.length && time >= this.#nextMudBubbleAt) {
      this.#nextMudBubbleAt = time + GameSettings.MUD.BUBBLE_MS;
      const mud = Phaser.Utils.Array.GetRandom(this.#mud);
      this.#mudBubbles.explode(1, Phaser.Math.Between(mud.left + 6, mud.right - 6), mud.top + 3);
    }
  }

  /** Pisando (de pé, no chão) numa faixa de lama? */
  #isInMud(player) {
    if (!player.sprite.body.blocked.down) return false;
    return this.#mud.some(mud => player.x >= mud.left && player.x <= mud.right && Math.abs(player.feetY - mud.top) < 6);
  }

  /**
   * Lagoa: fundo de lama, a água por cima de todo mundo (mais escura no
   * fundo) e uma linha de ondinhas na superfície.
   */
  #drawLake({ left, right, surfaceY }) {
    const scene = this.#scene;
    const cfg = GameSettings.SWIM;
    const { LAKE_BED_Y, TERRAIN_BOTTOM } = GameSettings.LEVEL;
    const width = right - left;
    scene.add.tileSprite(left, LAKE_BED_Y, width, TERRAIN_BOTTOM - LAKE_BED_Y, 'lama')
      .setOrigin(0, 0).setTileScale(GameSettings.MUD.TILE_SCALE);
    scene.add.rectangle(left, surfaceY, width, TERRAIN_BOTTOM - surfaceY, cfg.COLOR, cfg.ALPHA)
      .setOrigin(0, 0).setDepth(cfg.DEPTH);
    const deepY = surfaceY + (LAKE_BED_Y - surfaceY) * 0.45;
    scene.add.rectangle(left, deepY, width, TERRAIN_BOTTOM - deepY, cfg.COLOR, cfg.DEEP_ALPHA)
      .setOrigin(0, 0).setDepth(cfg.DEPTH);
    this.#surfaces.push(scene.add.tileSprite(left, surfaceY - 3, width, 8, SwampZones.WAVE_TEXTURE)
      .setOrigin(0, 0).setDepth(cfg.DEPTH + 0.05));
  }

  /** Faixa de lama por cima do chão. */
  #drawMud(x, width) {
    const top = this.#levelMap.surfaceYAt(x + width / 2) ?? GameSettings.LEVEL.GROUND_TOP;
    const { HEIGHT, TILE_SCALE } = GameSettings.MUD;
    this.#scene.add.tileSprite(x, top - 2, width, HEIGHT, 'lama')
      .setOrigin(0, 0).setTileScale(TILE_SCALE).setDepth(GameSettings.ENEMY.DEPTH - 0.5);
    return { left: x, right: x + width, top };
  }

  /** Ondinhas da superfície: uma linha clara ondulada com brilhos (32x8). */
  static #createWaveTexture(scene) {
    if (scene.textures.exists(SwampZones.WAVE_TEXTURE)) return;
    const g = scene.make.graphics({ add: false });
    g.fillStyle(GameSettings.SWIM.SURFACE_COLOR, 0.85);
    for (let x = 0; x < 32; x += 2) {
      const y = 3 + Math.round(Math.sin((x / 32) * Math.PI * 2) * 1.5);
      g.fillRect(x, y, 2, 2);
    }
    g.fillStyle(0xffffff, 0.8);
    g.fillRect(6, 2, 4, 1);
    g.fillRect(22, 5, 3, 1);
    g.generateTexture(SwampZones.WAVE_TEXTURE, 32, 8);
    g.destroy();
  }
}
