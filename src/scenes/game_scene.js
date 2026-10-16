/**
 * game_scene.js
 * -----------------------------------------------------------------------------
 * Cena de uma FASE. Ela NÃO contém regras de jogo: apenas cria os objetos,
 * liga as colisões e chama o update de cada um na ordem certa.
 * Toda regra mora na classe responsável (Player, Enemy, Boss...).
 *
 * Roteiro da fase:
 *   1. percurso com rolagem lateral (buracos, bichos, poções, checkpoints)
 *   2. ao entrar na arena, ela fecha e o CHEFÃO aparece
 *      (fases ainda sem chefão terminam numa BANDEIRA de chegada)
 *   3. chefão derrotado / bandeira → próxima fase | sem corações → game over
 * -----------------------------------------------------------------------------
 */
class GameScene extends Phaser.Scene {
  #match;
  #eventBus;
  #flow;
  #background;
  #levelMap;
  #combat;
  #player;
  #fireballs;
  #enemies;
  #potions;
  #checkpoints;
  #arena = null;   // arena do chefão (fases com chefão)
  #goal = null;    // bandeira de chegada (fases sem chefão)
  #boss = null;
  #trees;
  #specialHud;
  #banner;

  constructor() {
    super({ key: SceneKeys.GAME });
  }

  /** Recebe as escolhas do menu (personagem, fase, dificuldade). */
  init(data) {
    this.#match = new MatchConfig(data);
    // A Phaser REAPROVEITA a mesma cena ao trocar de fase: o que é "por fase"
    // precisa ser zerado aqui (os inicializadores dos campos só rodam uma vez).
    this.#boss = null;
    this.#arena = null;
    this.#goal = null;
  }

  create() {
    const level = this.#match.level;

    // Canal de comunicação entre as classes (recriado a cada partida)
    this.#eventBus = new Phaser.Events.EventEmitter();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.#eventBus.removeAllListeners());
    this.#flow = new GameFlow(this, this.#match, this.#eventBus);
    MusicPlayer.ensurePlaying(this);

    // Mundo (a ordem de criação define o que fica desenhado por cima)
    this.#background = new ParallaxBackground(this, level.BACKGROUND_TINT, level.BACKGROUND_TEXTURE);
    this.#levelMap = new LevelMap(this, level);
    new WeatherEffect(this, TERRAIN_THEMES[level.TERRAIN].WEATHER); // neve, brasas, brilhos, neblina
    this.#setupWorldBounds();

    // Personagens, inimigos e itens
    this.#combat = new CombatRegistry(this);
    this.#player = PlayerFactory.create(this, new InputController(this), this.#eventBus, this.#match);
    this.#fireballs = new FireballPool(this);
    this.#enemies = new EnemyManager(this, level, this.#levelMap, this.#match, this.#combat, this.#eventBus);
    this.#potions = new PotionManager(this, level.POTIONS, this.#player.health);
    this.#checkpoints = new CheckpointTracker(level.CHECKPOINTS);
    this.#trees = new TreeManager(this, level.TREES || [], this.#levelMap, this.#combat);

    // Final da fase: arena do chefão OU bandeira de chegada
    if (this.#match.hasBoss) {
      this.#arena = new BossArena(this, level.ARENA_START_X);
    } else {
      const goalX = level.ARENA_START_X + GameSettings.GOAL_FLAG.X_IN_END_ZONE;
      this.#goal = new GoalFlag(this, goalX, this.#levelMap.surfaceYAt(goalX), () => this.#onGoalReached());
    }

    // Interface
    new HeartsHUD(this, this.#player.health.maxHearts, this.#eventBus);
    this.#specialHud = new SpecialHUD(this, this.#player);
    // Chefão chamando bichos (ex.: morceguinhos do urso)
    this.#eventBus.on(GameEvents.BOSS_SUMMON, (spawn, onSpawned) => onSpawned(this.#enemies.spawnEnemy(spawn)));
    // Cada bicho derrotado adianta a recarga do especial
    this.#eventBus.on(GameEvents.ENEMY_DEFEATED,
      () => this.#player.special.reduceCooldown(GameSettings.SPECIAL.KILL_REDUCTION_MS));
    new BossHPBar(this, this.#eventBus);
    this.#banner = new LevelBanner(this);
    // Abertura especial (ex.: fase 4) antes do título da fase
    if (level.INTRO) LevelIntro.play(this, level.INTRO, () => this.#banner.show(`FASE ${level.NUMBER}`, level.NAME));
    else this.#banner.show(`FASE ${level.NUMBER}`, level.NAME);

    this.#setupCamera();
    this.#setupCollisions();
    this.input.keyboard.once('keydown-ESC', () => this.scene.start(SceneKeys.MENU));
  }

  update(time) {
    if (this.#flow.hasEnded) return;

    this.#background.update();
    this.#player.update();
    this.#player.handleAttack(this.#combat);
    this.#specialHud.update();
    this.#enemies.update(time, this.#player);
    this.#checkpoints.update(this.#player.x);

    if (this.#arena && this.#arena.shouldStart(this.#player)) this.#startBossFight();
    if (this.#goal) this.#goal.update(this.#player);
    if (this.#boss) {
      this.#boss.update();
      // Fases com fundo próprio (ex.: selva) não trocam para o céu dos dragões
      if (!this.#match.level.BACKGROUND_TEXTURE) this.#background.updatePhase(this.#boss.health.ratio);
      this.#boss.tickCooldowns();
    }

    if (this.#player.hasFallenIntoPit()) this.#onPlayerFell();

    this.#fireballs.update(time);
  }

  /** Fecha a arena e chama o chefão. */
  #startBossFight() {
    this.#arena.lock();
    this.#enemies.stopWaves(); // na arena é só o chefão
    this.#checkpoints.set(this.#arena.respawnX);

    this.#boss = BossFactory.create(
      this, this.#match.boss, this.#arena, this.#player, this.#eventBus, this.#fireballs);
    this.#combat.register(this.#boss, this.#boss.hurtsOnContact);
    this.#potions.startArenaSpawning(this.#levelMap.arenaPlatforms, this.#match.potionDelayMs);

    this.#eventBus.emit(GameEvents.BOSS_FIGHT_STARTED, this.#boss);
    this.#banner.show('CHEFAO!', `${this.#boss.name} — ${this.#match.boss.POWER}`);
  }

  /** Chegou na bandeira: fase concluída. */
  #onGoalReached() {
    this.#enemies.stopWaves();
    this.#flow.victory('Você chegou ao fim da fase!');
  }

  /** Caiu no buraco: perde um coração e volta ao último checkpoint. */
  #onPlayerFell() {
    // Buraco sempre tira coração, mesmo durante o cooldown de dano
    this.#player.health.takeDamage({ force: true });
    if (this.#player.health.isDead) return;
    const x = this.#checkpoints.respawnX;
    this.#player.respawnAt(x, this.#levelMap.surfaceYAt(x) ?? GameSettings.LEVEL.GROUND_TOP);
  }

  /** Limites do mundo: laterais fechadas, embaixo aberto (buracos). */
  #setupWorldBounds() {
    this.physics.world.setBounds(0, 0, this.#levelMap.worldWidth, GameSettings.SCREEN.HEIGHT, true, true, false, false);
  }

  #setupCamera() {
    const camera = this.cameras.main;
    const { LERP, DEADZONE_WIDTH } = GameSettings.CAMERA;
    camera.setBounds(0, 0, this.#levelMap.worldWidth, GameSettings.SCREEN.HEIGHT);
    camera.startFollow(this.#player.sprite, true, LERP, LERP);
    camera.setDeadzone(DEADZONE_WIDTH, GameSettings.SCREEN.HEIGHT);
  }

  /** Registra todas as colisões/sobreposições entre objetos. */
  #setupCollisions() {
    const physics = this.physics.add;
    const playerSprite = this.#player.sprite;

    // Jogador pisa no chão e nas plataformas; árvores bloqueiam a passagem
    physics.collider(playerSprite, this.#levelMap.solids);
    physics.collider(playerSprite, this.#levelMap.platforms);
    physics.collider(playerSprite, this.#trees.group);
    this.#enemies.addObstacles(this.#trees.group); // bichos também esbarram nelas

    // Projétil do chefão atinge o jogador
    physics.overlap(playerSprite, this.#fireballs.group, (_player, fireball) => {
      if (!fireball.active) return;
      // No cooldown de dano o projétil atravessa o jogador sem efeito
      if (this.#player.hitByProjectile(fireball.getData('effect'))) this.#fireballs.recycle(fireball);
    });

    // Projétil do chefão bate nas ilhas flutuantes e no chão e some
    // (grupo x grupo: o Phaser pode entregar os objetos em qualquer ordem)
    const fireballs = this.#fireballs;
    const hitTerrain = (first, second) => {
      const fireball = fireballs.group.contains(first) ? first : second;
      if (fireball.active) fireballs.recycle(fireball);
    };
    physics.overlap(fireballs.group, this.#levelMap.platforms, hitTerrain);
    physics.overlap(fireballs.group, this.#levelMap.solids, hitTerrain);

    // Projéteis dos bichos (sementes das plantas, ovos das águias):
    // machucam o jogador e somem ao bater no terreno
    this.#enemies.projectilePools.forEach(pool => {
      physics.overlap(playerSprite, pool.group, (_player, projectile) => {
        if (!projectile.active) return;
        if (this.#player.hitByProjectile(projectile.getData('effect'))) pool.recycle(projectile);
      });
      const hitsTerrain = (first, second) => {
        const projectile = pool.group.contains(first) ? first : second;
        if (projectile.active) pool.recycle(projectile);
      };
      physics.overlap(pool.group, this.#levelMap.platforms, hitsTerrain);
      physics.overlap(pool.group, this.#levelMap.solids, hitsTerrain);
    });

    // Encostar em bicho/chefão (pisar em cima esmaga o bicho)
    physics.overlap(playerSprite, this.#combat.hurtboxes, (_player, part) => {
      const owner = part.getData('owner');
      if (owner) owner.onPlayerContact(this.#player);
    });

    // Coletar poção
    physics.overlap(playerSprite, this.#potions.group, (_player, potion) => this.#potions.collect(potion));

    // Colisões próprias do ataque (ex.: flechas x inimigos e x terreno)
    this.#player.bindAttackCollisions(this.#combat, this.#levelMap);

    // Flechas cravadas viram plataformas onde o jogador pode subir
    const attackPlatforms = this.#player.attackPlatforms;
    if (attackPlatforms) physics.collider(playerSprite, attackPlatforms);
  }
}
