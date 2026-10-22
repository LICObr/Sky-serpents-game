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
 *
 * 1 ou 2 jogadores (PlayerParty): bichos e chefões miram no mais perto, e
 * com dois a câmera (PartyCamera) não deixa ninguém sair da tela.
 *
 * Extras de algumas fases: pedras caindo (caverna), lagoas para nadar, lama
 * e vitórias-régias (pântano), tempestade com relâmpagos e vento.
 * -----------------------------------------------------------------------------
 */
class GameScene extends Phaser.Scene {
  #match;
  #eventBus;
  #timer;
  #flow;
  #background;
  #levelMap;
  #combat;
  #party;          // os jogadores (1 ou 2)
  #camera;
  #fireballs;
  #enemies;
  #potions;
  #coins;
  #checkpoints;
  #arena = null;   // arena do chefão (fases com chefão)
  #goal = null;    // bandeira de chegada (fases sem chefão)
  #boss = null;
  #trees;
  #playerHuds;
  #clock;
  #banner;
  #touch;
  #progress;
  #arenaBackdrop = null; // cenário próprio da arena (aparece no fim do percurso)
  #fallingRocks = null;  // pedras caindo do teto (caverna)
  #swamp = null;         // água das lagoas e lama (pântano)
  #tutorial = null;      // dicas das teclas e cartões dos bichos (tutorial)
  #storm = null;         // chuva, vento e relâmpagos (tempestade)
  #lilyPads = null;      // vitórias-régias (pântano)

  constructor() {
    super({ key: SceneKeys.GAME });
  }

  /** Recebe as escolhas do menu (personagens, fase, dificuldade). */
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
    this.#timer = new LevelTimer();
    this.#flow = new GameFlow(this, this.#match, this.#eventBus, this.#timer);
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
    this.#party = this.#createParty();
    this.#party.registerFriendlyFire(this.#combat); // 2 jogadores: um pode acertar o outro
    this.#fallingRocks = level.FALLING_ROCKS
      ? new FallingRocks(this, this.#levelMap, this.#party, level.FALLING_ROCKS)
      : null;
    this.#swamp = level.WATER || level.MUD ? new SwampZones(this, level, this.#levelMap, this.#party) : null;
    this.#lilyPads = level.LILY_PADS ? new LilyPads(this, level.LILY_PADS, this.#levelMap) : null;
    this.#storm = level.STORM ? new Thunderstorm(this, level.STORM, this.#background, this.#levelMap, this.#party) : null;
    this.#fireballs = new FireballPool(this);
    this.#enemies = new EnemyManager(this, level, this.#levelMap, this.#match, this.#combat, this.#eventBus);
    this.#potions = new PotionManager(this, level.POTIONS);
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
    // corações, especial e escudinho de cada jogador
    this.#playerHuds = this.#party.players.map(player => new PlayerHUD(this, player, this.#eventBus));
    new CoinHUD(this, this.#eventBus);
    this.#progress = new LevelProgressBar(this, finishX, this.#eventBus, this.#party.players);
    this.#clock = new LevelClockHUD(this, this.#timer);
    // Chefão chamando bichos (ex.: morceguinhos do urso, vespas da colmeia)
    this.#eventBus.on(GameEvents.BOSS_SUMMON, (spawn, onSpawned) => onSpawned(this.#enemies.spawnEnemy(spawn)));
    // Luta em etapas: derrotou um chefão que tem "próximo" → ele aparece
    this.#eventBus.on(GameEvents.BOSS_DEFEATED, boss => {
      if (!boss.stats.NEXT_BOSS) return;
      this.time.delayedCall(GameSettings.BOSS.NEXT_BOSS_DELAY_MS, () => this.#spawnBoss(this.#match.bossStats(boss.stats.NEXT_BOSS)));
    });
    // Cada bicho derrotado adianta a recarga do especial (aliado do bardo que morre não conta)
    this.#eventBus.on(GameEvents.ENEMY_DEFEATED, enemy => {
      if (!enemy.isCharmed) this.#party.reduceSpecialCooldowns(GameSettings.SPECIAL.KILL_REDUCTION_MS);
    });
    new BossHPBar(this, this.#eventBus);
    this.#banner = new LevelBanner(this);
    // Abertura com a imagem do chefão antes do título da fase
    // (o número que aparece é a posição na lista: o tutorial é a Fase 1)
    const title = `FASE ${this.#match.levelIndex + 1}`;
    if (level.INTRO) LevelIntro.play(this, level.INTRO, () => this.#banner.show(title, level.NAME));
    else this.#banner.show(title, level.NAME);
    this.#tutorial = level.TUTORIAL ? new TutorialGuide(this, level.TUTORIAL, this.#match.isCoop) : null;

    this.#camera = new PartyCamera(this, this.#party, this.#levelMap);
    this.#setupCollisions();
    this.#setupPause();
  }

  update(time, delta) {
    if (this.#flow.hasEnded) return;
    if (this.#tutorial) {
      this.#tutorial.update(this.#party.frontX);
      if (this.#tutorial.isHolding) return; // apresentando um bicho: o jogo espera
    }

    this.#timer.tick(delta);
    this.#clock.update();
    this.#background.update();
    if (this.#swamp) this.#swamp.update(time); // antes de mover: água e lama mudam o andar
    this.#party.update();
    if (this.#storm) this.#storm.update(time); // depois de mover: o vento soma no andar
    this.#camera.update(); // depois de mover: com 2 jogadores ninguém sai da tela
    this.#party.handleAttacks(this.#combat);
    this.#playerHuds.forEach(hud => hud.update());
    this.#progress.update();
    this.#enemies.update(time, this.#party);
    this.#coins.update();
    if (this.#fallingRocks) this.#fallingRocks.update(time);
    if (this.#lilyPads) this.#lilyPads.update(time);
    this.#checkpoints.update(this.#party.frontX);

    if (this.#arenaBackdrop && !this.#arena.isStarted) this.#fadeInArenaBackdrop();
    if (this.#arena && this.#arena.shouldStart(this.#party.inGame)) this.#startBossFight();
    if (this.#goal) this.#goal.update(this.#party.frontX);
    if (this.#boss) {
      this.#boss.update();
      // Fases com fundo próprio (ex.: selva) não trocam para o céu dos dragões
      if (!this.#match.level.BACKGROUND_TEXTURE) this.#background.updatePhase(this.#boss.health.ratio);
      this.#boss.tickCooldowns();
    }

    this.#party.inGame.filter(player => player.hasFallenIntoPit()).forEach(player => this.#onPlayerFell(player));

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
    this.#boss = BossFactory.create(this, stats, this.#arena, this.#party, this.#eventBus, this.#fireballs);
    this.#combat.register(this.#boss, this.#boss.hurtsOnContact);
    this.#eventBus.emit(GameEvents.BOSS_FIGHT_STARTED, this.#boss);
    this.#banner.show('CHEFAO!', `${this.#boss.name} — ${stats.POWER}`);
  }

  /**
   * Fim do percurso: o cenário da arena vai aparecendo conforme os jogadores
   * se aproximam (uma imagem sobrescrevendo a outra) e fica inteiro quando a luta começa.
   */
  #fadeInArenaBackdrop() {
    const { ARENA_BACKDROP_FADE_PX, ARENA_TRIGGER_OFFSET } = GameSettings.LEVEL;
    const fightStartX = this.#arena.left + ARENA_TRIGGER_OFFSET;
    const progress = 1 - (fightStartX - this.#party.frontX) / ARENA_BACKDROP_FADE_PX;
    this.#arenaBackdrop.setAlpha(Phaser.Math.Clamp(progress, 0, 1));
  }

  /** Chegou na bandeira: fase concluída. */
  #onGoalReached() {
    this.#enemies.stopWaves();
    this.#flow.victory('Você chegou ao fim da fase!');
  }

  /**
   * Caiu no buraco: perde um coração e volta ao lado do parceiro (2 jogadores)
   * ou ao último checkpoint.
   */
  #onPlayerFell(player) {
    // Buraco sempre tira coração, mesmo durante o cooldown de dano
    player.health.takeDamage({ force: true });
    if (player.health.isDead) return; // (com 2 jogadores ele está fora até o fim da fase)
    const spot = this.#party.spotNearPartner(player);
    if (spot) {
      player.respawnAt(spot.x, spot.groundY);
      return;
    }
    const x = this.#checkpoints.respawnX;
    player.respawnAt(x, this.#levelMap.surfaceYAt(x) ?? GameSettings.LEVEL.GROUND_TOP);
  }

  /** Cria os jogadores: sozinho valem as teclas dos dois; com dois, cada um tem as suas. */
  #createParty() {
    const coop = this.#match.isCoop;
    const players = this.#match.characters.map((character, slot) => {
      const keys = coop ? KeyBindings.inputKeys(slot) : KeyBindings.soloInputKeys();
      const input = new InputController(this, keys, slot === 0 ? this.#touch : null);
      return PlayerFactory.create(this, character, slot, input, this.#eventBus, this.#match);
    });
    return new PlayerParty(players, this.#eventBus, this.#levelMap);
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
    onKey('ESC', () => (this.#flow.hasEnded ? this.scene.start(SceneKeys.TITLE) : this.#openPause(PauseMode.MENU)));

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

  /** Limites do mundo: laterais fechadas, em cima e embaixo abertos (buracos). */
  #setupWorldBounds() {
    const { worldWidth, worldTop } = this.#levelMap;
    this.physics.world.setBounds(0, worldTop, worldWidth, GameSettings.SCREEN.HEIGHT - worldTop, true, true, false, false);
  }

  /**
   * Registra todas as colisões/sobreposições entre objetos. Valem para todos
   * os jogadores: cada callback recebe o sprite de quem encostou.
   */
  #setupCollisions() {
    const physics = this.physics.add;
    const playerSprites = this.#party.sprites;
    const playerOf = sprite => sprite.getData('owner');

    // Jogador pisa no chão e nas plataformas; árvores bloqueiam a passagem
    physics.collider(playerSprites, this.#levelMap.solids);
    physics.collider(playerSprites, this.#levelMap.platforms);
    physics.collider(playerSprites, this.#trees.group);
    this.#enemies.addObstacles(this.#trees.group); // bichos também esbarram nelas

    // Pântano: vitórias-régias afundam com o peso do jogador (os sapos ficam em
    // cima delas sem afundar) e o jacaré-tronco aguenta o jogador até acordar
    if (this.#lilyPads) {
      physics.collider(playerSprites, this.#lilyPads.group, (_playerSprite, pad) => this.#lilyPads.onStoodOn(pad));
      this.#enemies.addObstacles(this.#lilyPads.group);
    }
    physics.collider(playerSprites, this.#enemies.standables,
      (_playerSprite, log) => log.getData('owner').onStoodOn(),
      (_playerSprite, log) => log.getData('owner').isStandable);

    // Projétil do chefão atinge o jogador
    physics.overlap(playerSprites, this.#fireballs.group, (playerSprite, fireball) => {
      if (!fireball.active) return;
      // No cooldown de dano o projétil atravessa o jogador sem efeito
      if (playerOf(playerSprite).hitByProjectile(fireball.getData('effect'))) this.#fireballs.recycle(fireball);
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
      physics.overlap(playerSprites, pool.group, (playerSprite, projectile) => {
        if (!projectile.active) return;
        if (playerOf(playerSprite).hitByProjectile(projectile.getData('effect'))) pool.recycle(projectile);
      });
      const hitsTerrain = (first, second) => {
        const projectile = pool.group.contains(first) ? first : second;
        if (projectile.active) pool.recycle(projectile);
      };
      physics.overlap(pool.group, this.#levelMap.platforms, hitsTerrain);
      physics.overlap(pool.group, this.#levelMap.solids, hitsTerrain);
    });

    // Encostar em bicho/chefão (pisar em cima esmaga o bicho)
    physics.overlap(playerSprites, this.#combat.hurtboxes, (playerSprite, part) => {
      const owner = part.getData('owner');
      if (owner) owner.onPlayerContact(playerOf(playerSprite));
    });

    // Coletar poção (cura quem pegou) e moeda
    physics.overlap(playerSprites, this.#potions.group,
      (playerSprite, potion) => this.#potions.collect(potion, playerOf(playerSprite)));
    physics.overlap(playerSprites, this.#coins.group, (_player, coin) => this.#coins.collect(coin));

    this.#party.players.forEach(player => {
      // Colisões próprias do ataque (ex.: flechas x inimigos e x terreno)
      player.bindAttackCollisions(this.#combat, this.#levelMap);
      // Flechas cravadas viram plataformas onde qualquer jogador pode subir
      if (player.attackPlatforms) physics.collider(playerSprites, player.attackPlatforms);
    });
  }
}
