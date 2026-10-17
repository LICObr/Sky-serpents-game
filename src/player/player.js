/**
 * player.js
 * -----------------------------------------------------------------------------
 * Classe base ABSTRATA do personagem jogável. Herda de GameEntity e é
 * composta por componentes, cada um com uma única responsabilidade:
 *   - PlayerMovement → andar, pular, agachar
 *   - PlayerHealth   → corações, dano, cura
 *   - PlayerStatus   → efeitos temporários (lentidão, congelado)
 *   - PlayerShield   → escudinho do agachar (segura um golpe e recarrega)
 *   - PlayerAttack   → definido pela SUBCLASSE (createAttack):
 *        KnightPlayer → SwordAttack | ArcherPlayer → BowAttack
 *   - PlayerSpecial  → especial da tecla G, também da SUBCLASSE (createSpecial):
 *        KnightPlayer → DashSpecial | ArcherPlayer → ArrowStormSpecial
 *
 * Com 2 jogadores, cada um também é um ALVO do combate (fogo amigo): golpe,
 * flecha ou especial do parceiro tira um coração (o escudinho segura).
 * -----------------------------------------------------------------------------
 */
class Player extends GameEntity {
  #character;
  #slot;                // 0 = jogador 1, 1 = jogador 2
  #knockedOut = false;  // sem corações: fora até o fim da fase (modo 2 jogadores)
  #facingRight = true;
  #movement;
  #attack;
  #special;
  #health;
  #status;
  #shield;
  #bodyOffsetY;     // posição original da hitbox dentro do sprite
  #walkFrame = -1;  // quadro atual da caminhada
  #nextWalkFrameAt = 0;

  /**
   * @param {Phaser.Scene} scene
   * @param {object} character entrada de CHARACTERS
   * @param {number} slot 0 = jogador 1, 1 = jogador 2 (começa um pouco atrás)
   * @param {InputController} input
   * @param {Phaser.Events.EventEmitter} eventBus
   * @param {MatchConfig} match
   */
  constructor(scene, character, slot, input, eventBus, match) {
    if (new.target === Player) {
      throw new TypeError('Player é abstrata: use KnightPlayer ou ArcherPlayer (PlayerFactory).');
    }
    const cfg = GameSettings.PLAYER;
    const startX = cfg.START_X - slot * GameSettings.PARTY.START_GAP;
    const sprite = scene.physics.add
      .sprite(startX, cfg.START_Y, character.TEXTURES.STAND.RIGHT)
      .setScale(character.SCALE);

    super(scene, sprite);
    this.#character = character;
    this.#slot = slot;

    sprite.body.setSize(character.BODY.WIDTH, character.BODY.HEIGHT);
    this.#bodyOffsetY = sprite.body.offset.y;
    sprite.setBounce(0);
    sprite.setCollideWorldBounds(true);
    sprite.setDepth(cfg.DEPTH);

    this.#movement = new PlayerMovement(this, input);
    this.#health = new PlayerHealth(this, match.playerHearts, eventBus);
    this.#status = new PlayerStatus(this);
    this.#shield = new PlayerShield(this);
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
  get slot()        { return this.#slot; }
  get isKnockedOut() { return this.#knockedOut; }
  get special()     { return this.#special; }
  get health()      { return this.#health; }
  get status()      { return this.#status; }
  get shield()      { return this.#shield; }
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

  /** Andando no chão: troca os quadros da caminhada (sem cortar a pose de ataque). */
  walk(now) {
    if (this.#isShowing(PlayerPose.ATTACK)) return;
    const frames = this.#character.TEXTURES.WALK[this.#facingRight ? 'RIGHT' : 'LEFT'];
    if (now >= this.#nextWalkFrameAt) {
      this.#walkFrame = (this.#walkFrame + 1) % frames.length;
      this.#nextWalkFrameAt = now + GameSettings.PLAYER.WALK_FRAME_MS;
    }
    this.setTextureIfChanged(frames[this.#walkFrame]);
  }

  /** Parou ou está no ar: volta para a pose parada (sem cortar a pose de ataque). */
  stopWalking() {
    this.#walkFrame = -1; // ao voltar a andar, começa pelo primeiro passo
    this.#nextWalkFrameAt = 0;
    if (!this.#isShowing(PlayerPose.ATTACK)) this.showPose(PlayerPose.STAND);
  }

  /** A textura atual é a desta pose (virado para qualquer lado)? */
  #isShowing(pose) {
    const { RIGHT, LEFT } = this.#character.TEXTURES[pose];
    const key = this.sprite.texture.key;
    return key === RIGHT || key === LEFT;
  }

  /** Movimentação e efeitos do frame. */
  update() {
    this.#attack.updateProjectiles(); // flechas no ar seguem mesmo com o jogador fora
    if (this.#knockedOut) return;

    const windBlown = this.#status.isPushed; // empurrado: o vento manda no andar
    if (this.#status.isFrozen) {
      // Congelado: parado no bloco de gelo (só a gravidade age)
      this.sprite.setVelocityX(0);
    } else if (!windBlown && !(this.#special.isActive && this.#special.controlsMovement)) {
      // Durante a investida o movimento é controlado pelo especial
      this.#movement.update();
    }
    this.#status.update();
    this.#shield.update();
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

  /** @override Fogo amigo: dá para acertar quem está jogando e não está piscando. */
  get canBeHit() {
    return this.isAlive && !this.#knockedOut && !this.#health.isInvulnerable;
  }

  /** @override Alcance da espada do parceiro. */
  get meleeReach() {
    return GameSettings.PARTY.FRIENDLY_REACH;
  }

  /** @override Golpe do parceiro (fogo amigo): perde um coração, como ao encostar num bicho. */
  // eslint-disable-next-line no-unused-vars
  takeHit(source, damage) {
    this.hitByContact(ProjectileEffect.NONE);
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
    if (this.#blockedByShield()) return true; // o escudinho segurou (o projétil some)
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
    if (this.#blockedByShield()) return;
    if (this.#health.takeDamage()) this.#status.apply(effect);
  }

  /**
   * O golpe bateu no escudinho do agachar? Piscando (cooldown de dano) o
   * golpe não faria nada mesmo, então o escudo não é gasto.
   */
  #blockedByShield() {
    return !this.#health.isInvulnerable && this.#shield.tryBlock();
  }

  /**
   * Empurrado para trás (ex.: vento do rabo da águia): sai voando um pouco,
   * sem conseguir andar por um instante. Não tira coração.
   * @param {number} directionX 1 = para a direita, -1 = para a esquerda
   * @param {number} force velocidade do empurrão
   */
  pushBack(directionX, force) {
    if (this.#knockedOut) return;
    const { LIFT_Y, MS } = GameSettings.PLAYER.PUSH;
    this.sprite.setVelocity(directionX * force, LIFT_Y);
    this.#status.push(MS);
  }

  /**
   * Entrou ou saiu da água (pântano). Dentro dela a gravidade quase some e
   * afunda devagar; pular vira braçada (PlayerMovement).
   * @param {number|null} depth profundidade dos pés (null = fora da água)
   */
  setWaterDepth(depth) {
    const cfg = GameSettings.SWIM;
    const body = this.sprite.body;
    const swimming = depth !== null;
    if (swimming !== this.#status.isSwimming) body.setGravityY(swimming ? -GameSettings.PHYSICS.GRAVITY_Y * cfg.BUOYANCY : 0);
    this.#status.setWaterDepth(depth);
    if (swimming && body.velocity.y > cfg.MAX_SINK_SPEED) body.setVelocityY(cfg.MAX_SINK_SPEED); // afunda devagar
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
   * Sem corações: tomba para a esquerda e fica deitado no chão, meio
   * transparente, até o fim da fase (PlayerParty).
   * @param {number|null} groundY chão embaixo dele (null = caiu num buraco)
   */
  knockOut(groundY) {
    const cfg = GameSettings.PLAYER.DEATH;
    const sprite = this.sprite;
    this.#knockedOut = true;
    this.#shield.hide();
    this.#movement.reset();          // se estava agachado, levanta o desenho
    this.showPose(PlayerPose.STAND);
    sprite.body.enable = false;
    this.scene.tweens.killTweensOf(sprite); // para o piscar do dano
    this.scene.tweens.add({
      targets: sprite,
      angle: -90,
      alpha: cfg.ALPHA,
      y: groundY === null ? sprite.y : groundY - cfg.LYING_HEIGHT,
      duration: cfg.FALL_MS,
      ease: 'Quad.easeIn',
      // deitado: a transparência vai e volta devagar
      onComplete: () => this.scene.tweens.add({
        targets: sprite, alpha: cfg.ALPHA * 0.6, duration: cfg.PULSE_MS, yoyo: true, repeat: -1
      })
    });
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
