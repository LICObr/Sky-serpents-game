/**
 * audio_settings.js
 * -----------------------------------------------------------------------------
 * Liga/desliga o SOM, guardado no navegador (vale da próxima vez também):
 *   - música de fundo (MusicPlayer)
 *   - todos os sons (a música e os efeitos)
 * Os botõezinhos ficam no canto da tela (SoundToggles).
 * -----------------------------------------------------------------------------
 */
class AudioSettings {
  static #state = null;

  constructor() {
    throw new TypeError('AudioSettings é estático e não deve ser instanciado.');
  }

  /** Música de fundo ligada? */
  static get musicOn() {
    return AudioSettings.#load().music;
  }

  /** Sons ligados (todos: música e efeitos)? */
  static get soundOn() {
    return AudioSettings.#load().sound;
  }

  /** Liga/desliga a música de fundo. */
  static toggleMusic(scene) {
    AudioSettings.#load().music = !AudioSettings.musicOn;
    AudioSettings.#save();
    MusicPlayer.ensurePlaying(scene);
  }

  /** Liga/desliga todos os sons. */
  static toggleSound(scene) {
    AudioSettings.#load().sound = !AudioSettings.soundOn;
    AudioSettings.#save();
    AudioSettings.apply(scene);
  }

  /** Aplica no jogo: sem som, o Phaser fica mudo (a música e os efeitos). */
  static apply(scene) {
    scene.sound.mute = !AudioSettings.soundOn;
  }

  static #load() {
    if (AudioSettings.#state) return AudioSettings.#state;
    AudioSettings.#state = { music: true, sound: true };
    try {
      const saved = JSON.parse(localStorage.getItem(GameSettings.AUDIO.STORAGE_KEY) || 'null');
      if (saved) AudioSettings.#state = { music: saved.music !== false, sound: saved.sound !== false };
    } catch (error) {
      // navegador sem localStorage (ou bloqueado): fica tudo ligado
    }
    return AudioSettings.#state;
  }

  static #save() {
    try {
      localStorage.setItem(GameSettings.AUDIO.STORAGE_KEY, JSON.stringify(AudioSettings.#state));
    } catch (error) {
      // sem localStorage: vale só enquanto o jogo estiver aberto
    }
  }
}
