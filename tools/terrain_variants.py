"""
terrain_variants.py
-----------------------------------------------------------------------------
Gera as versões das ILHAS FLUTUANTES para cada tema de fase, mudando só a
parte verde (a grama) da imagem original:
  - plataforma_gelo.png → grama vira NEVE (branca, levemente azulada)
  - plataforma_rosa.png → grama vira grama MÍSTICA (rosa)
As pedras ficam iguais, mas ganham um leve tom do tema.

    py tools/terrain_variants.py
-----------------------------------------------------------------------------
"""
import colorsys
from pathlib import Path
from PIL import Image

FOLDER = Path(__file__).resolve().parent.parent / "assets" / "cenario"
SOURCE = FOLDER / "plataforma.png"


def is_grass(h, s):
    """Pixels verdes (matiz entre amarelo-esverdeado e verde-azulado)."""
    return 0.17 <= h <= 0.45 and s > 0.25


def to_snow(r, g, b):
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    if is_grass(h, s):
        # Neve: quase branca, sombras azuladas conforme o brilho original
        light = 0.55 + 0.45 * v
        return (int(225 * light + 25), int(238 * light + 17), int(255 * min(1, light + 0.05)))
    # Pedras: um pouco mais frias (azuladas)
    return (int(r * 0.9), int(g * 0.95), min(255, int(b * 1.12)))


def to_mystic(r, g, b):
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    if is_grass(h, s):
        # verde -> rosa do chão místico (mesma matiz, mais claro)
        nr, ng, nb = colorsys.hsv_to_rgb(0.885, min(s, 0.55), min(1, v * 1.1 + 0.12))
        return (int(nr * 255), int(ng * 255), int(nb * 255))
    # Pedras: levemente arroxeadas
    return (min(255, int(r * 1.05)), int(g * 0.9), min(255, int(b * 1.12)))


def to_jungle(r, g, b):
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    if is_grass(h, s):
        if v > 0.8:  # partes mais claras da grama viram neve
            return (232, 242, 250)
        nr, ng, nb = colorsys.hsv_to_rgb(0.36, min(1, s * 0.9), v * 0.62)  # musgo escuro
        return (int(nr * 255), int(ng * 255), int(nb * 255))
    return (int(r * 0.85), int(g * 0.92), min(255, int(b * 1.02)))


def recolor(image, fn):
    out = image.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if a:
                px[x, y] = (*fn(r, g, b), a)
    return out


if __name__ == "__main__":
    original = Image.open(SOURCE).convert("RGBA")
    for name, fn in (("plataforma_gelo.png", to_snow), ("plataforma_rosa.png", to_mystic),
                     ("plataforma_selva.png", to_jungle)):
        recolor(original, fn).save(FOLDER / name)
        print("gerado:", FOLDER / name)
