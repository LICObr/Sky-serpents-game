/**
 * leaper_gator_enemy.js
 * -----------------------------------------------------------------------------
 * Jacaré-Saltador (pântano): escondido na lagoa, só com os OLHOS para fora
 * d'água, segue o jogador devagarzinho por baixo. Quando o jogador passa
 * POR CIMA dele (pulando a lagoa ou em pé numa vitória-régia), ele SALTA
 * para fora d'água de boca aberta e volta a mergulhar com um respingo.
 * Escondido, nada acerta nele (e encostar nos olhos não machuca).
 *
 *   ESCONDIDO ──(jogador em cima)──▶ SALTO ──(caiu na água)──▶ ESCONDIDO
 * -----------------------------------------------------------------------------
 */
class LeaperGatorEnemy extends Enemy {
  #lake;
  #hideY;
  #leaping = false;
  #restUntil = 0;

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
    this.sprite.body.setAllowGravity(false);
    this.#show(type.EYES_FRAME);
  }

  /** @override O desenho depende do momento (olhos / salto). */
  get cyclesFrames() {
    return false;
  }

  /** @override Escondido (só os olhos) não apanha nem machuca. */
  get canBeHit() {
    return super.canBeHit && this.#leaping;
  }

  /** @override */
  behave(time, player) {
    if (this.#leaping) this.#fly(time);
    else this.#lurk(time, player);
  }

  /** @override Subindo (o bote vem de baixo) sempre morde; caindo de volta, dá para pisar nele. */
  onPlayerContact(player) {
    if (this.#leaping && this.sprite.body.velocity.y < 0) {
      if (this.canHurt) player.hitByContact(this.contactEffect);
      return;
    }
    super.onPlayerContact(player);
  }

  /** @override Fora da câmera fica parado (no meio do salto, continua caindo). */
  sleep() {
    if (this.isActive && !this.#leaping) this.sprite.setVelocity(0, 0);
  }

  /** Segue o jogador por baixo d'água; salta quando ele passa por cima. */
  #lurk(time, player) {
    const type = this.type;
    const margin = 20;
    const targetX = Phaser.Math.Clamp(player.x, this.#lake.left + margin, this.#lake.right - margin);
    const toTarget = targetX - this.x;
    this.sprite.setVelocityX(Math.abs(toTarget) > 4 ? Math.sign(toTarget) * this.speed : 0);
    this.sprite.setVelocityY((this.#hideY + Math.sin(time * 0.004) * 1.5 - this.y) * 6);
    if (Math.abs(toTarget) > 4) this.sprite.setFlipX(toTarget > 0); // a arte olha para a esquerda

    const overLake = player.x > this.#lake.left && player.x < this.#lake.right;
    const above = player.y < this.#lake.surfaceY && this.#lake.surfaceY - player.y < type.LEAP_HEIGHT;
    if (overLake && above && Math.abs(player.x - this.x) < type.LEAP_RANGE_X && time >= this.#restUntil) this.#leap(player);
  }

  /** Salta para fora d'água de boca aberta. */
  #leap(player) {
    const direction = Math.sign(player.x - this.x) || 1;
    this.#leaping = true;
    this.#show(this.type.FRAMES[0]);
    this.sprite.setFlipX(direction > 0);
    this.sprite.body.setAllowGravity(true);
    this.sprite.setVelocity(direction * 40, this.type.LEAP_VELOCITY);
    WaterSplash.at(this.scene, this.x, this.#lake.surfaceY, 14);
  }

  /** No ar: inclina com o salto; ao voltar para a água, mergulha e descansa. */
  #fly(time) {
    const sprite = this.sprite;
    const vy = sprite.body.velocity.y;
    const facing = sprite.flipX ? -1 : 1;
    sprite.setAngle(Phaser.Math.Clamp(-vy / 20, -35, 35) * facing); // subindo: focinho para cima
    if (vy <= 0 || this.y < this.#hideY) return;

    this.#leaping = false;
    sprite.body.setAllowGravity(false);
    sprite.setVelocity(0, 0).setAngle(0);
    sprite.y = this.#hideY;
    this.#show(this.type.EYES_FRAME);
    this.#restUntil = time + this.type.REST_MS;
    WaterSplash.at(this.scene, this.x, this.#lake.surfaceY, 14);
  }

  /** Troca o desenho e ajusta a área de colisão ao tamanho dele. */
  #show(key) {
    if (this.sprite.texture.key === key) return;
    this.setTextureIfChanged(key);
    this.sprite.body.setSize();
  }
}
