/**
 * player_factory.js
 * -----------------------------------------------------------------------------
 * Cria o personagem certo a partir do que foi escolhido no menu
 * (padrão "Factory"): a cena não precisa conhecer as subclasses.
 * -----------------------------------------------------------------------------
 */
class PlayerFactory {
  static #classes = Object.freeze({
    [CharacterId.KNIGHT]: KnightPlayer,
    [CharacterId.ARCHER]: ArcherPlayer
  });

  constructor() {
    throw new TypeError('PlayerFactory é estática e não deve ser instanciada.');
  }

  /**
   * @param {Phaser.Scene} scene
   * @param {InputController} input
   * @param {Phaser.Events.EventEmitter} eventBus
   * @param {MatchConfig} match
   * @returns {Player}
   */
  static create(scene, input, eventBus, match) {
    const PlayerClass = PlayerFactory.#classes[match.character.ID];
    if (!PlayerClass) throw new RangeError(`Sem classe para o personagem ${match.character.ID}`);
    return new PlayerClass(scene, input, eventBus, match);
  }
}
