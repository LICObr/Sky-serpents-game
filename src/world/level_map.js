/**
 * level_map.js
 * -----------------------------------------------------------------------------
 * Monta o TERRENO de uma fase a partir dos dados da fase (src/levels/):
 *   - trechos de chão em alturas diferentes (morros/paredões)
 *   - RAMPAS (subidas e descidas) entre alturas
 *   - buracos (espaços sem chão)
 *   - LAGOAS (WATER): buracos cheios de água com um fundo invisível — dá
 *     para nadar (swamp_zones.js), não para cair
 *   - ilhas flutuantes (só colidem pisando por cima)
 *   - plataformas da arena do chefão (se a fase tiver chefão)
 *
 * Como funcionam as rampas: a física Arcade não tem chão inclinado, mas
 * "sobe" sozinha degraus de até ~4px. Então a rampa é feita de vários
 * degrauzinhos invisíveis de 8x4px e o desenho dela é feito com os mesmos
 * blocos de grama/terra do chão, coluna por coluna.
 *
 * Também responde perguntas sobre o terreno ("há chão à frente deste
 * slime?", "qual a altura do chão neste x?").
 * -----------------------------------------------------------------------------
 */
class LevelMap {
  #scene;
  #level;
  #theme;
  #solids;      // chão (colide por todos os lados)
  #platforms;   // ilhas (colidem só por cima)
  #floors = []; // retângulos { left, right, top } onde dá para pisar
  #grounds = []; // só o chão sólido (para saber a altura do terreno)
  #arenaPlatforms;
  #worldTop;     // topo do mundo (negativo quando a montanha passa da tela)

  /**
   * @param {Phaser.Scene} scene
   * @param {object} level entrada de LEVELS
   */
  constructor(scene, level) {
    this.#scene = scene;
    this.#level = level;
    this.#theme = TERRAIN_THEMES[level.TERRAIN];
    this.#solids = scene.physics.add.staticGroup();
    this.#platforms = scene.physics.add.staticGroup();

    const segments = LevelMap.#widenHoles(level.GROUND, level.RAMPS, level.WATER || [])
      .map(([x, width, elevation = 0]) => this.#createGround(x, width, elevation));
    level.RAMPS.forEach(([x, width, from, to], index) => this.#createRamp(index, x, width, from, to));
    segments.push(this.#createGround(level.ARENA_START_X, GameSettings.LEVEL.ARENA_WIDTH, 0));
    // Lagoas: no lugar de buraco, um fundo invisível (dá para nadar, não para cair)
    (level.WATER || []).forEach(([x, width]) => this.#addSolidBlock(x, GameSettings.LEVEL.LAKE_BED_Y, width));
    segments.forEach(segment => this.#roundExposedCorners(segment));

    level.PLATFORMS.forEach(([x, y]) => this.#createPlatform(x, y));
    this.#arenaPlatforms = level.ARENA ? this.#buildArenaPlatforms() : [];

    // Montanha mais alta que a tela: o mundo (e a câmera) sobe até um pouco acima do pico
    const highest = Math.min(...this.#floors.map(floor => floor.top));
    this.#worldTop = Math.min(0, highest - GameSettings.LEVEL.SKY_ABOVE_TERRAIN);
  }

  get solids()      { return this.#solids; }
  get platforms()   { return this.#platforms; }
  get arenaStartX() { return this.#level.ARENA_START_X; }
  get worldWidth()  { return this.#level.ARENA_START_X + GameSettings.LEVEL.ARENA_WIDTH; }
  /** Topo do mundo: 0 nas fases normais, negativo se a montanha passa do alto da tela. */
  get worldTop()    { return this.#worldTop; }
  /**
   * Lagoa (água) nesta posição x, ou null.
   * @returns {{left: number, right: number, surfaceY: number}|null}
   */
  waterAt(x) {
    const lake = (this.#level.WATER || []).find(([left, width]) => x >= left && x < left + width);
    if (!lake) return null;
    const [left, width, elevation = GameSettings.SWIM.SURFACE_ELEVATION] = lake;
    return { left, right: left + width, surfaceY: GameSettings.LEVEL.GROUND_TOP - elevation };
  }

  /** A fase sobe além da tela (a câmera precisa acompanhar para cima)? */
  get isTall()      { return this.#worldTop < 0; }

  /** Plataformas da arena do chefão (onde surgem as poções durante a luta). */
  get arenaPlatforms() { return this.#arenaPlatforms; }

  /**
   * Existe chão/plataforma sob o ponto (x, pés)?
   * @param {number} x posição horizontal a testar
   * @param {number} feetY altura dos pés
   * @param {number} tolerance folga vertical em px
   */
  hasFloorAt(x, feetY, tolerance = 14) {
    return this.#floors.some(f => x >= f.left && x <= f.right && Math.abs(f.top - feetY) <= tolerance);
  }

  /**
   * Altura (y) da superfície do chão sólido em x, ou null se for buraco.
   * @param {number} x
   */
  surfaceYAt(x) {
    const tops = this.#grounds.filter(g => x >= g.left && x < g.right).map(g => g.top);
    return tops.length ? Math.min(...tops) : null;
  }

  /** Cria as plataformas da arena (fixas + sorteadas) e as devolve. */
  #buildArenaPlatforms() {
    const arena = this.#level.ARENA;
    const offsetX = this.arenaStartX;
    const created = arena.PLATFORMS.map(([x, y]) => this.#createPlatform(offsetX + x, y));

    for (let i = 0; i < arena.RANDOM_COUNT; i++) {
      const x = Phaser.Math.Between(arena.RANDOM_X.MIN, arena.RANDOM_X.MAX);
      const y = Phaser.Math.Between(arena.RANDOM_Y.MIN, arena.RANDOM_Y.MAX);
      created.push(this.#createPlatform(offsetX + x, y));
    }
    return created;
  }

  /**
   * Alarga os buracos: o trecho de chão que vem DEPOIS de um buraco (nada
   * termina exatamente onde ele começa) começa um pouco mais à frente.
   */
  static #widenHoles(ground, ramps, water) {
    const extra = GameSettings.LEVEL.HOLE_EXTRA_WIDTH;
    const ends = new Set([...ground, ...ramps, ...water].map(([x, width]) => x + width)); // depois de lagoa não é buraco
    return ground.map(([x, width, elevation = 0]) => {
      const afterHole = x > 0 && !ends.has(x);
      return afterHole ? [x + extra, width - extra, elevation] : [x, width, elevation];
    });
  }

  /** Trecho de chão plano numa certa altura (morro = elevação > 0). */
  #createGround(x, width, elevation) {
    const { GROUND_TOP, TOP_STRIP_HEIGHT, TERRAIN_BOTTOM, GROUND_TILE_SCALE } = GameSettings.LEVEL;
    const top = GROUND_TOP - elevation;

    // Visual: faixa de grama (ou neve, no alto) em cima + terra até embaixo
    const grass = this.#scene.add.tileSprite(x, top, width, TOP_STRIP_HEIGHT, this.#topTexture(elevation))
      .setOrigin(0, 0).setTileScale(GROUND_TILE_SCALE);
    const dirt = this.#scene.add.tileSprite(x, top + TOP_STRIP_HEIGHT, width, TERRAIN_BOTTOM - top - TOP_STRIP_HEIGHT, this.#theme.FILL_TEXTURE)
      .setOrigin(0, 0).setTileScale(GROUND_TILE_SCALE);

    this.#addSolidBlock(x, top, width);
    return { x, width, top, parts: [grass, dirt] };
  }

  /**
   * Arredonda os cantos de cima que ficam "expostos" (beirada de buraco ou
   * de paredão), usando uma máscara com cantos redondos. Onde o chão
   * continua (outro trecho ou rampa na mesma altura) o canto fica reto.
   */
  #roundExposedCorners({ x, width, top, parts }) {
    const { CORNER_RADIUS, TERRAIN_BOTTOM, RAMP_STEP_HEIGHT } = GameSettings.LEVEL;
    const isExposed = neighborX => {
      const neighborTop = this.surfaceYAt(neighborX);
      return neighborTop === null || neighborTop > top + RAMP_STEP_HEIGHT; // buraco ou degrau para baixo
    };
    const left = isExposed(x - 1) ? CORNER_RADIUS : 0;
    const right = isExposed(x + width + 1) ? CORNER_RADIUS : 0;
    if (!left && !right) return;

    const shape = this.#scene.make.graphics({ add: false });
    shape.fillStyle(0xffffff);
    shape.fillRoundedRect(x, top, width, TERRAIN_BOTTOM - top, { tl: left, tr: right, bl: 0, br: 0 });
    const mask = shape.createGeometryMask();
    parts.forEach(part => part.setMask(mask));
  }

  /**
   * Rampa de `from` até `to` (elevações) ao longo de `width` pixels.
   * Ex.: [520, 160, 0, 64] = sobe 64px entre x=520 e x=680.
   */
  #createRamp(index, x, width, from, to) {
    const { GROUND_TOP, RAMP_STEP_WIDTH, RAMP_STEP_HEIGHT } = GameSettings.LEVEL;
    const steps = Math.round(width / RAMP_STEP_WIDTH);

    if (Math.abs(to - from) / steps > RAMP_STEP_HEIGHT) {
      console.warn(`[LevelMap] Rampa em x=${x} íngreme demais: alargue para ${Math.abs(to - from) / RAMP_STEP_HEIGHT * RAMP_STEP_WIDTH}px`);
    }

    // Altura de cada degrau (arredondada para a grade de 4px da arte)
    const tops = [];
    for (let i = 0; i < steps; i++) {
      const elevation = Phaser.Math.Linear(from, to, (i + 0.5) / steps);
      tops.push(GROUND_TOP - Math.round(elevation / RAMP_STEP_HEIGHT) * RAMP_STEP_HEIGHT);
    }

    this.#drawRamp(index, x, tops);

    // Corpos físicos: junta degraus vizinhos de mesma altura (menos objetos)
    let start = 0;
    for (let i = 1; i <= tops.length; i++) {
      if (i === tops.length || tops[i] !== tops[start]) {
        this.#addSolidBlock(x + start * RAMP_STEP_WIDTH, tops[start], (i - start) * RAMP_STEP_WIDTH);
        start = i;
      }
    }
  }

  /**
   * Desenha a rampa uma única vez numa textura (coluna por coluna, com a
   * grama acompanhando a inclinação) — depois é só uma imagem, bem leve.
   */
  #drawRamp(index, x, tops) {
    const { TERRAIN_BOTTOM, RAMP_STEP_WIDTH, RAMP_GRASS_HEIGHT, GROUND_TILE_SCALE } = GameSettings.LEVEL;
    const textures = this.#scene.textures;
    const key = `ramp-${this.#level.NUMBER}-${index}`;
    const minTop = Math.min(...tops);
    const width = tops.length * RAMP_STEP_WIDTH;
    const height = TERRAIN_BOTTOM - minTop;

    if (textures.exists(key)) textures.remove(key); // ao reiniciar a fase
    const canvasTexture = textures.createCanvas(key, width, height);
    const ctx = canvasTexture.getContext();
    ctx.imageSmoothingEnabled = false;

    const pattern = (textureKey, offsetY) => {
      const p = ctx.createPattern(textures.get(textureKey).getSourceImage(), 'repeat');
      p.setTransform(new DOMMatrix([GROUND_TILE_SCALE, 0, 0, GROUND_TILE_SCALE, 0, offsetY]));
      return p;
    };
    const dirt = pattern(this.#theme.FILL_TEXTURE, 0);

    tops.forEach((top, i) => {
      const columnX = i * RAMP_STEP_WIDTH;
      const localTop = top - minTop;
      const elevation = GameSettings.LEVEL.GROUND_TOP - top;
      ctx.fillStyle = pattern(this.#topTexture(elevation), localTop); // grama alinhada ao topo do degrau
      ctx.fillRect(columnX, localTop, RAMP_STEP_WIDTH, RAMP_GRASS_HEIGHT);
      ctx.fillStyle = dirt;
      ctx.fillRect(columnX, localTop + RAMP_GRASS_HEIGHT, RAMP_STEP_WIDTH, height - localTop - RAMP_GRASS_HEIGHT);
    });

    canvasTexture.refresh();
    this.#scene.add.image(x, minTop, key).setOrigin(0, 0);
  }

  /** Topo do chão nesta elevação: grama, ou neve acima da linha de neve do tema. */
  #topTexture(elevation) {
    const snow = this.#theme.SNOW;
    return snow && elevation >= snow.FROM_ELEVATION ? snow.TOP_TEXTURE : this.#theme.TOP_TEXTURE;
  }

  /** Bloco sólido invisível (do topo até o fundo do terreno). */
  #addSolidBlock(x, top, width) {
    const height = GameSettings.LEVEL.TERRAIN_BOTTOM - top;
    const zone = this.#scene.add.zone(x, top, width, height).setOrigin(0, 0);
    this.#solids.add(zone); // o staticGroup cria o corpo estático
    zone.body.updateFromGameObject();

    const rect = { left: x, right: x + width, top };
    this.#floors.push(rect);
    this.#grounds.push(rect);
  }

  /** Ilha flutuante (na cor do tema) com colisão apenas por cima. */
  #createPlatform(x, y) {
    const cfg = GameSettings.PLATFORMS;
    const platform = this.#platforms.create(x, y, this.#theme.PLATFORM_TEXTURE).setScale(cfg.SCALE);
    platform.refreshBody();

    const displayHeight = platform.displayHeight;
    platform.body.setSize(displayHeight, cfg.BODY_HEIGHT);
    platform.body.setOffset(cfg.BODY_OFFSET_X, displayHeight - cfg.BODY_OFFSET_Y_FROM_BOTTOM);
    platform.body.checkCollision.down = false;
    platform.body.checkCollision.left = false;
    platform.body.checkCollision.right = false;

    const body = platform.body;
    this.#floors.push({ left: body.left, right: body.right, top: body.top });
    return platform;
  }
}
