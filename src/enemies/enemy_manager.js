/**
 * enemy_manager.js
 * -----------------------------------------------------------------------------
 * Cuida de todos os bichos de uma fase:
 *   - cria os bichos fixos da fase (ENEMIES no arquivo da fase);
 *   - SORTEIA bichos extras em lugares aleatórios a cada partida
 *     (RANDOM_ENEMIES: quem anda só nasce em chão firme, quem voa no céu);
 *   - solta ONDAS: de tempos em tempos surge um bicho à frente do jogador,
 *     respeitando um limite de bichos perto da câmera (para até a luta
 *     com o chefão começar);
 *   - atualiza só os bichos perto da câmera (os outros "dormem" — mais leve).
 *
 * Escolhe a classe certa de cada tipo (padrão "Factory"):
 *   slime → WalkerEnemy | cobrinha → SnakeEnemy | ouriço → SpikyEnemy
 *   sapo → HopperEnemy | planta → ShooterEnemy
 *   morcego → FlyerEnemy | fantasma → GhostEnemy | vespa → DiverEnemy
 *   águia → EagleEnemy | morcego-sônico → SonicBatEnemy
 *   aranha → SpiderEnemy | besouro-pedra → RockBeetleEnemy
 *   sapo-língua → TongueFrogEnemy | sapo-boi → BullfrogEnemy
 *   jacaré e cobra-d'água → SwimmerEnemy | jacaré-saltador → LeaperGatorEnemy
 *   jacaré-tronco → LogGatorEnemy (também é chão: dá para pisar — standables)
 *   tartaruga → TurtleEnemy | piranha → PiranhaEnemy | poraquê → EelEnemy
 *   garça → HeronEnemy | sanguessuga → LeechEnemy
 * Bicho de chão que cai na lagoa (ex.: sapo pulando) afunda e some, e o
 * casco de tartaruga deslizando derruba os bichos que encontrar.
 * E cuida do que alguns bichos deixam ao morrer: o morcego-gigante vira dois
 * morceguinhos (SPLIT) e a traça e o sapo venenoso soltam uma nuvem (DEATH_DUST).
 * Bicho encantado pelo Bardo (aliado) é atualizado sempre, pelo CharmedAlly.
 * -----------------------------------------------------------------------------
 */
class EnemyManager {
  #scene;
  #level;
  #levelMap;
  #match;
  #combat;
  #eventBus;
  #enemies = [];
  #dustClouds = [];  // pó das traças
  #walkers;   // bichos de chão (colidem com o terreno)
  #standables; // bichos onde dá para ficar em pé (jacaré-tronco)
  #seeds;     // sementes das plantas cuspidoras
  #eggs;      // ovos das águias
  #waveTimer = null;

  /**
   * @param {Phaser.Scene} scene
   * @param {object} level entrada de LEVELS
   * @param {LevelMap} levelMap
   * @param {MatchConfig} match
   * @param {CombatRegistry} combat
   * @param {Phaser.Events.EventEmitter} eventBus
   */
  constructor(scene, level, levelMap, match, combat, eventBus) {
    this.#scene = scene;
    this.#level = level;
    this.#levelMap = levelMap;
    this.#match = match;
    this.#combat = combat;
    this.#eventBus = eventBus;
    this.#walkers = scene.add.group();
    this.#standables = scene.add.group();
    this.#seeds = new SeedPool(scene);
    this.#eggs = new EggPool(scene);

    // Quem anda precisa pisar no chão e nas plataformas
    scene.physics.add.collider(this.#walkers, levelMap.solids);
    scene.physics.add.collider(this.#walkers, levelMap.platforms);

    // Bicho derrotado sai do combate e da lista
    eventBus.on(GameEvents.ENEMY_DEFEATED, enemy => {
      combat.unregister(enemy);
      this.#enemies = this.#enemies.filter(e => e !== enemy);
      this.#leaveBehind(enemy);
    });

    level.ENEMIES.forEach(spawn => this.#spawn(spawn));
    this.#spawnRandomEnemies();
    this.#startWaves();
  }

  /** Projéteis dos bichos (sementes, ovos) — a cena liga as colisões. */
  get projectilePools() {
    return [this.#seeds, this.#eggs];
  }

  /** Bichos onde dá para ficar em pé (a cena liga a colisão com os jogadores). */
  get standables() {
    return this.#standables;
  }

  /** Quantos bichos ainda estão vivos. */
  get aliveCount() {
    return this.#enemies.length;
  }

  /** Bichos que andam esbarram nesses objetos (ex.: árvores). */
  addObstacles(group) {
    this.#scene.physics.add.collider(this.#walkers, group);
  }

  /**
   * Cria um bicho a qualquer momento (ex.: chamado pelo chefão).
   * @param {{TYPE: string, X: number, Y?: number}} spawn
   * @returns {Enemy}
   */
  spawnEnemy(spawn) {
    return this.#spawn(spawn);
  }

  /** Para de soltar ondas (ex.: quando a luta com o chefão começa). */
  stopWaves() {
    if (this.#waveTimer) this.#waveTimer.remove();
    this.#waveTimer = null;
  }

  /**
   * Atualiza os bichos perto da câmera.
   * @param {number} time
   * @param {PlayerParty} party cada bicho persegue o jogador mais perto
   */
  update(time, party) {
    const margin = GameSettings.ENEMY.ACTIVATION_MARGIN;
    this.#enemies = this.#enemies.filter(enemy => enemy.isAlive); // (aliado dispensado pelo bardo some sem morrer)
    this.#enemies.forEach(enemy => {
      // Aliado do bardo: segue ele (não cai no buraco, não afunda e não dorme)
      if (enemy.isCharmed) {
        enemy.update(time, null);
        return;
      }
      // Caiu num buraco (ex.: sapo pulando): some
      if (enemy.y > GameSettings.LEVEL.PIT_Y) {
        enemy.vanish();
        return;
      }
      // Bicho de chão que caiu na lagoa: afunda e some
      const lake = this.#walkers.contains(enemy.sprite) ? this.#levelMap.waterAt(enemy.x) : null;
      if (lake && enemy.y > lake.surfaceY + 4) {
        WaterSplash.at(this.#scene, enemy.x, lake.surfaceY, 8);
        enemy.vanish();
        this.#scene.tweens.add({ targets: enemy.sprite, y: enemy.y + 40, duration: GameSettings.ENEMY.DEATH_FADE_MS });
        return;
      }
      if (this.#isNearCamera(enemy.x, margin)) enemy.update(time, party.nearestTo(enemy.x, enemy.y));
      else enemy.sleep();
    });
    this.#knockOverWithShells();
    this.#dustClouds = this.#dustClouds.filter(cloud => {
      if (cloud.isDone) {
        cloud.destroy();
        return false;
      }
      cloud.update(party.inGame);
      return true;
    });
    this.projectilePools.forEach(pool => pool.update(time));
  }

  /** Casco de tartaruga deslizando derruba (ou chuta, se for outro casco) quem encontrar. */
  #knockOverWithShells() {
    this.#enemies.filter(enemy => enemy.isSlidingShell).forEach(shell => {
      this.#enemies.forEach(other => {
        if (other === shell || !other.isActive || !other.canBeHit) return;
        if (Phaser.Geom.Intersects.RectangleToRectangle(shell.sprite.body, other.sprite.body)) {
          other.takeHit(shell, Number.MAX_SAFE_INTEGER);
        }
      });
    });
  }

  /** Cria um bicho e o coloca no jogo. */
  #spawn(spawn) {
    const enemy = EnemyManager.#create(this.#scene, spawn, this.#levelMap, this.#match, this.#eventBus, this.#seeds, this.#eggs);
    this.#enemies.push(enemy);
    this.#combat.register(enemy, true);
    const touchesTerrain = GROUND_BEHAVIORS.includes(enemy.type.BEHAVIOR) ||
      [EnemyBehavior.EAGLE, EnemyBehavior.DROPPER].includes(enemy.type.BEHAVIOR);
    if (touchesTerrain) this.#walkers.add(enemy.sprite);
    if (enemy.type.BEHAVIOR === EnemyBehavior.LOG) this.#standables.add(enemy.sprite);
    return enemy;
  }

  /** Bichos extras em posições sorteadas pelo percurso. */
  #spawnRandomEnemies() {
    const random = this.#level.RANDOM_ENEMIES;
    if (!random) return;

    const { SAFE_START_X, SAFE_BEFORE_ARENA, FLYER_Y } = GameSettings.ENEMY.RANDOM_SPAWN;
    const minX = SAFE_START_X;
    const maxX = this.#level.ARENA_START_X - SAFE_BEFORE_ARENA;

    for (let i = 0; i < random.WALKERS.COUNT; i++) {
      const x = this.#findWalkerSpot(minX, maxX);
      if (x !== null) this.#spawn({ TYPE: Phaser.Utils.Array.GetRandom(random.WALKERS.TYPES), X: x });
    }
    for (let i = 0; i < random.FLYERS.COUNT; i++) {
      const x = this.#findFreeX(minX, maxX);
      const type = Phaser.Utils.Array.GetRandom(random.FLYERS.TYPES);
      this.#spawn({ TYPE: type, X: x, Y: this.#randomFlyerY(type, x) });
    }
    // Raros (ex.: águia), voando bem alto
    (random.SPECIALS || []).forEach(({ TYPE, COUNT }) => {
      const soar = ENEMY_TYPES[TYPE].SOAR_Y || FLYER_Y;
      for (let i = 0; i < COUNT; i++) {
        this.#spawn({ TYPE, X: this.#findFreeX(minX, maxX), Y: Phaser.Math.Between(soar.MIN, soar.MAX) });
      }
    });
  }

  /** O que fica de um bicho derrotado: morcego-gigante vira dois; traça solta pó. */
  #leaveBehind(enemy) {
    const { SPLIT, DEATH_DUST } = enemy.type;
    for (let i = 0; i < (SPLIT ? SPLIT.COUNT : 0); i++) {
      this.spawnEnemy({ TYPE: SPLIT.TYPE, X: enemy.x + (i - (SPLIT.COUNT - 1) / 2) * 30, Y: enemy.y });
    }
    if (DEATH_DUST) this.#dustClouds.push(new DustCloud(this.#scene, enemy.x, enemy.y, DEATH_DUST));
  }

  /** Começa a soltar ondas de bichos à frente do jogador. */
  #startWaves() {
    const waves = this.#level.RANDOM_ENEMIES && this.#level.RANDOM_ENEMIES.WAVES;
    if (!waves) return;

    this.#waveTimer = this.#scene.time.addEvent({
      delay: waves.INTERVAL_MS,
      loop: true,
      callback: () => this.#spawnWave(waves)
    });
  }

  /** Um bicho novo logo além da borda direita da tela (se não houver bichos demais). */
  #spawnWave(waves) {
    const nearby = this.#enemies.filter(e => e.isAlive && this.#isNearCamera(e.x, 0)).length;
    if (nearby >= waves.MAX_NEAR) return;

    const { WAVE_AHEAD_X, SAFE_BEFORE_ARENA } = GameSettings.ENEMY.RANDOM_SPAWN;
    const x = this.#scene.cameras.main.worldView.right + WAVE_AHEAD_X;
    if (x > this.#level.ARENA_START_X - SAFE_BEFORE_ARENA) return; // nada de ondas perto da arena

    const type = Phaser.Utils.Array.GetRandom(waves.TYPES);
    if (GROUND_BEHAVIORS.includes(ENEMY_TYPES[type].BEHAVIOR)) {
      if (this.#isFirmGround(x)) this.#spawn({ TYPE: type, X: x });
    } else {
      this.#spawn({ TYPE: type, X: x, Y: this.#randomFlyerY(type, x) });
    }
  }

  /**
   * Altura sorteada para quem voa: no céu, mas sempre acima do terreno mais
   * alto por onde ele vai patrulhar (senão nasce dentro de uma montanha).
   */
  #randomFlyerY(type, x) {
    const { FLYER_Y, FLYER_CLEARANCE } = GameSettings.ENEMY.RANDOM_SPAWN;
    const range = ENEMY_TYPES[type].PATROL_RANGE || 0;
    let highestTop = GameSettings.LEVEL.GROUND_TOP;
    for (let px = x - range; px <= x + range; px += 16) {
      highestTop = Math.min(highestTop, this.#levelMap.surfaceYAt(px) ?? highestTop);
    }
    return Math.min(Phaser.Math.Between(FLYER_Y.MIN, FLYER_Y.MAX), highestTop - FLYER_CLEARANCE);
  }

  /** Sorteia um x com chão firme (sem buraco nem beirada) e longe de outros bichos. */
  #findWalkerSpot(minX, maxX) {
    const { MAX_TRIES } = GameSettings.ENEMY.RANDOM_SPAWN;
    for (let i = 0; i < MAX_TRIES; i++) {
      const x = this.#findFreeX(minX, maxX);
      if (this.#isFirmGround(x)) return x;
    }
    return null;
  }

  /** Sorteia um x longe dos bichos que já existem. */
  #findFreeX(minX, maxX) {
    const { MIN_DISTANCE, MAX_TRIES } = GameSettings.ENEMY.RANDOM_SPAWN;
    let x = Phaser.Math.Between(minX, maxX);
    for (let i = 0; i < MAX_TRIES && this.#enemies.some(e => Math.abs(e.x - x) < MIN_DISTANCE); i++) {
      x = Phaser.Math.Between(minX, maxX);
    }
    return x;
  }

  /** Há chão no x e também um pouco antes e depois (não é beirada de buraco nem lagoa)? */
  #isFirmGround(x) {
    const margin = GameSettings.ENEMY.RANDOM_SPAWN.EDGE_MARGIN;
    const map = this.#levelMap;
    return [x - margin, x, x + margin].every(px => map.surfaceYAt(px) !== null && !map.waterAt(px));
  }

  #isNearCamera(x, margin) {
    const view = this.#scene.cameras.main.worldView;
    return x > view.left - margin && x < view.right + margin;
  }

  /** Escolhe a classe certa para o tipo de bicho. */
  static #create(scene, spawn, levelMap, match, eventBus, seeds, eggs) {
    const type = ENEMY_TYPES[spawn.TYPE];
    if (!type) throw new RangeError(`Tipo de inimigo desconhecido: ${spawn.TYPE}`);

    // Bichos de chão nascem um pouco acima do terreno e caem nele
    // (sobre uma lagoa: na superfície da água, para cair numa vitória-régia)
    const lake = levelMap.waterAt(spawn.X);
    const groundY = (lake ? lake.surfaceY : levelMap.surfaceYAt(spawn.X) ?? GameSettings.LEVEL.GROUND_TOP) - 20;
    const args = [scene, spawn.X, spawn.Y, type, match, eventBus];
    const groundArgs = [scene, spawn.X, groundY, type, match, eventBus];

    switch (type.BEHAVIOR) {
      case EnemyBehavior.WALKER:  return new WalkerEnemy(...groundArgs, levelMap);
      case EnemyBehavior.SNAKE:   return new SnakeEnemy(...groundArgs, levelMap);
      case EnemyBehavior.SPIKY:   return new SpikyEnemy(...groundArgs, levelMap);
      case EnemyBehavior.HOPPER:  return new HopperEnemy(...groundArgs);
      case EnemyBehavior.SHOOTER: return new ShooterEnemy(...groundArgs, seeds);
      case EnemyBehavior.FLYER:   return new FlyerEnemy(...args);
      case EnemyBehavior.GHOST:   return new GhostEnemy(...args);
      case EnemyBehavior.DIVER:   return new DiverEnemy(...args);
      case EnemyBehavior.EAGLE:   return new EagleEnemy(...args, levelMap, eggs);
      case EnemyBehavior.SONIC:   return new SonicBatEnemy(...args);
      case EnemyBehavior.DROPPER: return new SpiderEnemy(...args, levelMap);
      case EnemyBehavior.AMBUSH:  return new RockBeetleEnemy(...groundArgs, levelMap);
      case EnemyBehavior.TONGUE:   return new TongueFrogEnemy(...groundArgs);
      case EnemyBehavior.BULLFROG: return new BullfrogEnemy(...groundArgs);
      case EnemyBehavior.SWIMMER:  return new SwimmerEnemy(...args, levelMap);
      case EnemyBehavior.LEAPER:   return new LeaperGatorEnemy(...args, levelMap);
      case EnemyBehavior.LOG:      return new LogGatorEnemy(...args, levelMap);
      case EnemyBehavior.TURTLE:   return new TurtleEnemy(...groundArgs, levelMap);
      case EnemyBehavior.HERON:    return new HeronEnemy(...groundArgs);
      case EnemyBehavior.PIRANHA:  return new PiranhaEnemy(...args, levelMap);
      case EnemyBehavior.EEL:      return new EelEnemy(...args, levelMap);
      case EnemyBehavior.LEECH:    return new LeechEnemy(...args, levelMap);
      default:
        throw new RangeError(`Comportamento desconhecido: ${type.BEHAVIOR}`);
    }
  }
}
