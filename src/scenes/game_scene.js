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
 *      Luta em etapas: se o chefão tem NEXT_BOSS, o próximo aparece depois dele
 *   3. chefão derrotado / bandeira → próxima fase | sem corações → game over
 *
 * Pausa: P (ou o botão II no celular) e a janela perder o foco abrem a
 * PauseScene; ESC e R pedem confirmação antes de sair ou reiniciar.
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
  #coins;
  #checkpoints;
  #arena = null;   // arena do chefão (fases com chefão)
  #goal = null;    // bandeira de chegada (fases sem chefão)
  #boss = null;
  #trees;
  #specialHud;
  #banner;
  #touch;
  #progress;
  #arenaBackdrop = null; // cenário próprio da arena (aparece no fim do percurso)

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
    // Cenário próprio da arena (ex.: a clareira da colmeia na fase 5): preso à
    // tela, vai cobrindo o fundo aos poucos no fim do percurso
    this.#arenaBackdrop = level.ARENA && level.ARENA.BACKDROP
      ? this.add.image(0, 0, level.ARENA.BACKDROP).setOrigin(0, 0).setScrollFactor(0).setAlpha(0)
      : null;
    this.#levelMap = new LevelMap(this, level);
    new WeatherEffect(this, TERRAIN_THEMES[level.TERRAIN].WEATHER); // neve, brasas, brilhos, neblina, pólen
    this.#setupWorldBounds();

    // Personagens, inimigos e itens
    this.#combat = new CombatRegistry(this);
    this.#touch = new TouchControls(this, {
      onPause: () => this.#openPause(PauseMode.PAUSE),
      canUse: () => !this.#flow.hasEnded
    });
    this.#player = PlayerFactory.create(this, new InputController(this, this.#touch), this.#eventBus, this.#match);
    this.#fireballs = new FireballPool(this);
    this.#enemies = new EnemyManager(this, level, this.#levelMap, this.#match, this.#combat, this.#eventBus);
    this.#potions = new PotionManager(this, level.POTIONS, this.#player.health);
    this.#coins = new CoinManager(this, this.#levelMap, this.#eventBus);
    this.#checkpoints = new CheckpointTracker(level.CHECKPOINTS);
    this.#trees = new TreeManager(this, level.TREES || [], this.#levelMap, this.#combat,
      TERRAIN_THEMES[level.TERRAIN].TREE_TEXTURES);

    // Final da fase: arena do chefão OU bandeira de chegada
    const finishX = this.#match.hasBoss ? level.ARENA_START_X : level.ARENA_START_X + GameSettings.GOAL_FLAG.X_IN_END_ZONE;
    if (this.#match.hasBoss) {
      this.#arena = new BossArena(this, level.ARENA_START_X);
    } else {
      this.#goal = new GoalFlag(this, finishX, this.#levelMap.surfaceYAt(finishX), () => this.#onGoalReached());
    }

    // Interface
    new HeartsHUD(this, this.#player.health.maxHearts, this.#eventBus);
    new CoinHUD(this, this.#eventBus);
    this.#progress = new LevelProgressBar(this, finishX, this.#eventBus);
    this.#specialHud = new SpecialHUD(this, this.#player);
    // Chefão chamando bichos (ex.: morceguinhos do urso, vespas da colmeia)
    this.#eventBus.on(GameEvents.BOSS_SUMMON, (spawn, onSpawned) => onSpawned(this.#enemies.spawnEnemy(spawn)));
    // Luta em etapas: derrotou um chefão que tem "próximo" → ele aparece
    this.#eventBus.on(GameEvents.BOSS_DEFEATED, boss => {
      if (!boss.stats.NEXT_BOSS) return;
      this.time.delayedCall(GameSettings.BOSS.NEXT_BOSS_DELAY_MS, () => this.#spawnBoss(this.#match.bossStats(boss.stats.NEXT_BOSS)));
    });
    // Cada bicho derrotado adianta a recarga do especial
    this.#eventBus.on(GameEvents.ENEMY_DEFEATED,
      () => this.#player.special.reduceCooldown(GameSettings.SPECIAL.KILL_REDUCTION_MS));
    new BossHPBar(this, this.#eventBus);
    this.#banner = new LevelBanner(this);
    // Abertura com a imagem do chefão antes do título da fase
    if (level.INTRO) LevelIntro.play(this, level.INTRO, () => this.#banner.show(`FASE ${level.NUMBER}`, level.NAME));
    else this.#banner.show(`FASE ${level.NUMBER}`, level.NAME);

    this.#setupCamera();
    this.#setupCollisions();
    this.#setupPause();
  }

  update(time) {
    if (this.#flow.hasEnded) return;

    this.#background.update();
    this.#player.update();
    this.#player.handleAttack(this.#combat);
    this.#specialHud.update();
    this.#progress.update(this.#player.x);
    this.#enemies.update(time, this.#player);
    this.#coins.update();
    this.#checkpoints.update(this.#player.x);

    if (this.#arenaBackdrop && !this.#arena.isStarted) this.#fadeInArenaBackdrop();
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

  /** Fecha a arena e chama o (primeiro) chefão. */
  #startBossFight() {
    this.#arena.lock();
    this.#enemies.stopWaves(); // na arena é só o chefão
    this.#checkpoints.set(this.#arena.respawnX);
    this.#potions.startArenaSpawning(this.#levelMap.arenaPlatforms, this.#match.potionDelayMs);
    if (this.#arenaBackdrop) {
      this.tweens.add({ targets: this.#arenaBackdrop, alpha: 1, duration: GameSettings.BACKGROUND.PHASE_FADE_MS });
    }
    this.#spawnBoss(this.#match.boss);
  }

  /** Cria um chefão, coloca no combate e mostra o nome dele. */
  #spawnBoss(stats) {
    this.#boss = BossFactory.create(this, stats, this.#arena, this.#player, this.#eventBus, this.#fireballs);
    this.#combat.register(this.#boss, this.#boss.hurtsOnContact);
    this.#eventBus.emit(GameEvents.BOSS_FIGHT_STARTED, this.#boss);
    this.#banner.show('CHEFAO!', `${this.#boss.name} — ${stats.POWER}`);
  }

  /**
   * Fim do percurso: o cenário da arena vai aparecendo conforme o jogador se
   * aproxima (uma imagem sobrescrevendo a outra) e fica inteiro quando a luta começa.
   */
  #fadeInArenaBackdrop() {
    const { ARENA_BACKDROP_FADE_PX, ARENA_TRIGGER_OFFSET } = GameSettings.LEVEL;
    const fightStartX = this.#arena.left + ARENA_TRIGGER_OFFSET;
    const progress = 1 - (fightStartX - this.#player.x) / ARENA_BACKDROP_FADE_PX;
    this.#arenaBackdrop.setAlpha(Phaser.Math.Clamp(progress, 0, 1));
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

  /**
   * Teclas de pausa e pausa automática:
   *   P → pausa | ESC → voltar ao menu? | R → reiniciar a fase?
   *   janela perdeu o foco / minimizou / trocou de aba → pausa
   */
  #setupPause() {
    const onKey = (key, action) => this.input.keyboard.on(`keydown-${key}`, event => {
      if (!event.repeat) action();
    });
    onKey('P', () => this.#openPause(PauseMode.PAUSE));
    onKey('R', () => this.#openPause(PauseMode.RESTART));
    // Depois do fim da fase o ESC volta direto para o menu (não há o que perder)
    onKey('ESC', () => (this.#flow.hasEnded ? this.scene.start(SceneKeys.MENU) : this.#openPause(PauseMode.MENU)));

    const autoPause = () => this.#openPause(PauseMode.PAUSE);
    this.game.events.on(Phaser.Core.Events.BLUR, autoPause);
    this.game.events.on(Phaser.Core.Events.HIDDEN, autoPause);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(Phaser.Core.Events.BLUR, autoPause);
      this.game.events.off(Phaser.Core.Events.HIDDEN, autoPause);
    });

    // Ao voltar da pausa, solta teclas/dedo que ficaram "presos" enquanto ela estava aberta
    this.events.on(Phaser.Scenes.Events.RESUME, () => {
      this.input.keyboard.resetKeys();
      this.#touch.reset();
    });
  }

  /** Pausa a fase e abre a caixinha (se a fase ainda estiver rolando). */
  #openPause(mode) {
    if (this.#flow.hasEnded || !this.scene.isActive()) return;
    this.scene.launch(SceneKeys.PAUSE, { mode, matchData: this.#match.toSceneData() });
    this.scene.pause();
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

    // Coletar poção e moeda
    physics.overlap(playerSprite, this.#potions.group, (_player, potion) => this.#potions.collect(potion));
    physics.overlap(playerSprite, this.#coins.group, (_player, coin) => this.#coins.collect(coin));

    // Colisões próprias do ataque (ex.: flechas x inimigos e x terreno)
    this.#player.bindAttackCollisions(this.#combat, this.#levelMap);

    // Flechas cravadas viram plataformas onde o jogador pode subir
    const attackPlatforms = this.#player.attackPlatforms;
    if (attackPlatforms) physics.collider(playerSprite, attackPlatforms);
  }
}
