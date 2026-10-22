/**
 * coin_manager.js
 * -----------------------------------------------------------------------------
 * MOEDAS que caem dos bichos:
 *   - cada bicho derrotado tem 30% de chance (COIN.DROP_CHANCE_PERCENT) de
 *     deixar uma moeda, que dá um pulinho e cai no chão girando;
 *   - encostar pega a moeda: ela vai para a carteira (CoinWallet) e o
 *     contador do canto da tela atualiza (evento COINS_CHANGED);
 *   - moeda esquecida pisca e some depois de um tempo (ou se cair num buraco).
 * -----------------------------------------------------------------------------
 */
class CoinManager {
  #scene;
  #eventBus;
  #group;

  /**
   * @param {Phaser.Scene} scene
   * @param {LevelMap} levelMap terreno onde as moedas caem
   * @param {Phaser.Events.EventEmitter} eventBus
   */
  constructor(scene, levelMap, eventBus) {
    this.#scene = scene;
    this.#eventBus = eventBus;
    this.#group = scene.physics.add.group();
    scene.physics.add.collider(this.#group, levelMap.solids);
    scene.physics.add.collider(this.#group, levelMap.platforms);

    eventBus.on(GameEvents.ENEMY_DEFEATED, enemy => {
      if (enemy.isCharmed) return; // aliado do bardo que morre não deixa moeda
      if (RandomUtils.chance(GameSettings.COIN.DROP_CHANCE_PERCENT)) this.#drop(enemy.x, enemy.y);
    });
  }

  /** Grupo de física (a cena liga a coleta com o jogador). */
  get group() {
    return this.#group;
  }

  /** Some com moedas que caíram em buracos (chamar a cada frame). */
  update() {
    this.#group.getChildren().forEach(coin => {
      if (coin.active && coin.y > GameSettings.LEVEL.PIT_Y) coin.destroy();
    });
  }

  /** O jogador encostou na moeda. */
  collect(coin) {
    if (!coin.active || coin.getData('collected')) return;
    coin.setData('collected', true);
    coin.body.enable = false;
    this.#eventBus.emit(GameEvents.COINS_CHANGED, CoinWallet.add(1));
    SoundFx.play(coin.scene, SoundKeys.COIN, { volume: 0.7 });

    // sobe brilhando e some
    this.#scene.tweens.killTweensOf(coin);
    this.#scene.tweens.add({
      targets: coin, y: coin.y - 36, alpha: 0, scale: coin.scale * 1.4, duration: 320,
      onComplete: () => coin.destroy()
    });
  }

  /** Moeda saindo do bicho com um pulinho, girando até sumir. */
  #drop(x, y) {
    const cfg = GameSettings.COIN;
    const coin = this.#group.create(x, y, cfg.TEXTURE).setScale(cfg.SCALE).setDepth(GameSettings.ENEMY.DEPTH + 0.5);
    coin.body.setBounce(cfg.BOUNCE).setDragX(cfg.DRAG_X);
    coin.setVelocity(Phaser.Math.Between(-cfg.POP_VELOCITY.X, cfg.POP_VELOCITY.X), cfg.POP_VELOCITY.Y);

    // "gira": achata e volta (como uma moeda de lado)
    this.#scene.tweens.add({
      targets: coin, scaleX: cfg.SCALE * 0.2, duration: cfg.SPIN_MS / 2,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
    // pisca antes de sumir
    this.#scene.time.delayedCall(cfg.LIFETIME_MS - cfg.BLINK_BEFORE_MS, () => {
      if (!coin.active || coin.getData('collected')) return;
      this.#scene.tweens.add({
        targets: coin, alpha: 0.2, duration: 120, yoyo: true, repeat: Math.floor(cfg.BLINK_BEFORE_MS / 240),
        onComplete: () => { if (coin.active && !coin.getData('collected')) coin.destroy(); }
      });
    });
  }
}
