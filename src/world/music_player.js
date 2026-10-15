/**
 * music_player.js
 * -----------------------------------------------------------------------------
 * Música de fundo. O som pertence ao jogo inteiro (não a uma cena), então
 * ela continua tocando ao trocar de cena e nunca é duplicada.
 * -----------------------------------------------------------------------------
 */
class MusicPlayer {
  constructor() {
    throw new TypeError('MusicPlayer é estático e não deve ser instanciado.');
  }

  /** Começa a música se ainda não estiver tocando. */
  static ensurePlaying(scene) {
    const { MUSIC_KEY, MUSIC_VOLUME } = GameSettings.AUDIO;
    const existing = scene.sound.get(MUSIC_KEY);
    if (existing && existing.isPlaying) return;

    const music = existing || scene.sound.add(MUSIC_KEY);
    music.play({ loop: true, volume: MUSIC_VOLUME });
  }
}
