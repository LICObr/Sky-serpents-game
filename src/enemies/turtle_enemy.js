/**
 * turtle_enemy.js
 * -----------------------------------------------------------------------------
 * Tartaruga (pântano): anda como o slime. Pisou nela, ela se ESCONDE no
 * casco. Encostou no casco parado (ou bateu nele com a espada ou a flecha)
 * e ele sai DESLIZANDO rapidão, derrubando os bichos que encontrar pelo
 * caminho e quicando nas paredes! Pisar no casco deslizando faz ele parar.
 * Escondida ela não machuca ninguém; depois de um tempo parada, bota a
 * cabeça para fora e volta a andar.
 *
 *   ANDANDO ──(pisão)──▶ CASCO ──(chute)──▶ DESLIZANDO ──(pisão/tempo)──▶ CASCO
 *      ▲                    │
 *      └──────(tempo)───────┘
 * -----------------------------------------------------------------------------
 */
const TurtleState = Object.freeze({
  WALK: 'WALK',
  SHELL: 'SHELL',
  SLIDE: 'SLIDE'
});

class TurtleEnemy extends WalkerEnemy {
  #state = TurtleState.WALK;
  #stateEndsAt = 0;    // no casco: quando sai | deslizando: quando para
  #kickableAt = 0;     // logo depois de esconder, o mesmo pisão não chuta o casco
  #slideDirection = 1;

  /** @override Escondida ela mesma escolhe o desenho (casco). */
  get cyclesFrames() {
    return this.#state === TurtleState.WALK;
  }

  /** Casco deslizando: derruba os outros bichos (EnemyManager). */
  get isSlidingShell() {
    return this.isActive && this.#state === TurtleState.SLIDE;
  }

  /** @override Deslizando nada acerta (o casco está girando). */
  get canBeHit() {
    return super.canBeHit && this.#state !== TurtleState.SLIDE;
  }

  /** @override Pisar esconde; encostar no casco parado chuta; deslizando, pisar faz parar. */
  onPlayerContact(player) {
    if (!this.isActive) return;
    const fromAbove = player.isFalling && player.feetY <= this.sprite.body.top + GameSettings.ENEMY.STOMP_TOLERANCE;
    switch (this.#state) {
      case TurtleState.WALK:
        if (!fromAbove) {
          super.onPlayerContact(player); // andando, encostar machuca
          return;
        }
        player.bounce();
        this.#hide();
        break;
      case TurtleState.SHELL:
        if (fromAbove) player.bounce();
        this.#kick(Math.sign(this.x - player.x) || 1);
        break;
      case TurtleState.SLIDE:
        if (!fromAbove) return; // o casco deslizando não machuca o jogador
        player.bounce();
        this.#hide();
        break;
    }
  }

  /** @override Golpe no casco parado chuta o casco (afundar ou cair no buraco não). */
  takeHit(source, damage) {
    if (this.#state === TurtleState.SHELL && source !== this) {
      this.#kick(Math.sign(this.x - source.x) || 1);
      return;
    }
    super.takeHit(source, damage);
  }

  /** @override */
  behave(time, player) {
    switch (this.#state) {
      case TurtleState.WALK:
        super.behave(time, player);
        break;
      case TurtleState.SHELL:
        // perto de sair do casco: tremidinha de aviso
        this.sprite.setVelocityX(time > this.#stateEndsAt - 700 ? Math.sin(time * 0.06) * 40 : 0);
        if (time >= this.#stateEndsAt) this.#comeOut();
        break;
      case TurtleState.SLIDE:
        this.#slide(time);
        break;
    }
  }

  /** Desliza quicando nas paredes; o casco "gira" (vira de um lado para o outro). */
  #slide(time) {
    const body = this.sprite.body;
    if (body.blocked.left) this.#slideDirection = 1;
    else if (body.blocked.right) this.#slideDirection = -1;
    this.sprite.setVelocityX(this.#slideDirection * this.type.SHELL.KICK_SPEED);
    this.sprite.setFlipX(Math.floor(time / 70) % 2 === 0);
    if (time >= this.#stateEndsAt) this.#hide();
  }

  /** Esconde no casco (parado). */
  #hide() {
    const now = this.scene.time.now;
    this.#state = TurtleState.SHELL;
    this.#stateEndsAt = now + this.type.SHELL.HIDE_MS;
    this.#kickableAt = now + 250;
    this.sprite.setVelocityX(0);
    this.setTextureIfChanged(this.type.SHELL.FRAME);
  }

  /** Chute: o casco sai deslizando para longe de quem chutou. */
  #kick(direction) {
    const now = this.scene.time.now;
    if (now < this.#kickableAt) return;
    this.#state = TurtleState.SLIDE;
    this.#slideDirection = direction;
    this.#stateEndsAt = now + this.type.SHELL.SLIDE_MS;
  }

  /** Bota a cabeça para fora e volta a andar. */
  #comeOut() {
    this.#state = TurtleState.WALK;
    this.setTextureIfChanged(this.type.FRAMES[0]);
  }
}
