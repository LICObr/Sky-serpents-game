/**
 * enemy.js
 * -----------------------------------------------------------------------------
 * Classe base ABSTRATA dos bichos pequenos. Cuida do que é comum a todos:
 * vida, animação de 2 quadros, piscar (e tremer a tela) ao apanhar, morrer,
 * e a regra de "pisar em cima mata".
 *
 * Cada subclasse implementa apenas behave() — o jeito de se mover:
 *   WalkerEnemy (anda) → SnakeEnemy (cobrinha), SpikyEnemy (ouriço)
 *   FlyerEnemy (voa)   → GhostEnemy (some), DiverEnemy (vespa, rasante)
 *   HopperEnemy (sapo, pula) → TongueFrogEnemy (língua), BullfrogEnemy (sapo-boi)
 *   ShooterEnemy (planta, cospe sementes)
 *   EagleEnemy (águia: voa alto, mergulha e depois anda no chão)
 *   SwimmerEnemy (jacaré, cobra-d'água), LeaperGatorEnemy, LogGatorEnemy,
 *   TurtleEnemy, PiranhaEnemy, EelEnemy, HeronEnemy, LeechEnemy (pântano)
 * -----------------------------------------------------------------------------
 */
class Enemy extends GameEntity {
  #type;
  #eventBus;
  #hp;
  #speed;
  #frameIndex = 0;
  #nextFrameTime = 0;
  #dying = false;

  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {object} type entrada de ENEMY_TYPES
   * @param {MatchConfig} match para ajustar vida/velocidade à dificuldade
   * @param {Phaser.Events.EventEmitter} eventBus
   */
  constructor(scene, x, y, type, match, eventBus) {
    if (new.target === Enemy) {
      throw new TypeError('Enemy é abstrata: use uma subclasse (WalkerEnemy, FlyerEnemy...).');
    }
    const sprite = scene.physics.add
      .sprite(x, y, type.FRAMES[0])
      .setScale(type.SCALE)
      .setDepth(GameSettings.ENEMY.DEPTH);

    super(scene, sprite);
    this.#type = type;
    this.#eventBus = eventBus;
    this.#hp = match.enemyHp(type.HP);
    this.#speed = match.enemySpeed(type.SPEED);
    this.restoreTint();
  }

  get type()  { return this.#type; }
  get speed() { return this.#speed; }

  /** @override */
  get meleeReach() { return this.#type.MELEE_REACH; }

  /** Vivo e não está morrendo (ainda se mexe). */
  get isActive() { return this.isAlive && !this.#dying; }

  /** @override Morrendo não apanha mais. */
  get canBeHit() { return this.isActive; }

  /** Machuca o jogador ao encostar? (o fantasma sumido não machuca) */
  get canHurt() { return this.canBeHit; }

  /** Limita a vida a no máximo `hp` (ex.: águia fica fraca ao pousar). */
  weakenTo(hp) {
    this.#hp = Math.min(this.#hp, hp);
  }

  /** Dá para matar pisando em cima? (o ouriço espinhoso e quem tem STOMP_HURTS não deixam) */
  get stompable() { return !this.#type.STOMP_HURTS; }

  /** Troca os quadros sozinho no ritmo de FRAME_MS? (o sapo controla os dele) */
  get cyclesFrames() { return true; }

  /** Volta para a cor própria do bicho (TINT) ou a cor original. */
  restoreTint() {
    if (this.#type.TINT) this.sprite.setTint(this.#type.TINT);
    else this.sprite.clearTint();
  }

  /** Efeito ao encostar (ex.: slime de gelo deixa lento). */
  get contactEffect() {
    return this.#type.CONTACT_EFFECT || ProjectileEffect.NONE;
  }

  /**
   * Atualiza o bicho (chamado só quando está perto da câmera).
   * @param {number} time tempo atual da cena (ms)
   * @param {Player} player
   */
  update(time, player) {
    if (!this.isActive) return;
    if (this.cyclesFrames) this.#animate(time);
    this.behave(time, player);
  }

  /** Movimento próprio de cada tipo. Subclasses DEVEM sobrescrever. */
  // eslint-disable-next-line no-unused-vars
  behave(time, player) {
    throw new Error(`${this.constructor.name} precisa implementar behave().`);
  }

  /** Parado (fora da câmera, economiza processamento). */
  sleep() {
    if (this.isActive) this.sprite.setVelocityX(0);
  }

  /** Caiu num buraco ou afundou na lagoa: some na hora (mesmo se não pudesse apanhar). */
  vanish() {
    if (this.isActive) this.#die();
  }

  /** @override */
  takeHit(source, damage) {
    if (!this.canBeHit) return;

    this.#hp -= damage;
    this.#flash();
    if (source !== this) this.#shakeScreen(); // (cair no buraco não treme)

    const direction = Math.sign(this.x - source.x) || 1;
    this.sprite.setVelocityX(direction * GameSettings.ENEMY.KNOCKBACK_X);

    if (this.#hp <= 0) this.#die();
  }

  /** Jogador encostou: se veio caindo por cima, esmaga; senão se machuca. */
  onPlayerContact(player) {
    if (!this.canHurt) return;

    const fromAbove = player.isFalling &&
      player.feetY <= this.sprite.body.top + GameSettings.ENEMY.STOMP_TOLERANCE;

    if (fromAbove && this.stompable) {
      this.takeHit(player, Number.MAX_SAFE_INTEGER);
      player.bounce();
    } else {
      player.hitByContact(this.contactEffect);
      if (fromAbove) player.bounce(); // pisou em espinho: machuca e quica
    }
  }

  /** Alterna entre os quadros de animação. */
  #animate(time) {
    if (time < this.#nextFrameTime) return;
    this.#nextFrameTime = time + this.#type.FRAME_MS;
    this.#frameIndex = (this.#frameIndex + 1) % this.#type.FRAMES.length;
    this.setTextureIfChanged(this.#type.FRAMES[this.#frameIndex]);
  }

  /** Tremidinha na tela ao acertar o bicho (igual à do dragão, mais suave). */
  #shakeScreen() {
    const { DURATION_MS, INTENSITY } = GameSettings.ENEMY.HIT_SHAKE;
    this.scene.cameras.main.shake(DURATION_MS, INTENSITY);
  }

  /** Pisca em branco ao apanhar. */
  #flash() {
    const sprite = this.sprite;
    sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(GameSettings.ENEMY.HIT_FLASH_MS, () => {
      if (sprite.active) this.restoreTint();
    });
  }

  /** Animação de morte (achata e some) e aviso para quem estiver ouvindo. */
  #die() {
    this.#dying = true;
    this.sprite.body.enable = false;
    this.#eventBus.emit(GameEvents.ENEMY_DEFEATED, this);

    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      scaleY: 0,
      duration: GameSettings.ENEMY.DEATH_FADE_MS,
      onComplete: () => this.destroy()
    });
  }
}
