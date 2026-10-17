/**
 * falling_rocks.js
 * -----------------------------------------------------------------------------
 * PEDRAS caindo do teto da caverna durante a fase (FALLING_ROCKS no arquivo
 * da fase). De tempos em tempos uma pedra aparece no alto da tela, perto de
 * um jogador: treme e solta poeirinha (o aviso) e depois despenca. Acertando
 * o jogador tira um coração; no chão se quebra em pedacinhos.
 * -----------------------------------------------------------------------------
 */
class FallingRocks {
  #scene;
  #levelMap;
  #party;
  #cfg;
  #group;
  #dust;
  #nextRockAt;

  /**
   * @param {Phaser.Scene} scene
   * @param {LevelMap} levelMap para saber onde fica o chão
   * @param {PlayerParty} party as pedras caem perto dos jogadores
   * @param {object} cfg FALLING_ROCKS da fase
   */
  constructor(scene, levelMap, party, cfg) {
    this.#scene = scene;
    this.#levelMap = levelMap;
    this.#party = party;
    this.#cfg = cfg;
    this.#group = scene.physics.add.group({ allowGravity: false });
    this.#dust = scene.add.particles(FxTextureKeys.SPARK).setDepth(GameSettings.ENEMY.DEPTH + 0.6)
      .createEmitter({
        on: false,
        speed: { min: 40, max: 160 },
        angle: { min: 200, max: 340 },
        gravityY: 500,
        lifespan: { min: 300, max: 700 },
        scale: { start: 0.6, end: 0.1 },
        tint: [0x9a9088, 0x6e6660, 0xc8beb2]
      });
    scene.physics.add.overlap(party.sprites, this.#group, (playerSprite, rock) => {
      if (!rock.getData('falling')) return;
      playerSprite.getData('owner').hitByContact(ProjectileEffect.NONE);
      this.#shatter(rock);
    });
    this.#nextRockAt = scene.time.now + cfg.FIRST_MS;
  }

  /** Solta pedras de tempos em tempos e quebra as que chegam no chão (chamar a cada frame). */
  update(time) {
    const { EVERY_MS } = this.#cfg;
    if (time >= this.#nextRockAt) {
      this.#nextRockAt = time + Phaser.Math.Between(EVERY_MS.MIN, EVERY_MS.MAX);
      this.#warnAndDrop();
    }
    this.#group.getChildren().forEach(rock => {
      if (!rock.active || !rock.getData('falling')) return;
      const ground = this.#levelMap.surfaceYAt(rock.x);
      if (ground !== null && rock.body.bottom >= ground) this.#shatter(rock);
      else if (rock.y > GameSettings.LEVEL.PIT_Y) rock.destroy(); // caiu num buraco
    });
  }

  /** Uma pedra no alto da tela, perto de um jogador: treme soltando poeira e depois cai. */
  #warnAndDrop() {
    const cfg = this.#cfg;
    const players = this.#party.inGame;
    if (players.length === 0) return;
    const view = this.#scene.cameras.main.worldView;
    const target = Phaser.Utils.Array.GetRandom(players);
    const x = Phaser.Math.Clamp(target.x + Phaser.Math.Between(-cfg.SPREAD_X, cfg.SPREAD_X), view.left + 20, view.right - 20);
    const rock = this.#group.create(x, view.top + cfg.START_Y, cfg.TEXTURE)
      .setScale(cfg.SCALE)
      .setDepth(GameSettings.ENEMY.DEPTH + 0.5)
      .setData('falling', false);

    const shakes = Math.floor(cfg.WARNING_MS / 90);
    this.#scene.tweens.add({ targets: rock, x: x + 2, duration: 45, yoyo: true, repeat: shakes });
    for (let i = 0; i < 3; i++) {
      this.#scene.time.delayedCall(i * cfg.WARNING_MS / 3, () => {
        if (rock.active) this.#dust.explode(3, rock.x, rock.y + rock.displayHeight / 2);
      });
    }
    this.#scene.time.delayedCall(cfg.WARNING_MS, () => {
      if (!rock.active) return;
      rock.setData('falling', true);
      rock.body.setVelocityY(cfg.FALL_SPEED);
    });
  }

  /** Quebra em pedacinhos (a tela treme de leve). */
  #shatter(rock) {
    rock.setData('falling', false);
    this.#dust.explode(14, rock.x, rock.body.bottom);
    this.#scene.cameras.main.shake(120, 0.004);
    rock.destroy();
  }
}
