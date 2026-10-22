/**
 * sound_fx.js
 * -----------------------------------------------------------------------------
 * Toca os EFEITOS SONOROS (SoundKeys). Cada som:
 *   - sai com uma variaçãozinha de tom (o mesmo som repetido não fica robótico);
 *   - não "metralha": o mesmo som não toca de novo em menos de SFX_MIN_GAP_MS
 *     (ex.: o leque de flechas ou dois bichos apanhando no mesmo instante).
 * O volume geral fica em GameSettings.AUDIO.SFX_VOLUME.
 * -----------------------------------------------------------------------------
 */
class SoundFx {
  static #lastPlayedAt = new Map();

  constructor() {
    throw new TypeError('SoundFx é estático e não deve ser instanciado.');
  }

  /**
   * @param {Phaser.Scene} scene qualquer cena (o som é do jogo inteiro)
   * @param {string} key um dos SoundKeys
   * @param {{volume?: number, detune?: number}} [options] volume relativo e tom (em cents: 1200 = uma oitava)
   */
  static play(scene, key, { volume = 1, detune = 0 } = {}) {
    if (!scene || !scene.sys || !scene.cache.audio.exists(key)) return;
    const { SFX_VOLUME, SFX_MIN_GAP_MS, SFX_RANDOM_DETUNE } = GameSettings.AUDIO;
    const now = performance.now();
    if (now - (SoundFx.#lastPlayedAt.get(key) ?? -Infinity) < SFX_MIN_GAP_MS) return;
    SoundFx.#lastPlayedAt.set(key, now);
    scene.sound.play(key, {
      volume: SFX_VOLUME * volume,
      detune: detune + Phaser.Math.Between(-SFX_RANDOM_DETUNE, SFX_RANDOM_DETUNE)
    });
  }
}
