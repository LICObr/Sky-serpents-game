"""
bear_polish.py
-----------------------------------------------------------------------------
ACERTO FINAL da folha do Urso Polar (assets/chefoes/urso_polar/urso_animacoes.png),
depois do bear_sheet.py e do bear_retouch.py. Os quadros vieram de desenhos
diferentes, então o urso "pulava" de tamanho e de lugar entre um quadro e
outro (parecia bugado). Aqui cada quadro é:
  1. medido só pelo CORPO (a maior mancha do desenho: respingos de neve não contam);
  2. escalado para o urso ter sempre o mesmo tamanho: cada animação fica na
     escala do urso parado, e o quadro que foge muito da própria animação é
     corrigido sozinho;
  3. alinhado pelos PÉS: a base do corpo sempre na mesma linha e o centro do
     corpo no meio do quadro.

A folha de antes (e o JSON dela) fica guardada em source_art/chefoes/urso_polar/
urso_animacoes_antes_do_acerto.png/.json (rodar de novo sempre parte dela).

    py tools/bear_polish.py
-----------------------------------------------------------------------------
"""
import json
import math
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
FOLDER = ROOT / "assets" / "chefoes" / "urso_polar"
SHEET = FOLDER / "urso_animacoes.png"
META = FOLDER / "urso_animacoes.json"
BEFORE = ROOT / "source_art" / "chefoes" / "urso_polar" / "urso_animacoes_antes_do_acerto.png"
BEFORE_META = BEFORE.with_suffix(".json")

FOOT_PADDING = 4                 # pés a esta distância da base do quadro (igual ao BODY.FOOT_PADDING do jogo)
REFERENCE = ("parado", range(0, 7))  # o tamanho certo do urso: parado de lado
OUTLIER = 0.18                   # quadro que foge mais que isso da própria animação é corrigido sozinho
UNTOUCHED = ("virando_esq", "virando_dir")  # de frente/de costas: não são usados no jogo
GRID_COLUMNS = 10


def largest_blob(alpha):
    """Máscara da maior mancha (4 vizinhos) do desenho: o corpo do urso."""
    height, width = alpha.shape
    seen = np.zeros_like(alpha, dtype=bool)
    best = None
    for y0, x0 in zip(*np.nonzero(alpha)):
        if seen[y0, x0]:
            continue
        blob, queue = [], deque([(y0, x0)])
        seen[y0, x0] = True
        while queue:
            y, x = queue.popleft()
            blob.append((y, x))
            for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= ny < height and 0 <= nx < width and alpha[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    queue.append((ny, nx))
        if best is None or len(blob) > len(best):
            best = blob
    mask = np.zeros_like(alpha, dtype=bool)
    if best:
        ys, xs = zip(*best)
        mask[list(ys), list(xs)] = True
    return mask


def measure(cell):
    """Área, base (pés) e centro do corpo de um quadro, e até onde vai o desenho todo."""
    drawn = np.asarray(cell)[..., 3] > 40
    body = largest_blob(drawn)
    ys, xs = np.nonzero(body)
    all_ys, all_xs = np.nonzero(drawn)
    return {"area": len(xs), "bottom": ys.max() + 1, "center": xs.mean(),
            "top": all_ys.min(), "left": all_xs.min(), "right": all_xs.max() + 1}


def scale_factors(meta, sizes):
    """Escala de cada quadro: a da animação (pela mediana) ou a dele, se fugir muito."""
    name, frames = REFERENCE
    reference = np.median([sizes[meta["animations"][name][i]]["area"] for i in frames])
    factors = {}
    for animation, indexes in meta["animations"].items():
        own = {i: math.sqrt(reference / sizes[i]["area"]) for i in indexes}
        if animation in UNTOUCHED:
            factors.update({i: 1.0 for i in indexes})
            continue
        typical = float(np.median(list(own.values())))
        for i, factor in own.items():
            factors[i] = factor if abs(factor - typical) / typical > OUTLIER else typical
    return factors


def place(cell, size, factor, width, height):
    """Escala o quadro e encosta os pés na base, com o centro do corpo no meio."""
    scaled = cell.resize((max(1, round(cell.width * factor)), max(1, round(cell.height * factor))), Image.LANCZOS)
    alpha = scaled.getchannel("A").point(lambda a: 255 if a >= 110 else 0)  # borda nítida (pixel art)
    scaled.putalpha(alpha)
    out = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    x = round(width / 2 - size["center"] * factor)
    y = round(height - FOOT_PADDING - size["bottom"] * factor)
    out.alpha_composite(scaled, (x, y)) if x >= 0 and y >= 0 else out.paste(scaled, (x, y), scaled)
    return out


if __name__ == "__main__":
    if not BEFORE.exists():
        Image.open(SHEET).save(BEFORE)
        BEFORE_META.write_text(META.read_text())
    sheet = Image.open(BEFORE).convert("RGBA")
    meta = json.loads(BEFORE_META.read_text())
    fw, fh = meta["frameWidth"], meta["frameHeight"]
    columns = sheet.width // fw
    count = max(i for frames in meta["animations"].values() for i in frames) + 1
    cells = [sheet.crop(((i % columns) * fw, (i // columns) * fh, (i % columns + 1) * fw, (i // columns + 1) * fh))
             for i in range(count)]
    sizes = [measure(cell) for cell in cells]
    factors = scale_factors(meta, sizes)

    # quadro novo: cabe o maior urso já escalado (centralizado e com os pés na base)
    half = max(max(s["center"] - s["left"], s["right"] - s["center"]) * factors[i] for i, s in enumerate(sizes))
    tall = max((s["bottom"] - s["top"]) * factors[i] for i, s in enumerate(sizes))
    width, height = max(fw, math.ceil(half * 2) + 2), max(fh, math.ceil(tall) + FOOT_PADDING + 2)

    rows = math.ceil(count / GRID_COLUMNS)
    out = Image.new("RGBA", (GRID_COLUMNS * width, rows * height), (0, 0, 0, 0))
    for i, cell in enumerate(cells):
        frame = place(cell, sizes[i], factors[i], width, height)
        out.alpha_composite(frame, ((i % GRID_COLUMNS) * width, (i // GRID_COLUMNS) * height))
    out.save(SHEET, optimize=True)
    meta["frameWidth"], meta["frameHeight"] = width, height
    META.write_text(json.dumps(meta, indent=2))
    changed = sum(1 for f in factors.values() if abs(f - 1) > 0.03)
    print(f"gerado: {SHEET} ({width}x{height} por quadro, {changed} quadros reescalados)")
