/**
 * enemy_manager.js
 * -----------------------------------------------------------------------------
 * Cuida de todos os bichos de uma fase:
 *   - cria os bichos fixos da fase (ENEMIES no arquivo da fase);
 *   - SORTEIA bichos extras em lugares aleatórios a cada partida
 *     (RANDOM_ENEMIES: quem anda só nasce em chão firme, quem voa no céu);
 *   - solta ONDAS: de tempos em tempos surge um bicho à frente do jogador,
 *     respeitando um limite de bichos da onda perto da câmera (para até a
 *     luta com o chefão começar). Uma fase pode ter vários grupos de ondas,
 *     e um grupo pode começar mais adiante (FROM_X) e ir apertando o ritmo
 *     até o chefão (CLOSEST_INTERVAL_MS / CLOSEST_MAX_NEAR);
 *   - atualiza só os bichos perto da câmera (os outros "dormem" — mais leve).
 *
 * Escolhe a classe certa de cada tipo (padrão "Factory"):
 *   slime → WalkerEnemy | cobrinha → SnakeEnemy | ouriço → SpikyEnemy
 *   sapo → HopperEnemy | planta → ShooterEnemy
 *   morcego → FlyerEnemy | fantasma → GhostEnemy | vespa → DiverEnemy
 *   águia → EagleEnemy
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
  #walkers;   // bichos de chão (colidem com o terreno)
  #seeds;     // sementes das plantas cuspidoras
  #eggs;      // ovos das águias
  #wavesOn = false;

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
    this.#seeds = new SeedPool(scene);
    this.#eggs = new EggPool(scene);

    // Quem anda precisa pisar no chão e nas plataformas
    scene.physics.add.collider(this.#walkers, levelMap.solids);
    scene.physics.add.collider(this.#walkers, levelMap.platforms);

    // Bicho derrotado sai do combate e da lista
    eventBus.on(GameEvents.ENEMY_DEFEATED, enemy => {
      combat.unregister(enemy);
      this.#enemies = this.#enemies.filter(e => e !== enemy);
    });

    level.ENEMIES.forEach(spawn => this.#spawn(spawn));
    this.#spawnRandomEnemies();
    this.#startWaves();
  }

  /** Projéteis dos bichos (sementes, ovos) — a cena liga as colisões. */
  get projectilePools() {
    return [this.#seeds, this.#eggs];
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
    this.#wavesOn = false;
  }

  /**
   * Atualiza os bichos perto da câmera.
   * @param {number} time
   * @param {PlayerParty} party cada bicho persegue o jogador mais perto
   */
  update(time, party) {
    const margin = GameSettings.ENEMY.ACTIVATION_MARGIN;
    this.#enemies.forEach(enemy => {
      if (!enemy.isAlive) return;
      // Caiu num buraco (ex.: sapo pulando): some
      if (enemy.y > GameSettings.LEVEL.PIT_Y) {
        enemy.takeHit(enemy, Number.MAX_SAFE_INTEGER);
        return;
      }
      if (this.#isNearCamera(enemy.x, margin)) enemy.update(time, party.nearestTo(enemy.x, enemy.y));
      else enemy.sleep();
    });
    this.projectilePools.forEach(pool => pool.update(time));
  }

  /** Cria um bicho e o coloca no jogo. */
  #spawn(spawn) {
    const enemy = EnemyManager.#create(this.#scene, spawn, this.#levelMap, this.#match, this.#eventBus, this.#seeds, this.#eggs);
    this.#enemies.push(enemy);
    this.#combat.register(enemy, true);
    const touchesTerrain = GROUND_BEHAVIORS.includes(enemy.type.BEHAVIOR) || enemy.type.BEHAVIOR === EnemyBehavior.EAGLE;
    if (touchesTerrain) this.#walkers.add(enemy.sprite);
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

  /** Começa a soltar ondas de bichos à frente do jogador (cada grupo no seu ritmo). */
  #startWaves() {
    const waves = this.#level.RANDOM_ENEMIES && this.#level.RANDOM_ENEMIES.WAVES;
    if (!waves) return;
    this.#wavesOn = true;
    [].concat(waves).forEach(wave => this.#scheduleWave(wave));
  }

  /** Agenda o próximo bicho do grupo (o intervalo encurta perto do chefão). */
  #scheduleWave(wave) {
    const progress = Math.max(0, this.#waveProgress(wave));
    const delay = Phaser.Math.Linear(wave.INTERVAL_MS, wave.CLOSEST_INTERVAL_MS ?? wave.INTERVAL_MS, progress);
    this.#scene.time.delayedCall(delay, () => {
      if (!this.#wavesOn) return;
      this.#spawnWave(wave);
      this.#scheduleWave(wave);
    });
  }

  /**
   * Quanto a câmera já andou no trecho do grupo: 0 no começo (FROM_X),
   * 1 perto da arena; negativo = ainda não chegou no trecho.
   */
  #waveProgress(wave) {
    const { SAFE_BEFORE_ARENA } = GameSettings.ENEMY.RANDOM_SPAWN;
    const from = wave.FROM_X || 0;
    const to = this.#level.ARENA_START_X - SAFE_BEFORE_ARENA;
    return Math.min(1, (this.#scene.cameras.main.worldView.right - from) / (to - from));
  }

  /** Um bicho novo logo além da borda direita da tela (se não houver bichos da onda demais). */
  #spawnWave(wave) {
    const progress = this.#waveProgress(wave);
    if (progress < 0) return; // o trecho deste grupo ainda não começou
    const maxNear = Math.round(Phaser.Math.Linear(wave.MAX_NEAR, wave.CLOSEST_MAX_NEAR ?? wave.MAX_NEAR, progress));
    const ofThisWave = enemy => wave.TYPES.some(id => ENEMY_TYPES[id] === enemy.type);
    const nearby = this.#enemies.filter(e => e.isAlive && ofThisWave(e) && this.#isNearCamera(e.x, 0)).length;
    if (nearby >= maxNear) return;

    const { WAVE_AHEAD_X, SAFE_BEFORE_ARENA } = GameSettings.ENEMY.RANDOM_SPAWN;
    const x = this.#scene.cameras.main.worldView.right + WAVE_AHEAD_X;
    if (x > this.#level.ARENA_START_X - SAFE_BEFORE_ARENA) return; // nada de ondas perto da arena

    const type = Phaser.Utils.Array.GetRandom(wave.TYPES);
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
    const height = ENEMY_TYPES[type].SOAR_Y || FLYER_Y; // águias voam mais alto
    const range = ENEMY_TYPES[type].PATROL_RANGE || 0;
    let highestTop = GameSettings.LEVEL.GROUND_TOP;
    for (let px = x - range; px <= x + range; px += 16) {
      highestTop = Math.min(highestTop, this.#levelMap.surfaceYAt(px) ?? highestTop);
    }
    return Math.min(Phaser.Math.Between(height.MIN, height.MAX), highestTop - FLYER_CLEARANCE);
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

  /** Há chão no x e também um pouco antes e depois (não é beirada de buraco)? */
  #isFirmGround(x) {
    const margin = GameSettings.ENEMY.RANDOM_SPAWN.EDGE_MARGIN;
    const map = this.#levelMap;
    return [x - margin, x, x + margin].every(px => map.surfaceYAt(px) !== null);
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
    const groundY = (levelMap.surfaceYAt(spawn.X) ?? GameSettings.LEVEL.GROUND_TOP) - 20;
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
      default:
        throw new RangeError(`Comportamento desconhecido: ${type.BEHAVIOR}`);
    }
  }
}
