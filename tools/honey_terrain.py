"""
honey_terrain.py
-----------------------------------------------------------------------------
Gera o terreno da fase FLORESTA DO MEL a partir do terreno da selva gelada,
trocando a NEVE por MEL e o musgo escuro por grama VERDE-AMARELADA:
  - chao_mel.png       (topo do chão)       ← chao_selva.png
  - terra_mel.png      (terra dos morros)   ← terra_selva.png
  - plataforma_mel.png (ilhas flutuantes)   ← plataforma_selva.png
E as ÁRVORES quebráveis AMARELAS (folhas amarelas, mel no lugar da neve):
  - arvore_mel_0.png (inteira) / arvore_mel_1.png (rachada) ← arvore_0/1.png

    py tools/honey_terrain.py
-----------------------------------------------------------------------------
"""
import colorsys
from pathlib import Path
from PIL import Image

FOLDER = Path(__file__).resolve().parent.parent / "assets" / "cenario"
VARIANTS = {
    "chao_selva.png": "chao_mel.png",
    "terra_selva.png": "terra_mel.png",
    "plataforma_selva.png": "plataforma_mel.png",
}
TREES = {
    "arvore_0.png": "arvore_mel_0.png",
    "arvore_1.png": "arvore_mel_1.png",
}
HONEY = (240, 176, 36)
HONEY_LIGHT = (255, 218, 96)


def to_honey(r, g, b):
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    # neve (quase branca) e pedrinhas de gelo (azul-claro) viram MEL
    if v > 0.75 and (s < 0.15 or 0.45 <= h <= 0.62):
        return HONEY_LIGHT if v > 0.92 else HONEY
    # musgo/grama verde vira verde-amarelado e mais claro
    if 0.17 <= h <= 0.45 and s > 0.2:
        hue = 0.2 + (h - 0.33) * 0.25
        nr, ng, nb = colorsys.hsv_to_rgb(hue, min(1, s * 1.05), min(1, v * 1.45 + 0.08))
        return (int(nr * 255), int(ng * 255), int(nb * 255))
    # terra e pedras: um pouco mais quentes
    return (min(255, int(r * 1.06)), min(255, int(g * 1.0)), int(b * 0.88))


def tree_to_honey(r, g, b):
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    # neve vira mel claro
    if v > 0.75 and s < 0.15:
        return HONEY_LIGHT
    # folhas verdes viram AMARELAS (com o mesmo claro e escuro de antes)
    if 0.17 <= h <= 0.45 and s > 0.2:
        nr, ng, nb = colorsys.hsv_to_rgb(0.12, min(1, s * 1.35), min(1, v * 1.5))
        return (int(nr * 255), int(ng * 255), int(nb * 255))
    # tronco e contorno ficam iguais
    return (r, g, b)


def recolor(image, to_color=to_honey):
    out = image.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if a:
                px[x, y] = (*to_color(r, g, b), a)
    return out


if __name__ == "__main__":
    for source, target in VARIANTS.items():
        recolor(Image.open(FOLDER / source).convert("RGBA")).save(FOLDER / target)
        print("gerado:", FOLDER / target)
    for source, target in TREES.items():
        recolor(Image.open(FOLDER / source).convert("RGBA"), tree_to_honey).save(FOLDER / target)
        print("gerado:", FOLDER / target)
