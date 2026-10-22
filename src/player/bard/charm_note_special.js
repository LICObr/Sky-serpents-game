/**
 * charm_note_special.js
 * -----------------------------------------------------------------------------
 * Especial do BARDO — "Nota Encantada": ele toca o alaúde e uma NOTA dourada
 * sai voando para a frente, dançando. Os bichos que ela tocar ficam
 * ENCANTADOS e viram aliados (CharmedAlly) — até 2 por nota e no máximo 2 ao
 * mesmo tempo (encantar mais um manda o mais antigo embora).
 *   - bicho que não dá para encantar (ex.: peixe, planta, casco) ou que já é
 *     aliado do rival (1v1): leva dano;
 *   - o chefão não se encanta: leva dano e a nota estoura (o rival, no 1
 *     contra 1, também: perde um coração).
 * Enquanto a nota voa, o bardo continua atacando com o florete.
 * -----------------------------------------------------------------------------
 */
class CharmNoteSpecial extends PlayerSpecial {
  // quem dá para encantar: bichos sem partes extras (a cobrinha arrasta o corpo,
  // a aranha tem a teia, o sapo-língua a língua...) e fora d'água
  static #CHARMABLE = Object.freeze([
    EnemyBehavior.WALKER, EnemyBehavior.SPIKY, EnemyBehavior.HOPPER, EnemyBehavior.BULLFROG,
    EnemyBehavior.FLYER, EnemyBehavior.GHOST, EnemyBehavior.DIVER, EnemyBehavior.SONIC, EnemyBehavior.HERON
  ]);

  #note = null;     // a nota voando
  #glow = null;
  #trail;
  #direction = 1;
  #startX = 0;
  #startY = 0;
  #bornAt = 0;
  #touched = new Set(); // quem esta nota já tocou
  #charms = 0;          // quantos esta nota já encantou
  #allies = [];         // aliados, do mais antigo ao mais novo

  /**
   * @param {Player} player
   * @param {InputController} input
   */
  constructor(player, input) {
    super(player, input);
    this.#trail = player.scene.add.particles(FxTextureKeys.SPARK).setDepth(GameSettings.PLAYER.DEPTH + 0.3)
      .createEmitter({
        on: false,
        lifespan: 360,
        speed: { min: 5, max: 30 },
        frequency: 30,
        scale: { start: 0.9, end: 0 },
        alpha: { start: 0.9, end: 0 },
        tint: [0xffe066, 0xffb8ec, 0xffffff]
      });
  }

  /** @override */
  get name() { return 'Nota Encantada'; }

  /** @override O tempo de voo da nota. */
  get durationMs() { return GameSettings.SPECIAL.CHARM_NOTE.LIFETIME_MS; }

  /** @override Com a nota voando ele continua atacando. */
  get blocksAttack() { return false; }

  /** @override Toca o alaúde: notinhas em volta dele e a nota encantada sai voando. */
  start() {
    const cfg = GameSettings.SPECIAL.CHARM_NOTE;
    const player = this.player;
    const scene = player.scene;
    this.#removeNote();
    this.#direction = player.facingRight ? 1 : -1;
    this.#startX = player.x + this.#direction * 16;
    this.#startY = player.y - 8;
    this.#bornAt = scene.time.now;
    this.#touched.clear();
    this.#charms = 0;

    this.#glow = scene.add.image(this.#startX, this.#startY, FxTextureKeys.GLOW)
      .setTint(cfg.TINT).setAlpha(0.55).setScale(0.55).setDepth(GameSettings.PLAYER.DEPTH + 0.3);
    this.#note = scene.add.image(this.#startX, this.#startY, FxTextureKeys.NOTE)
      .setTint(cfg.TINT).setScale(1.1).setDepth(GameSettings.PLAYER.DEPTH + 0.35);
    this.#trail.startFollow(this.#note);
    this.#trail.start();
    this.#strum(player.x, player.y - 12);
    SoundFx.play(scene, SoundKeys.LUTE);
  }

  /** @override A nota voa dançando e encanta (ou machuca) quem tocar. */
  whileActive(combat, now) {
    if (!this.#note) return;
    const cfg = GameSettings.SPECIAL.CHARM_NOTE;
    const t = now - this.#bornAt;
    const x = this.#startX + this.#direction * cfg.SPEED * t / 1000;
    const y = this.#startY + Math.sin(t * cfg.WAVE.SPEED) * cfg.WAVE.AMPLITUDE;
    this.#note.setPosition(x, y).setAngle(Math.sin(t * 0.012) * 15);
    this.#glow.setPosition(x, y);
    if (t >= cfg.LIFETIME_MS - 50) {
      this.#fadeNote();
      return;
    }
    this.#touch(combat);
  }

  /** Quem a nota encostou: encanta, machuca ou (chefão) estoura nele. */
  #touch(combat) {
    const cfg = GameSettings.SPECIAL.CHARM_NOTE;
    const bounds = this.#note.getBounds();
    for (const target of combat.targets) {
      if (!this.player.isFoe(target) || target instanceof BreakableTree || this.#touched.has(target)) continue;
      const touching = target.hitboxSprites.some(sprite =>
        Phaser.Geom.Intersects.RectangleToRectangle(bounds, sprite.getBounds()));
      if (!touching) continue;
      this.#touched.add(target);
      if (target instanceof Boss || target instanceof Player) { // o chefão (e o rival) não se encanta
        target.takeHit(this.#note, cfg.BOSS_DAMAGE);
        this.#burstNote();
        return;
      }
      if (!(target instanceof Enemy) || target.isCharmed || !CharmNoteSpecial.#CHARMABLE.includes(target.type.BEHAVIOR)) {
        target.takeHit(this.#note, cfg.DAMAGE);
        continue;
      }
      this.#charm(target, combat);
      this.#charms++;
      if (this.#charms >= cfg.MAX_CHARMS) {
        this.#burstNote();
        return;
      }
    }
  }

  /** Vira aliado (no limite, o mais antigo vai embora). */
  #charm(enemy, combat) {
    const cfg = GameSettings.SPECIAL.CHARM_NOTE;
    this.#allies = this.#allies.filter(ally => ally.isActive);
    if (this.#allies.length >= cfg.MAX_ALLIES) this.#allies.shift().dismiss();
    this.#allies.push(new CharmedAlly(enemy, this.player, combat, this.#allies.length));
    this.#allies.forEach((ally, slot) => { ally.slot = slot; });
    this.#strum(enemy.x, enemy.y - 10);
    SoundFx.play(this.player.scene, SoundKeys.CHARM);
  }

  /** Notinhas coloridas subindo (o som do alaúde). */
  #strum(x, y) {
    const scene = this.player.scene;
    for (let i = 0; i < 5; i++) {
      const note = scene.add.image(x + Phaser.Math.Between(-14, 14), y, FxTextureKeys.NOTE)
        .setScale(0.45).setTint(Phaser.Utils.Array.GetRandom([0xffe066, 0xffb8ec, 0x9fe8ff, 0xb8ffb0]))
        .setDepth(GameSettings.PLAYER.DEPTH + 0.2);
      scene.tweens.add({
        targets: note, y: y - Phaser.Math.Between(26, 50), x: note.x + Phaser.Math.Between(-12, 12),
        alpha: 0, delay: i * 60, duration: 650, onComplete: () => note.destroy()
      });
    }
  }

  /** A nota estoura num brilho (encantou o máximo ou bateu no chefão). */
  #burstNote() {
    const scene = this.player.scene;
    const flash = scene.add.image(this.#note.x, this.#note.y, FxTextureKeys.GLOW)
      .setTint(GameSettings.SPECIAL.CHARM_NOTE.TINT).setScale(0.3).setDepth(GameSettings.PLAYER.DEPTH + 0.3);
    scene.tweens.add({ targets: flash, scale: 1, alpha: 0, duration: 260, onComplete: () => flash.destroy() });
    this.#removeNote();
  }

  /** Acabou o voo: a nota some aos poucos. */
  #fadeNote() {
    const scene = this.player.scene;
    const parts = [this.#note, this.#glow];
    this.#note = null;
    this.#glow = null;
    this.#trail.stop();
    scene.tweens.add({ targets: parts, alpha: 0, duration: 200, onComplete: () => parts.forEach(part => part.destroy()) });
  }

  #removeNote() {
    this.#trail.stop();
    if (this.#note) this.#note.destroy();
    if (this.#glow) this.#glow.destroy();
    this.#note = null;
    this.#glow = null;
  }
}
