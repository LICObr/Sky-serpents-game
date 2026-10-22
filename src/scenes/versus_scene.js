/**
 * versus_scene.js
 * -----------------------------------------------------------------------------
 * 1v1: os dois jogadores lutam entre si numa arena de uma tela só
 * (LEVEL_VERSUS), na TEMPESTADE (chuva, escuridão, relâmpagos iluminando o
 * fundo, raios no chão e rajadas de vento), cheia de ilhas flutuantes. A
 * câmera fica afastada (ZoomedCameras) para os dois aparecerem sempre.
 *
 * Cada golpe do rival tira um coração (o escudinho do agachar segura um) e
 * quem ficar sem corações perde — não tem doação de coração aqui. As opções
 * da tela do 1v1 (MatchConfig.versus):
 *   - poções aparecendo sozinhas nas ilhas;
 *   - quantos bichos ficam na arena (VersusMobs) — eles atacam os dois;
 *   - especial liberado ou proibido.
 *
 * Pausa como na fase: P pausa, ESC sai, R reinicia a luta.
 * -----------------------------------------------------------------------------
 */
class VersusScene extends Phaser.Scene {
  #match;
  #eventBus;
  #background;
  #levelMap;
  #combat;
  #party;
  #storm;
  #enemies;
  #mobs = null;
  #potions;
  #huds = [];
  #resultPending = false; // alguém caiu: o resultado aparece daqui a pouco
  #ended = false;

  constructor() {
    super({ key: SceneKeys.VERSUS });
  }

  /** Recebe as escolhas da tela do 1v1 (personagens e opções). */
  init(data) {
    this.#match = new MatchConfig(data);
    // a Phaser reaproveita a cena (revanche): zera o que é por luta
    this.#mobs = null;
    this.#huds = [];
    this.#resultPending = false;
    this.#ended = false;
  }

  create() {
    const arena = LEVEL_VERSUS;
    const options = this.#match.versus;
    this.#eventBus = new Phaser.Events.EventEmitter();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.#eventBus.removeAllListeners());
    MusicPlayer.ensurePlaying(this);

    // A arena na tempestade, inteira na tela (câmera afastada)
    this.#background = new ParallaxBackground(this, arena.BACKGROUND_TINT, arena.BACKGROUND_TEXTURE);
    this.#levelMap = new LevelMap(this, arena);
    new WeatherEffect(this, TERRAIN_THEMES[arena.TERRAIN].WEATHER);
    this.#setupCameraAndBounds();

    // Os dois jogadores (cada um é alvo do outro), a tempestade, bichos e poções
    this.#combat = new CombatRegistry(this);
    this.#party = this.#createParty(arena);
    this.#party.registerFriendlyFire(this.#combat);
    this.#storm = new Thunderstorm(this, arena.STORM, this.#background, this.#levelMap, this.#party);
    this.#enemies = new EnemyManager(this, arena, this.#levelMap, this.#match, this.#combat, this.#eventBus);
    if (options.mobs > 0) this.#mobs = new VersusMobs(this, this.#enemies, this.#party, arena, options.mobs);
    this.#potions = new PotionManager(this, []);
    if (options.potions) {
      this.#potions.startArenaSpawning(this.#levelMap.platforms.getChildren(), GameSettings.VERSUS.POTION_DELAY_MS);
    }

    // Interface
    if (!options.specials) this.#party.players.forEach(player => player.special.disable());
    this.#huds = this.#party.players.map(player => new PlayerHUD(this, player, this.#eventBus));
    new LevelBanner(this).show('1v1', 'LUTEM!');
    this.#eventBus.on(GameEvents.PLAYER_DIED, () => this.#onKnockedOut());

    this.#setupCollisions();
    this.#setupPause();
  }

  update(time) {
    if (this.#ended) return;
    this.#background.update();
    this.#party.update();
    this.#storm.update(time); // depois de mover: o vento soma no andar
    this.#party.handleAttacks(this.#combat);
    this.#huds.forEach(hud => hud.update());
    this.#enemies.update(time, this.#party);
    if (this.#mobs) this.#mobs.update();
    this.#party.inGame.filter(player => player.hasFallenIntoPit()).forEach(player => this.#onFell(player));
  }

  /**
   * Câmera afastada mostrando a arena toda: a parte de baixo da tela é a
   * mesma das fases (o chão) e o resto mostra o céu cheio de ilhas. Os
   * limites do mundo fecham as laterais e o alto (ninguém sai da tela).
   */
  #setupCameraAndBounds() {
    const { WIDTH, HEIGHT } = GameSettings.SCREEN;
    const { ZOOM } = GameSettings.VERSUS;
    const width = this.#levelMap.worldWidth;
    const viewHeight = HEIGHT / ZOOM;
    const top = HEIGHT - viewHeight;
    this.physics.world.setBounds(0, top, width, viewHeight, true, true, true, false);
    new ZoomedCameras(this, Math.min(ZOOM, WIDTH / width), width / 2, top + viewHeight / 2);
  }

  /** Cada um com as suas teclas, num canto do chão, virados um para o outro. */
  #createParty(arena) {
    const players = this.#match.characters.map((character, slot) => {
      const input = new InputController(this, KeyBindings.inputKeys(slot));
      const player = PlayerFactory.create(this, character, slot, input, this.#eventBus, this.#match);
      player.respawnAt(arena.SPAWN_X[slot], GameSettings.LEVEL.GROUND_TOP);
      player.face(slot === 0);
      player.showPose(PlayerPose.STAND);
      return player;
    });
    return new PlayerParty(players, this.#eventBus, this.#levelMap, { donation: false });
  }

  /** Caiu para fora (não deveria: o chão é inteiro): perde um coração e volta ao seu canto. */
  #onFell(player) {
    player.health.takeDamage({ force: true });
    if (!player.health.isDead) player.respawnAt(LEVEL_VERSUS.SPAWN_X[player.slot], GameSettings.LEVEL.GROUND_TOP);
  }

  /** Alguém ficou sem corações: um tempinho para ver a queda e o resultado. */
  #onKnockedOut() {
    if (this.#resultPending) return;
    this.#resultPending = true;
    this.time.delayedCall(GameSettings.VERSUS.RESULT_DELAY_MS, () => this.#showResult());
  }

  /** Quem ficou de pé venceu (os dois caíram juntos: empate). */
  #showResult() {
    this.#ended = true;
    const standing = this.#party.inGame;
    const winner = standing.length === 1 ? standing[0] : null;
    SoundFx.play(this, winner ? SoundKeys.VICTORY : SoundKeys.GAME_OVER);
    new EndScreen(this, {
      title: winner ? `JOGADOR ${winner.slot + 1} VENCEU!` : 'EMPATE!',
      subtitle: winner ? `${winner.character.NAME} ficou de pé` : 'Os dois caíram juntos',
      color: winner ? '#ffe066' : '#c8c0e0',
      options: [
        { label: '[ENTER] Revanche', key: 'ENTER', action: () => this.scene.restart(this.#match.toSceneData()) },
        { label: '[T] Trocar personagens', key: 'T', action: () => this.scene.start(SceneKeys.VERSUS_SETUP) },
        { label: '[M] Menu principal', key: 'M', action: () => this.scene.start(SceneKeys.TITLE) }
      ]
    });
  }

  /** Chão, ilhas, bichos encostando, projéteis dos bichos, poções e os ataques. */
  #setupCollisions() {
    const physics = this.physics.add;
    const playerSprites = this.#party.sprites;
    const playerOf = sprite => sprite.getData('owner');

    physics.collider(playerSprites, this.#levelMap.solids);
    physics.collider(playerSprites, this.#levelMap.platforms);

    // Encostar em bicho (pisar em cima esmaga)
    physics.overlap(playerSprites, this.#combat.hurtboxes, (playerSprite, part) => {
      const owner = part.getData('owner');
      if (owner) owner.onPlayerContact(playerOf(playerSprite));
    });

    // Projéteis dos bichos: machucam e somem no terreno
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

    physics.overlap(playerSprites, this.#potions.group,
      (playerSprite, potion) => this.#potions.collect(potion, playerOf(playerSprite)));

    this.#party.players.forEach(player => {
      player.bindAttackCollisions(this.#combat, this.#levelMap); // flechas, martelo...
      if (player.attackPlatforms) physics.collider(playerSprites, player.attackPlatforms);
    });
  }

  /** P pausa, R reinicia a luta, ESC sai; a janela perder o foco também pausa. */
  #setupPause() {
    const onKey = (key, action) => this.input.keyboard.on(`keydown-${key}`, event => {
      if (!event.repeat) action();
    });
    onKey('P', () => this.#openPause(PauseMode.PAUSE));
    onKey('R', () => this.#openPause(PauseMode.RESTART));
    onKey('ESC', () => (this.#ended ? this.scene.start(SceneKeys.VERSUS_SETUP) : this.#openPause(PauseMode.MENU)));

    const autoPause = () => this.#openPause(PauseMode.PAUSE);
    this.game.events.on(Phaser.Core.Events.BLUR, autoPause);
    this.game.events.on(Phaser.Core.Events.HIDDEN, autoPause);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(Phaser.Core.Events.BLUR, autoPause);
      this.game.events.off(Phaser.Core.Events.HIDDEN, autoPause);
    });
    this.events.on(Phaser.Scenes.Events.RESUME, () => this.input.keyboard.resetKeys());
  }

  #openPause(mode) {
    if (this.#ended || !this.scene.isActive()) return;
    this.scene.launch(SceneKeys.PAUSE, { mode, matchData: this.#match.toSceneData(), sceneKey: SceneKeys.VERSUS });
    this.scene.pause();
  }
}
