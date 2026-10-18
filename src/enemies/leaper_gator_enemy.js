/**
 * leaper_gator_enemy.js
 * -----------------------------------------------------------------------------
 * Jacaré-Saltador (pântano): escondido na lagoa, alterna entre dois tempos:
 *   DE OLHO     só os olhos para fora d'água: segue (devagar) quem está sobre
 *               a lagoa e, se o jogador passar POR CIMA dele, dá um SALTO
 *               baixo de boca aberta e volta a mergulhar com um respingo;
 *   MERGULHADO  afunda e descansa: não segue nem salta — hora de passar!
 * Quem está na margem ele não segue, e fica sempre inteiro dentro da lagoa
 * (nunca salta por cima da terra).
 * Escondido, encostar nos olhos não machuca (mas a espada e a flecha acertam).
 *
 *   DE OLHO ──(tempo)──▶ MERGULHADO ──(tempo)──▶ DE OLHO
 *      └──(jogador em cima)──▶ SALTO ──(caiu na água)──▶ MERGULHADO
 * -----------------------------------------------------------------------------
 */
const LeaperState = Object.freeze({
  WATCH: 'WATCH',
  REST: 'REST',
  LEAP: 'LEAP'
});

class LeaperGatorEnemy extends Enemy {
  #lake;
  #homeX;
  #hideY;
  #margin;      // metade do jacaré saltando: o centro nunca chega mais perto da margem que isso
  #state = LeaperState.WATCH;
  #stateEndsAt;
  #canLeapAt = 0; // acabou de voltar à tona: um instante de aviso antes de poder saltar

  /**
   * @param {Phaser.Scene} scene
   * @param {number} x precisa estar sobre uma lagoa (WATER)
   * @param {number} y (ignorado: fica na superfície)
   * @param {object} type
   * @param {MatchConfig} match
   * @param {Phaser.Events.EventEmitter} eventBus
   * @param {LevelMap} levelMap onde fica a lagoa
   */
  constructor(scene, x, y, type, match, eventBus, levelMap) {
    const lake = SwimmerEnemy.lakeAt(levelMap, x);
    const hideY = lake.surfaceY + type.HIDE_Y;
    super(scene, x, hideY, type, match, eventBus);
    this.#lake = lake;
    this.#hideY = hideY;
    this.#margin = scene.textures.get(type.FRAMES[0]).getSourceImage().width * type.SCALE / 2;
    this.#homeX = Phaser.Math.Clamp(x, lake.left + this.#margin, lake.right - this.#margin);
    this.sprite.body.setAllowGravity(false);
    this.#show(type.EYES_FRAME);
    this.#stateEndsAt = scene.time.now + Phaser.Math.Between(type.WATCH_MS / 2, type.WATCH_MS);
  }

  /** @override O desenho depende do momento (olhos / salto). */
  get cyclesFrames() {
    return false;
  }

  /** @override Só machuca saltando (encostar nos olhos não). */
  get canHurt() {
    return this.isActive && this.#state === LeaperState.LEAP;
  }

  /** @override */
  behave(time, player) {
    switch (this.#state) {
      case LeaperState.WATCH: this.#watch(time, player); break;
      case LeaperState.REST:  this.#rest(time); break;
      case LeaperState.LEAP:  this.#fly(time); break;
    }
  }

  /** @override Subindo (o bote vem de baixo) sempre morde; caindo de volta, dá para pisar nele. */
  onPlayerContact(player) {
    if (this.#state === LeaperState.LEAP && this.sprite.body.velocity.y < 0) {
      if (this.canHurt) player.hitByContact(this.contactEffect);
      return;
    }
    super.onPlayerContact(player);
  }

  /** @override Fora da câmera fica parado (no meio do salto, continua caindo). */
  sleep() {
    if (this.isActive && this.#state !== LeaperState.LEAP) this.sprite.setVelocity(0, 0);
  }

  /** De olho: segue quem está sobre a lagoa e salta quando ele passa por cima. */
  #watch(time, player) {
    const type = this.type;
    const overLake = player.x > this.#lake.left && player.x < this.#lake.right;
    this.#swimTo(overLake ? player.x : this.#homeX, this.#hideY, time);
    const above = player.y < this.#lake.surfaceY && this.#lake.surfaceY - player.y < type.LEAP_HEIGHT;
    if (overLake && above && time >= this.#canLeapAt && Math.abs(player.x - this.x) < type.LEAP_RANGE_X) {
      this.#leap(player);
      return;
    }
    if (time >= this.#stateEndsAt) this.#dive(time);
  }

  /** Mergulhado: descansa mais fundo, voltando devagar para o lugar dele. */
  #rest(time) {
    this.#swimTo(this.#homeX, this.#hideY + this.type.REST_DEPTH, time);
    if (time < this.#stateEndsAt) return;
    this.#state = LeaperState.WATCH;
    this.#stateEndsAt = time + this.type.WATCH_MS;
    this.#canLeapAt = time + this.type.LEAP_DELAY_MS;
    this.sprite.setAlpha(1);
    WaterSplash.at(this.scene, this.x, this.#lake.surfaceY, 4); // os olhos voltando à tona
  }

  /** Afunda para descansar. */
  #dive(time) {
    this.#state = LeaperState.REST;
    this.#stateEndsAt = time + this.type.REST_MS;
    this.sprite.setAlpha(0.6);
  }

  /** Nada devagar até um ponto, sempre inteiro dentro da lagoa. */
  #swimTo(x, y, time) {
    const targetX = Phaser.Math.Clamp(x, this.#lake.left + this.#margin, this.#lake.right - this.#margin);
    const toTarget = targetX - this.x;
    this.sprite.setVelocityX(Math.abs(toTarget) > 4 ? Math.sign(toTarget) * this.speed : 0);
    this.sprite.setVelocityY((y + Math.sin(time * 0.004) * 1.5 - this.y) * 6);
    if (Math.abs(toTarget) > 4) this.sprite.setFlipX(toTarget > 0); // a arte olha para a esquerda
  }

  /** Salto baixo, reto para cima (não sai da lagoa), de boca aberta. */
  #leap(player) {
    this.#state = LeaperState.LEAP;
    this.sprite.setAlpha(1);
    this.#show(this.type.FRAMES[0]);
    this.sprite.setFlipX(player.x > this.x);
    this.sprite.body.setAllowGravity(true);
    this.sprite.setVelocity(0, this.type.LEAP_VELOCITY);
    WaterSplash.at(this.scene, this.x, this.#lake.surfaceY, 14);
  }

  /** No ar: inclina com o salto; ao voltar para a água, mergulha e descansa. */
  #fly(time) {
    const sprite = this.sprite;
    const vy = sprite.body.velocity.y;
    const facing = sprite.flipX ? -1 : 1;
    sprite.setAngle(Phaser.Math.Clamp(-vy / 20, -30, 30) * facing); // subindo: focinho para cima
    if (vy <= 0 || this.y < this.#hideY) return;

    sprite.body.setAllowGravity(false);
    sprite.setVelocity(0, 0).setAngle(0);
    sprite.y = this.#hideY;
    this.#show(this.type.EYES_FRAME);
    WaterSplash.at(this.scene, this.x, this.#lake.surfaceY, 14);
    this.#dive(time);
  }

  /** Troca o desenho e ajusta a área de colisão ao tamanho dele. */
  #show(key) {
    if (this.sprite.texture.key === key) return;
    this.setTextureIfChanged(key);
    this.sprite.body.setSize();
  }
}
