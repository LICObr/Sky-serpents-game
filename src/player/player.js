/**
 * player.js
 * -----------------------------------------------------------------------------
 * Classe base ABSTRATA do personagem jogável. Herda de GameEntity e é
 * composta por componentes, cada um com uma única responsabilidade:
 *   - PlayerMovement → andar, pular, agachar
 *   - PlayerHealth   → corações, dano, cura
 *   - PlayerStatus   → efeitos temporários (lentidão, congelado)
 *   - PlayerAttack   → definido pela SUBCLASSE (createAttack):
 *        KnightPlayer → SwordAttack | ArcherPlayer → BowAttack
 *   - PlayerSpecial  → especial da tecla G, também da SUBCLASSE (createSpecial):
 *        KnightPlayer → DashSpecial | ArcherPlayer → ArrowStormSpecial
 * -----------------------------------------------------------------------------
 */
class Player extends GameEntity {
  #character;
  #facingRight = true;
  #movement;
  #attack;
  #special;
  #health;
  #status;
  #bodyOffsetY;     // posição original da hitbox dentro do sprite

  /**
   * @param {Phaser.Scene} scene
   * @param {InputController} input
   * @param {Phaser.Events.EventEmitter} eventBus
   * @param {MatchConfig} match
   */
  constructor(scene, input, eventBus, match) {
    if (new.target === Player) {
      throw new TypeError('Player é abstrata: use KnightPlayer ou ArcherPlayer (PlayerFactory).');
    }
    const character = match.character;
    const cfg = GameSettings.PLAYER;
    const sprite = scene.physics.add
      .sprite(cfg.START_X, cfg.START_Y, character.TEXTURES.STAND.RIGHT)
      .setScale(character.SCALE);

    super(scene, sprite);
    this.#character = character;

    sprite.body.setSize(character.BODY.WIDTH, character.BODY.HEIGHT);
    this.#bodyOffsetY = sprite.body.offset.y;
    sprite.setBounce(0);
    sprite.setCollideWorldBounds(true);
    sprite.setDepth(cfg.DEPTH);

    this.#movement = new PlayerMovement(this, input);
    this.#health = new PlayerHealth(this, match.playerHearts, eventBus);
    this.#status = new PlayerStatus(this);
    this.#attack = this.createAttack(input);
    this.#special = this.createSpecial(input, this.#attack);
  }

  /**
   * "Template method": cada personagem diz qual ataque usa.
   * @param {InputController} input
   * @returns {PlayerAttack}
   */
  // eslint-disable-next-line no-unused-vars
  createAttack(input) {
    throw new Error(`${this.constructor.name} precisa implementar createAttack().`);
  }

  /**
   * "Template method": cada personagem diz qual é o seu especial (tecla G).
   * @param {InputController} input
   * @param {PlayerAttack} attack ataque do personagem (ex.: o arco)
   * @returns {PlayerSpecial}
   */
  // eslint-disable-next-line no-unused-vars
  createSpecial(input, attack) {
    throw new Error(`${this.constructor.name} precisa implementar createSpecial().`);
  }

  get character()   { return this.#character; }
  get special()     { return this.#special; }
  get health()      { return this.#health; }
  get status()      { return this.#status; }
  get facingRight() { return this.#facingRight; }
  get isDucking()   { return this.#movement.isDucking; }

  /** Altura dos pés (base da hitbox). */
  get feetY() {
    return this.sprite.body.bottom;
  }

  /** Está caindo (usado para pisar nos inimigos)? */
  get isFalling() {
    return this.sprite.body.velocity.y > 0;
  }

  /**
   * Desce (ou volta) só o DESENHO ao agachar, sem mexer na hitbox: o sprite
   * desce e a hitbox é compensada para continuar exatamente no mesmo lugar.
   * @param {boolean} ducking
   */
  setDuckVisual(ducking) {
    const sprite = this.sprite;
    const dy = this.#character.DUCK_VISUAL_OFFSET;
    if (!dy) return;
    sprite.y += ducking ? dy : -dy;
    const offsetY = ducking ? this.#bodyOffsetY - dy / sprite.scaleY : this.#bodyOffsetY;
    sprite.body.setOffset(sprite.body.offset.x, offsetY);
  }

  /** Vira o jogador para a direita (true) ou esquerda (false). */
  face(right) {
    this.#facingRight = right;
  }

  /** Mostra a textura da pose escolhida, respeitando o lado em que está virado. */
  showPose(pose) {
    const textures = this.#character.TEXTURES[pose];
    this.setTextureIfChanged(this.#facingRight ? textures.RIGHT : textures.LEFT);
  }

  /** Movimentação e efeitos do frame. */
  update() {
    if (this.#status.isFrozen) {
      // Congelado: parado no bloco de gelo (só a gravidade age)
      this.sprite.setVelocityX(0);
    } else if (!(this.#special.isActive && this.#special.controlsMovement)) {
      // Durante a investida o movimento é controlado pelo especial
      this.#movement.update();
    }
    this.#status.update();
    this.#attack.updateProjectiles();
  }

  /** Processa o ataque (não ataca enquanto agachado). */
  handleAttack(combat) {
    if (this.#status.isFrozen) return; // congelado não ataca
    this.#special.update(combat);
    if (this.isDucking || this.#special.isActive) return;
    this.#attack.update(combat);
  }

  /** Liga as colisões próprias do ataque (ex.: flechas x inimigos/terreno). */
  bindAttackCollisions(combat, levelMap) {
    this.#attack.bindCollisions(combat, levelMap);
  }

  /** Plataformas criadas pelo ataque (flechas cravadas da arqueira) ou null. */
  get attackPlatforms() {
    return this.#attack.platforms;
  }

  /** Está no cooldown de dano (invulnerável)? */
  get isInvulnerable() {
    return this.#health.isInvulnerable;
  }

  /**
   * Atingido por projétil: perde coração e sofre o efeito (ex.: lentidão).
   * @returns {boolean} false se estava no cooldown de dano (o projétil passa direto)
   */
  hitByProjectile(effect) {
    // Bola de gelo do urso: só congela, não tira coração
    if (effect === ProjectileEffect.FREEZE) {
      this.#status.apply(effect);
      return true;
    }
    if (!this.#health.takeDamage()) return false;
    this.#status.apply(effect);
    return true;
  }

  /** Encostou em bicho/chefão (respeita o cooldown de dano). */
  hitByContact(effect) {
    if (this.#health.takeDamage()) this.#status.apply(effect);
  }

  /** Pulinho depois de pisar em um inimigo. */
  bounce() {
    this.sprite.setVelocityY(GameSettings.PLAYER.STOMP_BOUNCE_Y);
  }

  /** Caiu em um buraco? */
  hasFallenIntoPit() {
    return this.y > GameSettings.LEVEL.PIT_Y;
  }

  /**
   * Reaparece no checkpoint.
   * @param {number} x
   * @param {number} groundY altura do chão naquele ponto
   */
  respawnAt(x, groundY) {
    this.#movement.reset();
    this.sprite.body.reset(x, groundY - GameSettings.LEVEL.RESPAWN_HEIGHT);
    this.face(true);
    this.showPose(PlayerPose.STAND);
  }
}
