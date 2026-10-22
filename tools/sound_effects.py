"""
sound_effects.py
-----------------------------------------------------------------------------
Gera os EFEITOS SONOROS do jogo no estilo 16-bit (Super Nintendo / Mega
Drive): tons de síntese FM, ruído filtrado (pancadas, vento, explosões),
cordas dedilhadas (arco e alaúde) e o ECO característico do SNES.

Tudo é sintetizado aqui (nada baixado da internet): rodar de novo gera os
mesmos sons. Cada som vira um MP3 pequeno em assets/sons/ (precisa do lame).

    py tools/sound_effects.py
-----------------------------------------------------------------------------
"""
import subprocess
import tempfile
import wave
from pathlib import Path

import numpy as np

OUT = Path(__file__).resolve().parent.parent / "assets" / "sons"
SR = 32000                      # taxa do SNES
PEAK = 0.89                     # volume máximo de cada som (-1 dB)
MIN_SECONDS = 0.25              # som curtinho ganha silêncio no fim (MP3 com poucos quadros nem sempre abre)

NOTES = {"C": -9, "C#": -8, "D": -7, "D#": -6, "E": -5, "F": -4, "F#": -3, "G": -2, "G#": -1, "A": 0, "A#": 1, "B": 2}


# ------------------------------------------------------------- blocos básicos

def samples(duration):
    return int(SR * duration)


def times(n):
    return np.arange(n) / SR


def note(name):
    """Frequência de uma nota ('A4' = 440 Hz)."""
    pitch, octave = name[:-1], int(name[-1])
    return 440.0 * 2 ** ((NOTES[pitch] + (octave - 4) * 12) / 12)


def glide(start, end, n):
    """Frequência que vai de `start` a `end` (curva exponencial, como o ouvido sente)."""
    return start * (end / start) ** np.linspace(0, 1, n)


def fade_end(envelope, seconds=0.015):
    """Termina em zero: um pedaço cortado no meio do som dá um estalo."""
    fade = min(len(envelope) // 4, samples(seconds))
    if fade:
        envelope = envelope.copy()
        envelope[-fade:] *= np.linspace(1, 0, fade)
    return envelope


def decay(n, seconds, attack=0.002):
    """Envelope: sobe rapidinho e cai exponencialmente."""
    t = times(n)
    rise = np.clip(t / attack, 0, 1) if attack else 1
    return fade_end(rise * np.exp(-t / seconds))


def swell(n, attack, release):
    """Envelope: sobe em `attack` segundos e cai em `release` (vento, fumaça)."""
    t = times(n)
    rise = np.clip(t / attack, 0, 1)
    fall = np.exp(-np.clip(t - attack, 0, None) / release)
    return fade_end(rise * fall)


def sine(freq, n):
    freq = np.broadcast_to(np.asarray(freq, dtype=float), (n,))
    return np.sin(2 * np.pi * np.cumsum(freq) / SR)


def fm(freq, ratio, index, n):
    """Síntese FM de 2 operadores (o som do Mega Drive): modulador na razão `ratio`."""
    freq = np.broadcast_to(np.asarray(freq, dtype=float), (n,))
    index = np.broadcast_to(np.asarray(index, dtype=float), (n,))
    modulator = np.sin(2 * np.pi * np.cumsum(freq * ratio) / SR)
    return np.sin(2 * np.pi * np.cumsum(freq) / SR + index * modulator)


def noise(n, seed):
    return np.random.RandomState(seed).uniform(-1, 1, n)


def svf(x, cutoff, q=0.8, mode="band"):
    """Filtro de estado variável (passa-baixa/banda/alta) com frequência que pode variar no tempo."""
    cutoff = np.broadcast_to(np.asarray(cutoff, dtype=float), x.shape)
    k = 1.0 / q
    ic1 = ic2 = 0.0
    out = np.empty_like(x)
    for i in range(len(x)):
        g = np.tan(np.pi * min(cutoff[i], SR * 0.45) / SR)
        a1 = 1.0 / (1.0 + g * (g + k))
        a2 = g * a1
        a3 = g * a2
        v3 = x[i] - ic2
        v1 = a1 * ic1 + a2 * v3
        v2 = ic2 + a2 * ic1 + a3 * v3
        ic1 = 2 * v1 - ic1
        ic2 = 2 * v2 - ic2
        out[i] = v1 if mode == "band" else v2 if mode == "low" else x[i] - k * v1 - v2
    return out


def pluck(freq, duration, seed, damping=0.996):
    """Corda dedilhada (Karplus-Strong): o arco e o alaúde."""
    n = samples(duration)
    period = max(2, int(round(SR / freq)))
    ring = svf(noise(period, seed), freq * 6, 0.7, "low")
    out = np.empty(n)
    index = 0
    for i in range(n):
        out[i] = ring[index]
        ring[index] = damping * 0.5 * (ring[index] + ring[(index + 1) % period])
        index = (index + 1) % period
    return out * fade_end(np.ones(n), 0.04)


def delay(x, seconds):
    return np.concatenate([np.zeros(samples(seconds)), x])


def mix(*parts):
    """Soma sons de tamanhos diferentes (o mais longo manda)."""
    n = max(len(part) for part in parts)
    out = np.zeros(n)
    for part in parts:
        out[:len(part)] += part
    return out


def echo(x, time=0.1, feedback=0.35, amount=0.3, repeats=4):
    """Eco do SNES: repetições cada vez mais baixas e abafadas."""
    taps = [x]
    tap = x
    for i in range(1, repeats + 1):
        tap = svf(tap, 3500, 0.7, "low")
        taps.append(delay(tap * amount * feedback ** (i - 1), time * i))
    return mix(*taps)


def finish(x):
    """Normaliza, suaviza o começo e o fim (sem estalos)."""
    x = x - np.mean(x)
    peak = np.max(np.abs(x)) or 1
    x = x / peak * PEAK
    fade_in, fade_out = samples(0.001), samples(0.01)
    x[:fade_in] *= np.linspace(0, 1, fade_in)
    x[-fade_out:] *= np.linspace(1, 0, fade_out)
    return x


# ------------------------------------------------------------- os sons

def jump():
    n = samples(0.2)
    tone = fm(glide(280, 760, n), 2.0, np.linspace(1.6, 0.2, n), n) * decay(n, 0.07, 0.004)
    air = svf(noise(n, 1), 2500, 1.2) * decay(n, 0.05) * 0.5
    return tone * 0.8 + air


def air_jump():
    n = samples(0.28)
    tone = fm(glide(480, 1250, n), 2.0, np.linspace(1.2, 0.2, n), n) * decay(n, 0.08, 0.003) * 0.7
    whoosh = svf(noise(n, 2), glide(1200, 4500, n), 2.0) * swell(n, 0.05, 0.08) * 0.9
    return tone + whoosh


def player_hurt():
    n = samples(0.42)
    t = times(n)
    tone = fm(glide(560, 170, n) * (1 + 0.03 * np.sin(2 * np.pi * 18 * t)), 1.0, 2.2, n) * decay(n, 0.15, 0.003)
    crunch = svf(noise(n, 3), 1500, 0.8, "low") * decay(n, 0.03) * 1.2
    return echo(tone * 0.7 + crunch, 0.09, 0.3, 0.25)


def knocked_out():
    parts = []
    start = 0.0
    for name, length in (("E5", 0.15), ("C5", 0.15), ("A4", 0.15), ("F4", 0.6)):
        n = samples(length + 0.25)
        t = times(n)
        wobble = 1 + (0.025 * np.sin(2 * np.pi * 6 * t) if length > 0.3 else 0)
        tone = fm(note(name) * wobble, 1.0, 1.4, n) * decay(n, length * 0.7, 0.005)
        parts.append(delay(tone, start))
        start += length
    return echo(mix(*parts), 0.12, 0.35, 0.3)


def shield():
    n = samples(0.45)
    bell = fm(1250, 3.51, np.linspace(5, 0.5, n), n) * decay(n, 0.12, 0.001)
    bright = fm(1870, 2.0, 2.0, n) * decay(n, 0.06) * 0.4
    click = svf(noise(n, 4), 4000, 0.8, "high") * decay(n, 0.006) * 0.5
    return echo(bell + bright + click, 0.07, 0.3, 0.3)


def stomp():
    n = samples(0.26)
    thump = sine(glide(380, 90, n), n) * decay(n, 0.05, 0.001)
    squish = svf(noise(n, 5), glide(1800, 400, n), 1.5) * decay(n, 0.04) * 1.2
    boing = delay(fm(glide(300, 640, samples(0.16)), 1.0, 1.0, samples(0.16)) * decay(samples(0.16), 0.05, 0.005), 0.05)
    return mix(thump, squish, boing * 0.45)


def revive():
    parts = []
    for i, name in enumerate(("C5", "E5", "G5", "C6", "E6")):
        n = samples(0.45)
        parts.append(delay(fm(note(name), 2.0, np.linspace(2.5, 0.3, n), n) * decay(n, 0.18, 0.002), i * 0.07))
    return echo(mix(*parts), 0.11, 0.4, 0.35)


def sword():
    n = samples(0.22)
    swish = svf(noise(n, 6), glide(800, 3500, n), 1.8) * swell(n, 0.04, 0.05) * 1.4
    shing = fm(2500, 2.7, 1.5, n) * decay(n, 0.06, 0.01) * 0.25
    return swish + shing


def bow():
    twang = pluck(110, 0.3, 7, 0.993) * decay(samples(0.3), 0.08, 0.001)
    swish = delay(svf(noise(samples(0.12), 8), 3200, 1.5) * swell(samples(0.12), 0.02, 0.03), 0.02)
    return mix(twang, swish * 0.6)


def hammer_throw():
    n = samples(0.3)
    swish = svf(noise(n, 9), glide(300, 1300, n), 1.6) * swell(n, 0.08, 0.08) * 1.6
    hum = sine(glide(90, 140, n), n) * swell(n, 0.06, 0.1) * 0.3
    return swish + hum


def quake():
    n = samples(0.8)
    boom = sine(glide(85, 32, n), n) * decay(n, 0.25, 0.002)
    rumble = svf(noise(n, 10), 260, 0.7, "low") * decay(n, 0.3, 0.01) * 2.2
    crack = svf(noise(samples(0.05), 11), 1800, 0.8, "high") * decay(samples(0.05), 0.01)
    return echo(mix(boom, rumble, crack * 0.6), 0.13, 0.3, 0.2)


def punch():
    n = samples(0.16)
    thump = sine(glide(170, 60, n), n) * decay(n, 0.04, 0.001)
    click = svf(noise(n, 12), 2000, 0.8, "low") * decay(n, 0.012) * 0.8
    return thump + click


def katana():
    n = samples(0.26)
    swish = svf(noise(n, 13), glide(2000, 6500, n), 2.2) * swell(n, 0.02, 0.03) * 1.6
    shing = fm(3200, 1.41, 2.0, n) * decay(n, 0.08, 0.005) * 0.35
    return echo(swish + shing, 0.06, 0.25, 0.2, 2)


def smoke():
    n = samples(0.5)
    poof = svf(noise(n, 14), glide(4000, 380, n), 0.9, "low") * swell(n, 0.01, 0.14) * 1.6
    thud = sine(glide(140, 60, n), n) * decay(n, 0.06, 0.002) * 0.5
    return poof + thud


def rapier():
    n = samples(0.2)
    tsing = fm(2600, 3.0, np.linspace(2.5, 0.3, n), n) * decay(n, 0.05, 0.002) * 0.6
    swish = svf(noise(n, 15), 4000, 2.0) * swell(n, 0.015, 0.025) * 1.2
    return tsing + swish


def lute():
    """O bardo toca: um acorde de Ré maior dedilhado e um brilho no fim."""
    strings = [delay(pluck(note(name), 0.9, 16 + i, 0.997), i * 0.035)
               for i, name in enumerate(("D4", "F#4", "A4", "D5"))]
    n = samples(0.4)
    sparkle = delay(fm(note("A6"), 2.0, 1.5, n) * decay(n, 0.12, 0.003) * 0.25, 0.16)
    return echo(mix(*strings, sparkle), 0.12, 0.35, 0.3)


def charm():
    parts = []
    for i, name in enumerate(("G5", "B5", "D6", "G6")):
        n = samples(0.4)
        t = times(n)
        shimmer = 1 + 0.25 * np.sin(2 * np.pi * 14 * t)
        parts.append(delay(fm(note(name), 3.0, 1.2, n) * decay(n, 0.14, 0.002) * shimmer, i * 0.045))
    return echo(mix(*parts), 0.1, 0.4, 0.35)


def thunder():
    n = samples(1.6)
    crack = svf(noise(samples(0.09), 17), 2500, 0.7, "high") * decay(samples(0.09), 0.025)
    rumble_noise = noise(n, 18) * (0.6 + 0.4 * np.abs(svf(noise(n, 19), 6, 0.7, "low")) * 30)
    rumble = svf(rumble_noise, 180, 0.7, "low") * swell(n, 0.06, 0.55) * 2.5
    boom = sine(glide(60, 30, n), n) * decay(n, 0.4, 0.01) * 0.6
    return mix(crack * 1.2, rumble, boom)


def dash():
    n = samples(0.5)
    whoosh = svf(noise(n, 20), glide(400, 2600, n), 1.8) * swell(n, 0.12, 0.15) * 1.6
    rise = fm(glide(180, 420, n), 1.0, 0.8, n) * swell(n, 0.1, 0.15) * 0.3
    return whoosh + rise


def arrow_storm():
    twangs = [delay(pluck(freq, 0.35, 21 + i, 0.992), i * 0.025) for i, freq in enumerate((110, 131, 98))]
    n = samples(0.25)
    swish = delay(svf(noise(n, 24), glide(1500, 4000, n), 1.5) * swell(n, 0.04, 0.06), 0.04)
    return mix(*twangs, swish * 0.7)


def hit():
    n = samples(0.16)
    thump = sine(glide(220, 80, n), n) * decay(n, 0.035, 0.001)
    snap = svf(noise(n, 25), 3000, 1.0) * decay(n, 0.01) * 1.0
    thwack = fm(glide(400, 200, n), 1.5, 3.0, n) * decay(n, 0.025) * 0.35
    return thump + snap + thwack


def enemy_defeated():
    n = samples(0.4)
    blip = fm(glide(900, 200, samples(0.16)), 1.0, 1.5, samples(0.16)) * decay(samples(0.16), 0.06, 0.002)
    puff = svf(noise(n, 26), 1200, 0.8, "low") * swell(n, 0.01, 0.07) * 1.2
    ping = delay(fm(note("E6"), 2.0, 1.0, samples(0.2)) * decay(samples(0.2), 0.05, 0.002) * 0.3, 0.14)
    return echo(mix(blip * 0.7, puff, ping), 0.08, 0.25, 0.2, 2)


def boss_hit():
    n = samples(0.34)
    thump = sine(glide(130, 45, n), n) * decay(n, 0.07, 0.001)
    crunch = svf(noise(n, 27), 1800, 0.8, "low") * decay(n, 0.03) * 1.3
    ring = fm(600, 2.76, 3.0, n) * decay(n, 0.09, 0.002) * 0.3
    return echo(thump + crunch + ring, 0.09, 0.3, 0.2, 2)


def boss_defeated():
    n = samples(1.2)
    explosion = svf(noise(n, 28), glide(3000, 90, n), 0.8, "low") * swell(n, 0.01, 0.35) * 2.0
    boom = sine(glide(70, 28, n), n) * decay(n, 0.45, 0.005) * 0.9
    fanfare = []
    for i, name in enumerate(("C5", "E5", "G5", "C6")):
        length = 0.9 if i == 3 else 0.14
        m = samples(length + 0.3)
        t = times(m)
        vibrato = 1 + (0.012 * np.sin(2 * np.pi * 5.5 * t) if i == 3 else 0)
        brass = fm(note(name) * vibrato, 1.0, np.linspace(2.5, 1.2, m), m) * swell(m, 0.02, length * 0.8)
        fanfare.append(delay(brass * 0.45, 0.75 + i * 0.13))
    return echo(mix(explosion, boom, *fanfare), 0.14, 0.35, 0.3)


def wood():
    n = samples(0.14)
    knock = fm(glide(320, 260, n), 1.0, 1.2, n) * decay(n, 0.03, 0.001)
    click = svf(noise(n, 29), 1500, 1.2) * decay(n, 0.01) * 0.9
    return knock + click


def coin():
    first = fm(note("B5"), 2.0, 1.0, samples(0.09)) * decay(samples(0.09), 0.06, 0.002)
    n = samples(0.35)
    second = fm(note("E6"), 2.0, np.linspace(1.4, 0.4, n), n) * decay(n, 0.11, 0.002)
    return echo(mix(first, delay(second, 0.075)), 0.09, 0.3, 0.2, 2)


def potion():
    rng = np.random.RandomState(30)
    bubbles = []
    start = 0.0
    for i in range(7):
        n = samples(0.05)
        freq = glide(380 + i * 70 + rng.uniform(-30, 30), 700 + i * 90, n)
        bubbles.append(delay(sine(freq, n) * decay(n, 0.018, 0.002) * 0.6, start))
        start += rng.uniform(0.035, 0.06)
    n = samples(0.4)
    sparkle = delay(fm(glide(note("C6"), note("G6"), n), 2.0, 1.2, n) * decay(n, 0.12, 0.004) * 0.45, start)
    return echo(mix(*bubbles, sparkle), 0.1, 0.35, 0.3)


def victory():
    melody = (("C5", 0.12), ("E5", 0.12), ("G5", 0.12), ("C6", 0.12), ("G5", 0.12), ("C6", 0.7))
    harmony = (("G4", 0.12), ("C5", 0.12), ("E5", 0.12), ("G5", 0.12), ("E5", 0.12), ("E5", 0.7))
    parts = []
    for voice, level in ((melody, 0.6), (harmony, 0.3)):
        start = 0.0
        for name, length in voice:
            n = samples(length + 0.25)
            t = times(n)
            vibrato = 1 + (0.01 * np.sin(2 * np.pi * 5.5 * t) if length > 0.3 else 0)
            brass = fm(note(name) * vibrato, 1.0, np.linspace(2.4, 1.1, n), n) * swell(n, 0.015, length * 0.8)
            parts.append(delay(brass * level, start))
            start += length
    return echo(mix(*parts), 0.13, 0.35, 0.3)


def game_over():
    parts = []
    start = 0.0
    for name, length in (("G4", 0.28), ("F#4", 0.28), ("F4", 0.28), ("E4", 1.0)):
        n = samples(length + 0.35)
        t = times(n)
        vibrato = 1 + (0.02 * np.sin(2 * np.pi * 5 * t) if length > 0.5 else 0)
        tone = fm(note(name) * vibrato, 1.0, 1.6, n) * swell(n, 0.02, length * 0.7)
        parts.append(delay(tone * 0.7, start))
        start += length
    return echo(mix(*parts), 0.15, 0.35, 0.3)


def menu_move():
    n = samples(0.07)
    return fm(note("A5"), 2.0, 0.8, n) * decay(n, 0.025, 0.002)


def menu_ok():
    first = fm(note("C6"), 2.0, 1.0, samples(0.08)) * decay(samples(0.08), 0.04, 0.002)
    n = samples(0.25)
    second = fm(note("G6"), 2.0, 1.0, n) * decay(n, 0.08, 0.002)
    return echo(mix(first, delay(second, 0.06)), 0.08, 0.3, 0.2, 2)


def splash():
    n = samples(0.36)
    burst = svf(noise(n, 31), glide(2200, 700, n), 1.0) * swell(n, 0.008, 0.08) * 1.6
    rng = np.random.RandomState(32)
    drops = [delay(sine(glide(f, f * 1.6, samples(0.04)), samples(0.04)) * decay(samples(0.04), 0.012) * 0.35, start)
             for f, start in zip(rng.uniform(500, 900, 4), np.cumsum(rng.uniform(0.04, 0.07, 4)))]
    return mix(burst, *drops)


def fire():
    n = samples(0.42)
    roar = svf(noise(n, 33), glide(500, 1100, n), 1.2) * swell(n, 0.05, 0.12) * 1.6
    crackle = noise(n, 34)
    crackle = np.where(np.abs(crackle) > 0.985, crackle, 0) * swell(n, 0.03, 0.12) * 3
    return roar + svf(crackle, 3000, 1.0)


SOUNDS = {
    "pulo": jump, "pulo_duplo": air_jump, "dano_jogador": player_hurt, "jogador_caiu": knocked_out,
    "escudo": shield, "pisar": stomp, "reviver": revive,
    "espada": sword, "flecha": bow, "martelo": hammer_throw, "tremor": quake, "soco": punch,
    "katana": katana, "fumaca": smoke, "florete": rapier, "alaude": lute, "encanto": charm,
    "trovao": thunder, "investida": dash, "chuva_de_flechas": arrow_storm,
    "acerto": hit, "bicho_derrotado": enemy_defeated, "chefe_acerto": boss_hit, "chefe_derrotado": boss_defeated,
    "madeira": wood, "moeda": coin, "pocao": potion, "vitoria": victory, "game_over": game_over,
    "menu_mover": menu_move, "menu_ok": menu_ok, "agua": splash, "fogo": fire,
}


def save_mp3(name, signal, folder):
    """Grava em WAV 16-bit e converte para MP3 (mono, 32 kHz) com o lame."""
    signal = finish(signal)
    signal = np.concatenate([signal, np.zeros(max(0, samples(MIN_SECONDS) - len(signal)))])
    pcm = (signal * 32767).astype(np.int16)
    wav_path = folder / f"{name}.wav"
    with wave.open(str(wav_path), "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(SR)
        wav.writeframes(pcm.tobytes())
    mp3_path = OUT / f"{name}.mp3"
    subprocess.run(["lame", "--silent", "-V", "4", str(wav_path), str(mp3_path)], check=True)
    print(f"gerado: {mp3_path} ({len(pcm) / SR:.2f}s, {mp3_path.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as temp:
        for name, make in SOUNDS.items():
            save_mp3(name, make(), Path(temp))
