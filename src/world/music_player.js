/**
 * music_player.js
 * -----------------------------------------------------------------------------
 * Música de fundo. O som pertence ao jogo inteiro (não a uma cena), então
 * ela continua tocando ao trocar de cena e nunca é duplicada. Desligada nos
 * botõezinhos do canto (AudioSettings), ela fica pausada.
 * -----------------------------------------------------------------------------
 */
class MusicPlayer {
  constructor() {
    throw new TypeError('MusicPlayer é estático e não deve ser instanciado.');
  }

  /** Começa (ou continua) a música se ela estiver ligada; desligada, pausa. */
  static ensurePlaying(scene) {
    const { MUSIC_KEY, MUSIC_VOLUME } = GameSettings.AUDIO;
    const existing = scene.sound.get(MUSIC_KEY);
    AudioSettings.apply(scene);
    if (!AudioSettings.musicOn) {
      if (existing && existing.isPlaying) existing.pause();
      return;
    }
    if (existing && existing.isPlaying) return;
    if (existing && existing.isPaused) {
      existing.resume();
      return;
    }
    const music = existing || scene.sound.add(MUSIC_KEY);
    music.play({ loop: true, volume: MUSIC_VOLUME });
  }
}
