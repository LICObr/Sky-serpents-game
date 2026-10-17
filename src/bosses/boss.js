/**
 * boss.js
 * -----------------------------------------------------------------------------
 * Classe base ABSTRATA dos chefões (padrão "Template Method").
 *
 * A base resolve o que é igual para qualquer chefão:
 *   - vida (BossHealth) e o piscar ao apanhar (só visual)
 *   - fluxo de "levar golpe" → reação → dano → morrer
 *   - aviso de derrota (BOSS_DEFEATED)
 *
 * Cada golpe conta: várias flechas chegando juntas somam o dano de cada uma.
 *
 * As subclasses (DragonBoss, SerpentBoss, PolarBearBoss) implementam:
 *   - behave()       → movimento e ataques do frame
 *   - onHit(source)  → reação visual ao apanhar
 *   - destroyParts() → remover os sprites ao morrer
 *   - mouth          → de onde saem os projéteis
 * -----------------------------------------------------------------------------
 */
class Boss extends GameEntity {
  #stats;
  #arena;
  #players;
  #eventBus;
  #health;
  #hitBlink = new FrameCooldown(); // tempo piscando depois de apanhar (não bloqueia dano)
  #defeated = false;

  /**
   * @param {Phaser.Scene} scene
   * @param {Phaser.Physics.Arcade.Sprite} sprite sprite principal
   * @param {object} stats estatísticas já ajustadas (MatchConfig.boss)
   * @param {BossArena} arena área da luta
   * @param {PlayerParty} players jogadores (o chefão mira no mais perto)
   * @param {Phaser.Events.EventEmitter} eventBus
   */
  constructor(scene, sprite, stats, arena, players, eventBus) {
    if (new.target === Boss) {
      throw new TypeError('Boss é abstrata: use DragonBoss ou SerpentBoss (BossFactory).');
    }
    super(scene, sprite);
    this.#stats = stats;
    this.#arena = arena;
    this.#players = players;
    this.#eventBus = eventBus;
    this.#health = new BossHealth(stats.MAX_HP, eventBus);
  }

  get stats()  { return this.#stats; }
  get arena()  { return this.#arena; }
  get players() { return this.#players; }
  /** Jogador mais perto (é nele que o chefão mira). */
  get target() { return this.#players.nearestTo(this.x, this.y); }
  get health() { return this.#health; }
  get name()   { return this.#stats.NAME; }

  /** Encostar no chefão machuca? (a serpente sim, o dragão original não) */
  get hurtsOnContact() {
    return Boolean(this.#stats.CONTACT_DAMAGE);
  }

  /** Ainda está piscando por ter apanhado? (só visual) */
  get isHitBlinking() {
    return !this.#hitBlink.isReady;
  }

  /** De onde saem os projéteis. Subclasses podem sobrescrever. */
  get mouth() {
    return { x: this.x, y: this.y };
  }

  /** @override */
  get canBeHit() {
    return this.isAlive && !this.#defeated;
  }

  /** Lógica do frame. */
  update() {
    if (!this.canBeHit) return;
    this.behave();
  }

  /** Movimento e ataques do frame. Subclasses DEVEM sobrescrever. */
  behave() {
    throw new Error(`${this.constructor.name} precisa implementar behave().`);
  }

  /** Reação visual ao apanhar (opcional). */
  // eslint-disable-next-line no-unused-vars
  onHit(source) {}

  /** Reação visual ao disparar um projétil (opcional, ex.: animação de ataque). */
  onAttack() {}

  /** Reação visual ao usar o poder especial (opcional). */
  onSpecialAttack() {}

  /**
   * Animação de derrota antes de sumir (opcional). Chame done() no fim.
   * Por padrão some na hora.
   */
  playDefeat(done) {
    done();
  }

  /**
   * Chama um bicho para a luta (a cena cria o bicho e devolve em onSpawned).
   * @param {{TYPE: string, X: number, Y?: number}} spawn
   * @param {Function} onSpawned recebe o Enemy criado
   */
  summon(spawn, onSpawned) {
    this.#eventBus.emit(GameEvents.BOSS_SUMMON, spawn, onSpawned);
  }

  /** Remove todos os sprites do chefão. Por padrão, só o principal. */
  destroyParts() {
    this.destroy();
  }

  /** @override */
  takeHit(source, damage) {
    if (!this.canBeHit) return;

    this.onHit(source);
    this.#health.damage(damage);
    this.#hitBlink.start(GameSettings.BOSS.HIT_BLINK_FRAMES);

    if (this.#health.isDead) this.#defeat();
  }

  /** Encostou no jogador. */
  onPlayerContact(player) {
    if (this.hurtsOnContact && this.canBeHit) player.hitByContact(ProjectileEffect.NONE);
  }

  /** Avança os cooldowns (chamar uma vez por frame). */
  tickCooldowns() {
    this.#hitBlink.tick();
  }

  #defeat() {
    this.#defeated = true;
    this.playDefeat(() => {
      this.destroyParts();
      this.#eventBus.emit(GameEvents.BOSS_DEFEATED, this);
    });
  }
}
