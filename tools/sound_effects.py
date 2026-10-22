"""
sound_effects.py
-----------------------------------------------------------------------------
Gera os EFEITOS SONOROS do jogo com cara de filme / jogo profissional (nada
de bipe de videogame antigo nem som fininho):
  - SONS GRAVADOS de verdade (Kenney, CC0 — source_art/sons/kenney/): passos,
    roupa, socos, metal, madeira, pedra, moedas, os menus e as vinhetas
    de vitória e game over em cordas (pizzicato), muitas vezes em camadas
    (ex.: o pulo é o pé empurrando o chão + a roupa balançando);
  - VOZES (source_art/sons/vozes/): gemidos de dor de homem e de mulher,
    para quando o personagem perde um coração (créditos no LICENCA.txt);
  - o que não existe gravado é SINTETIZADO em camadas, como no cinema: o arco
    (estalo firme da corda, o arco vibrando e a flecha indo embora), lâminas e
    martelo cortando o ar, fumaça, trovão, magia, poção e explosão — sempre
    com corpo nos graves e um pouco de reverberação de ambiente.
Todos saem no mesmo volume percebido (o jogo ajusta cada um na hora de tocar).
Cada som vira um MP3 em assets/sons/ (precisa do ffmpeg e do lame). Rodar de
novo gera os mesmos sons.

    py tools/sound_effects.py
-----------------------------------------------------------------------------
"""
import subprocess
import tempfile
import wave
from functools import lru_cache
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SOURCES = ROOT / "source_art" / "sons" / "kenney"
VOICES = ROOT / "source_art" / "sons" / "vozes"
OUT = ROOT / "assets" / "sons"
SR = 44100
LOUDNESS_DB = -16               # volume da parte que soa (todos os sons iguais)
PEAK = 0.95                     # os picos são segurados aqui (sem estalar)
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
    """Envelope: sobe em `attack` segundos e cai em `release` (vento, fumaça, acordes)."""
    t = times(n)
    rise = np.clip(t / attack, 0, 1)
    fall = np.exp(-np.clip(t - attack, 0, None) / release)
    return fade_end(rise * fall)


def sine(freq, n):
    freq = np.broadcast_to(np.asarray(freq, dtype=float), (n,))
    return np.sin(2 * np.pi * np.cumsum(freq) / SR)


def saw(freq, n):
    freq = np.broadcast_to(np.asarray(freq, dtype=float), (n,))
    return 2 * ((np.cumsum(freq) / SR) % 1.0) - 1


def fm(freq, ratio, index, n):
    """Síntese FM de 2 operadores (só para o brilho de metal das lâminas)."""
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
    """Corda dedilhada (Karplus-Strong): o alaúde."""
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


def pad(names, n, cutoff, seed=0, detune=0.006):
    """Acorde quente (cordas/metais de cinema): serras levemente desafinadas e abafadas."""
    rng = np.random.RandomState(seed)
    t = times(n)
    out = np.zeros(n)
    for name in names:
        for spread in (-detune, 0, detune):
            drift = 1 + 0.002 * np.sin(2 * np.pi * rng.uniform(0.2, 0.6) * t + rng.uniform(0, 6))
            out += saw(note(name) * (1 + spread) * drift, n)
    return svf(out / (3 * len(names)), cutoff, 0.7, "low")


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
    """Repetições cada vez mais baixas e abafadas (o brilho da katana)."""
    taps = [x]
    tap = x
    for i in range(1, repeats + 1):
        tap = svf(tap, 3500, 0.7, "low")
        taps.append(delay(tap * amount * feedback ** (i - 1), time * i))
    return mix(*taps)


@lru_cache(maxsize=None)
def room(seconds, brightness):
    """Resposta de uma sala: um ruído que vai sumindo (e escurecendo)."""
    n = samples(seconds)
    tail = noise(n, 99) * np.exp(-times(n) / (seconds / 5))
    tail = svf(tail, brightness, 0.7, "low")
    tail[:samples(0.012)] = 0  # as primeiras reflexões chegam depois do som
    return tail / (np.sqrt(np.sum(tail ** 2)) + 1e-9)


def reverb(x, seconds=0.8, amount=0.2, brightness=5000):
    """Ambiente: o som batendo nas paredes (convolução com a sala)."""
    ir = room(seconds, brightness)
    size = 1 << int(np.ceil(np.log2(len(x) + len(ir))))
    wet = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[:len(x) + len(ir) - 1]
    return mix(x, wet * amount)


def recording(name, gain=1.0, start=0.0, folder=SOURCES):
    """Um som gravado (mono, 44,1 kHz), sem o silêncio do começo e com o pico em 1."""
    path = next(folder.glob(f"{name}.*"))
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path),
                          "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, dtype=np.int16).astype(float) / 32768
    peak = np.max(np.abs(x)) or 1
    onset = int(np.argmax(np.abs(x) > 0.02 * peak))
    x = x[max(0, onset - samples(0.002)):] / peak * gain
    return delay(x, start) if start else x


def pitch_shift(x, semitones):
    """Muda o tom como numa fita: mais grave = toca mais devagar."""
    factor = 2 ** (semitones / 12)
    return np.interp(np.arange(0, len(x) - 1, factor), np.arange(len(x)), x)


def finish(x):
    """Todos no mesmo volume percebido, picos segurados e começo/fim sem estalo."""
    x = x - np.mean(x)
    active = np.abs(x) > 0.05 * np.max(np.abs(x))
    x = x * (10 ** (LOUDNESS_DB / 20) / np.sqrt(np.mean(x[active] ** 2)))
    x = PEAK * np.tanh(x / PEAK)
    audible = np.nonzero(np.abs(x) > 0.002)[0]   # corta o rabo da reverberação quando ninguém ouve mais
    x = x[:audible[-1] + samples(0.02)]
    fade_in, fade_out = samples(0.001), samples(0.01)
    x[:fade_in] *= np.linspace(0, 1, fade_in)
    x[-fade_out:] *= np.linspace(1, 0, fade_out)
    return x


# ------------------------------------------------------------- jogadores

def jump():
    """Pulo de verdade: o pé empurra o chão e a roupa balança."""
    m = samples(0.06)
    push = sine(glide(110, 60, m), m) * decay(m, 0.02, 0.002) * 0.3
    return mix(recording("footstep02", 0.9), recording("cloth3", 0.7, 0.015), push)


def air_jump():
    """Pulo no ar (ninja): a roupa estala e o corpo gira cortando o ar."""
    n = samples(0.3)
    whoosh = svf(noise(n, 2), glide(350, 1100, n), 1.4) * swell(n, 0.06, 0.08) * 1.2
    return mix(recording("cloth1", 0.8), whoosh)


def player_hurt():
    """Apanhou: soco pesado no corpo."""
    return reverb(mix(recording("impactPunch_heavy_000"), recording("impactSoft_heavy_000", 0.5)), 0.5, 0.12)


def knocked_out():
    """Caiu sem corações: o corpo vai ao chão, o equipamento cai e um baque grave."""
    n = samples(0.9)
    boom = sine(glide(70, 32, n), n) * decay(n, 0.25, 0.005) * 0.6
    return reverb(mix(recording("impactSoft_heavy_001"), recording("dropLeather", 0.7, 0.14), boom), 1.0, 0.18)


def shield():
    """O escudinho segurou: pancada de metal pesado ressoando."""
    return reverb(recording("impactPlate_heavy_001"), 0.7, 0.2)


def male_grunt(number):
    """Perdeu um coração: gemido de dor de homem, baixo e grave."""
    return reverb(pitch_shift(recording(f"homem_gemido_{number}", folder=VOICES), -2), 0.4, 0.08)


def female_grunt(number):
    """Perdeu um coração: gemido de dor de mulher (a arqueira)."""
    return reverb(recording(f"mulher_gemido_{number}", folder=VOICES), 0.4, 0.08)


def stomp():
    """Pisou em cima: baque abafado e um esmagar."""
    return mix(recording("impactSoft_medium_000"), recording("footstep_snow_001", 0.7))


def revive():
    """De pé de novo: um acorde quente que cresce, com um sopro de ar."""
    n = samples(1.4)
    chord = pad(["C3", "G3", "C4", "E4"], n, glide(900, 2600, n), seed=1) * swell(n, 0.35, 0.45)
    air = svf(noise(n, 3), 2200, 0.8) * swell(n, 0.4, 0.3) * 0.25
    return reverb(mix(chord, air), 1.2, 0.3)


# ------------------------------------------------------------- ataques

def sword():
    """Espada cortando o ar: um "vush" encorpado com um brilho de metal no fim."""
    n = samples(0.32)
    swish = svf(noise(n, 6), glide(500, 2600, n), 1.8) * swell(n, 0.05, 0.06) * 1.6
    body = svf(noise(n, 7), 260, 0.9) * swell(n, 0.04, 0.06) * 0.8
    shing = fm(1700, 2.7, 1.2, n) * decay(n, 0.07, 0.01) * 0.12
    return reverb(swish + body + shing, 0.5, 0.12)


def bow_release(seed, pitch=1.0):
    """Arco de filme: estalo firme da corda, o arco vibrando e a flecha indo embora."""
    m = samples(0.14)
    thump = sine(glide(150 * pitch, 62 * pitch, m), m) * decay(m, 0.035, 0.001)
    knock = svf(noise(m, seed), 420 * pitch, 3.0) * decay(m, 0.022, 0.0005) * 2.2
    snap = svf(noise(m, seed + 1), 3200, 1.2) * decay(m, 0.004, 0.0003) * 0.6
    k = samples(0.22)
    shake = 1 + 0.35 * np.sin(2 * np.pi * 28 * times(k))
    hum = svf(saw(glide(92 * pitch, 76 * pitch, k), k), 520, 0.8, "low") * decay(k, 0.07, 0.002) * shake * 0.55
    w = samples(0.3)
    flight = delay(svf(noise(w, seed + 2), glide(2600, 850, w), 2.4) * swell(w, 0.02, 0.08) * 1.3, 0.01)
    return mix(thump, knock, snap, hum, flight)


def bow():
    return reverb(bow_release(70), 0.6, 0.15)


def arrow_storm():
    """Várias flechas soltando quase juntas (cada uma um pouquinho diferente)."""
    shots = [delay(bow_release(80 + i * 10, 1 + (i - 1) * 0.06), i * 0.045) for i in range(3)]
    return reverb(mix(*shots), 0.7, 0.16)


def hammer_throw():
    """Martelo girando no ar: um "vum-vum" pesado."""
    n = samples(0.42)
    spin = 1 + 0.45 * np.sin(2 * np.pi * 11 * times(n))
    whoosh = svf(noise(n, 9), glide(220, 760, n), 1.5) * swell(n, 0.08, 0.12) * spin * 1.8
    return mix(recording("cloth2", 0.6), whoosh)


def quake():
    """O martelo cai: pedra rachando, estrondo grave e o chão roncando."""
    n = samples(1.2)
    boom = sine(glide(68, 28, n), n) * decay(n, 0.3, 0.004) * 0.9
    rumble = svf(noise(n, 10), 140, 0.7, "low") * swell(n, 0.03, 0.35) * 3.0
    return reverb(mix(recording("impactMining_000"), boom, rumble), 1.0, 0.18)


def punch():
    return recording("impactPunch_medium_000")


def katana():
    """Corte rápido e afiado (o mesmo de antes: aprovado!)."""
    n = samples(0.26)
    swish = svf(noise(n, 13), glide(2000, 6500, n), 2.2) * swell(n, 0.02, 0.03) * 1.6
    shing = fm(3200, 1.41, 2.0, n) * decay(n, 0.08, 0.005) * 0.35
    return echo(swish + shing, 0.06, 0.25, 0.2, 2)


def smoke():
    """Bomba de fumaça: "puf" abafado e a roupa sumindo."""
    n = samples(0.6)
    poof = svf(noise(n, 14), glide(2600, 260, n), 0.8, "low") * swell(n, 0.008, 0.16) * 2.2
    thud = sine(glide(120, 55, n), n) * decay(n, 0.06, 0.002) * 0.5
    return reverb(mix(poof + thud, recording("cloth4", 0.4)), 0.6, 0.15)


def rapier():
    """Estocada de florete: um corte curto e reto."""
    n = samples(0.22)
    swish = svf(noise(n, 15), glide(1100, 3600, n), 2.0) * swell(n, 0.015, 0.03) * 1.5
    body = svf(noise(n, 16), 380, 1.0) * swell(n, 0.012, 0.03) * 0.6
    tsing = fm(2100, 2.0, 1.0, n) * decay(n, 0.045, 0.002) * 0.1
    return swish + body + tsing


def lute():
    """O bardo toca: um acorde de Ré dedilhado, grave e cheio, com a caixa do alaúde."""
    strings = [delay(pluck(note(name), 1.3, 16 + i, 0.9975), i * 0.04)
               for i, name in enumerate(("D3", "A3", "D4", "F#4"))]
    n = samples(0.12)
    body = svf(noise(n, 20), 160, 1.2) * decay(n, 0.03, 0.001) * 0.6
    return reverb(mix(*strings, body), 1.2, 0.25)


def charm():
    """Encantou: um "uuush" que cresce num acorde mágico quente (nada de sininho fino)."""
    n = samples(1.3)
    chord = pad(["A2", "E3", "A3", "C#4"], n, glide(700, 2400, n), seed=4) * swell(n, 0.3, 0.4)
    rise = svf(noise(n, 21), glide(600, 2400, n), 1.2) * swell(n, 0.25, 0.15) * 0.5
    return reverb(mix(chord, rise), 1.4, 0.32)


def thunder():
    """Trovão: o estalo do raio e o ronco que rola pelo céu."""
    n = samples(2.6)
    c = samples(0.08)
    crack = svf(noise(c, 17), 1800, 0.6) * decay(c, 0.03, 0.0005) * 1.6
    rolls = []
    for i, (start, length, cutoff) in enumerate(((0.05, 1.4, 260), (0.45, 1.3, 180), (0.95, 1.4, 140))):
        m = samples(length)
        roll = np.clip(0.55 + 12 * svf(noise(m, 40 + i), 5, 0.7, "low"), 0.2, 1.4)  # o ronco vai e volta
        rolls.append(delay(svf(noise(m, 30 + i), cutoff, 0.7, "low") * swell(m, 0.08, length * 0.3) * roll * 3.0, start))
    boom = sine(glide(52, 30, n), n) * decay(n, 0.6, 0.01) * 0.7
    return reverb(mix(crack, *rolls, boom), 1.6, 0.25)


def dash():
    """Investida: deslocamento de ar pesado."""
    n = samples(0.6)
    whoosh = svf(noise(n, 22), glide(280, 1600, n), 1.5) * swell(n, 0.15, 0.18) * 1.8
    body = svf(noise(n, 23), 180, 0.8, "low") * swell(n, 0.12, 0.2) * 1.2
    return mix(recording("cloth1", 0.5), whoosh + body)


# ------------------------------------------------------------- bichos, chefões e cenário

def hit():
    return recording("impactPunch_medium_001")


def enemy_defeated():
    """Bicho derrotado: baque surdo e um "puf"."""
    n = samples(0.45)
    poof = svf(noise(n, 24), glide(1600, 300, n), 0.8, "low") * swell(n, 0.01, 0.1) * 1.6
    return reverb(mix(recording("impactSoft_heavy_000"), delay(poof, 0.02) * 0.7), 0.6, 0.14)


def boss_hit():
    """Chefão apanhando: soco pesado, estrondo grave e pedra."""
    n = samples(0.5)
    boom = sine(glide(95, 42, n), n) * decay(n, 0.09, 0.002) * 0.8
    return reverb(mix(recording("impactPunch_heavy_001"), boom, recording("impactMining_001", 0.35)), 0.7, 0.16)


def boss_defeated():
    """Chefão derrotado: explosão, estrondo e um acorde de vitória de cinema."""
    n = samples(1.8)
    explosion = svf(noise(n, 28), glide(4200, 90, n), 0.7, "low") * swell(n, 0.008, 0.45) * 2.4
    boom = sine(glide(62, 24, n), n) * decay(n, 0.5, 0.004)
    m = samples(2.0)
    stinger = delay(pad(["C2", "G2", "C3", "E3", "G3"], m, glide(600, 2600, m), seed=8) * swell(m, 0.12, 0.8) * 0.9, 0.55)
    return reverb(mix(explosion, boom, recording("impactMining_001", 0.8, 0.05), stinger), 1.8, 0.28)


def wood():
    return recording("impactWood_medium_000")


def splash():
    """Água: o corpo afundando, os respingos e umas bolhas."""
    n = samples(0.5)
    p = samples(0.09)
    plunge = sine(glide(320, 85, p), p) * decay(p, 0.03, 0.001) * 0.8
    spray = svf(noise(n, 31), glide(1800, 600, n), 0.9) * swell(n, 0.006, 0.09) * 1.6
    rng = np.random.RandomState(32)
    b = samples(0.05)
    bubbles = [delay(sine(glide(f, f * 1.4, b), b) * decay(b, 0.015) * 0.3, start)
               for f, start in zip(rng.uniform(180, 380, 4), np.cumsum(rng.uniform(0.04, 0.08, 4)))]
    return reverb(mix(plunge, spray, *bubbles), 0.5, 0.12)


def fire():
    """Bola de fogo do chefão: labareda rugindo e estalando."""
    n = samples(0.55)
    roar = svf(noise(n, 33), glide(380, 950, n), 1.0) * swell(n, 0.05, 0.14) * 1.8
    low = svf(noise(n, 35), 160, 0.8, "low") * swell(n, 0.04, 0.14) * 1.4
    crackle = noise(n, 34)
    crackle = np.where(np.abs(crackle) > 0.988, crackle, 0) * swell(n, 0.03, 0.14) * 2.5
    return roar + low + svf(crackle, 2500, 1.0)


# ------------------------------------------------------------- itens, fim de fase e menus

def coin():
    """Moedas caindo na bolsinha de couro."""
    return mix(recording("handleCoins2"), recording("handleSmallLeather", 0.6))


def potion():
    """Poção: tira a rolha, glub-glub e uma onda quente de cura."""
    m = samples(0.08)
    cork = sine(glide(380, 160, m), m) * decay(m, 0.018, 0.0005) * 0.9 + svf(noise(m, 36), 900, 1.0) * decay(m, 0.006) * 0.5
    g = samples(0.07)
    glugs = [delay(sine(glide(f, f * 1.25, g), g) * decay(g, 0.03, 0.004) * 0.7, 0.12 + i * 0.09)
             for i, f in enumerate((150, 175, 140))]
    n = samples(1.0)
    heal = delay(pad(["F3", "A3", "C4"], n, glide(800, 2000, n), seed=6) * swell(n, 0.2, 0.35) * 0.6, 0.35)
    return reverb(mix(cork, *glugs, heal), 0.9, 0.22)


def victory():
    return reverb(recording("jingles_PIZZI02"), 1.2, 0.2)


def game_over():
    return reverb(recording("jingles_PIZZI01"), 1.2, 0.2)


def menu_move():
    """Batidinha de madeira (escolher no menu)."""
    return recording("impactWood_light_000")


def menu_ok():
    """Fechar o livro: confirmado."""
    return recording("bookClose")


SOUNDS = {
    "pulo": jump, "pulo_duplo": air_jump, "dano_jogador": player_hurt, "jogador_caiu": knocked_out,
    "escudo": shield, "pisar": stomp, "reviver": revive,
    "gemido_homem_1": lambda: male_grunt(1), "gemido_homem_2": lambda: male_grunt(3), "gemido_homem_3": lambda: male_grunt(5),
    "gemido_mulher_1": lambda: female_grunt(1), "gemido_mulher_2": lambda: female_grunt(2), "gemido_mulher_3": lambda: female_grunt(3),
    "espada": sword, "flecha": bow, "martelo": hammer_throw, "tremor": quake, "soco": punch,
    "katana": katana, "fumaca": smoke, "florete": rapier, "alaude": lute, "encanto": charm,
    "trovao": thunder, "investida": dash, "chuva_de_flechas": arrow_storm,
    "acerto": hit, "bicho_derrotado": enemy_defeated, "chefe_acerto": boss_hit, "chefe_derrotado": boss_defeated,
    "madeira": wood, "moeda": coin, "pocao": potion, "vitoria": victory, "game_over": game_over,
    "menu_mover": menu_move, "menu_ok": menu_ok, "agua": splash, "fogo": fire,
}


def save_mp3(name, signal, folder):
    """Grava em WAV 16-bit e converte para MP3 (mono, 44,1 kHz) com o lame."""
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
