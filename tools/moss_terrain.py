"""
moss_terrain.py
-----------------------------------------------------------------------------
Gera o terreno da fase MONTANHA DA SELVA a partir do terreno do campo:
  - chao_musgo.png       grama cor de musgo, bem FALHADA (pedaços de terra)
  - chao_neve.png        neve no lugar da grama (alto da montanha)
  - plataforma_musgo.png ilhas flutuantes cor de musgo
A terra de baixo continua a do campo (terra.png). O chão de musgo tem 4
blocos de largura para as falhas não se repetirem tão perto uma da outra.

    py tools/moss_terrain.py
-----------------------------------------------------------------------------
"""
import colorsys
import random
from pathlib import Path
from PIL import Image

FOLDER = Path(__file__).resolve().parent.parent / "assets" / "cenario"
ART_PIXEL = 20           # um "pixel" da arte dentro do bloco de 160px
BLOCKS = 4               # largura do chão de musgo, em blocos
GRASS_ROWS = 3           # linhas de pixels da grama no topo do bloco
OUTLINE = (34, 22, 30)   # contorno escuro embaixo da grama
MOSS = {(92, 186, 72): (120, 140, 66), (60, 140, 52): (82, 102, 48)}
SNOW = {(92, 186, 72): (236, 246, 255), (60, 140, 52): (184, 214, 240)}
SEED = 6

random.seed(SEED)


def tiled(image, blocks):
    """O bloco repetido lado a lado."""
    out = Image.new("RGBA", (image.width * blocks, image.height))
    for i in range(blocks):
        out.paste(image, (i * image.width, 0))
    return out


def swap_colors(image, palette):
    """Troca cores exatas (a arte usa poucas cores, sem degradê)."""
    out = image.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if (r, g, b) in palette:
                px[x, y] = (*palette[(r, g, b)], a)
    return out


def patchy_moss(grass, dirt):
    """Grama falhada: em algumas colunas ela fica baixinha ou some (aparece a terra)."""
    out, soil = tiled(grass, BLOCKS), tiled(dirt, BLOCKS)
    px, soil_px = out.load(), soil.load()
    grass_colors = set(MOSS) | {OUTLINE}
    for column in range(out.width // ART_PIXEL):
        roll = random.random()
        keep_rows = GRASS_ROWS if roll < 0.55 else (1 if roll < 0.8 else 0)  # cheia, baixinha ou sem grama
        for x in range(column * ART_PIXEL, (column + 1) * ART_PIXEL):
            for y in range(keep_rows * ART_PIXEL, GRASS_ROWS * ART_PIXEL):
                if px[x, y][:3] in grass_colors:
                    px[x, y] = soil_px[x, y]
    return swap_colors(out, MOSS)


def mossy(r, g, b):
    """Verde vivo vira verde-musgo (mais amarelado, apagado e escuro)."""
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    if 0.17 <= h <= 0.45 and s > 0.2:
        nr, ng, nb = colorsys.hsv_to_rgb(0.2, s * 0.6, v * 0.85)
        return (int(nr * 255), int(ng * 255), int(nb * 255))
    return (r, g, b)


def mossy_platform(image):
    out = image.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if a:
                px[x, y] = (*mossy(r, g, b), a)
    return out


if __name__ == "__main__":
    grass = Image.open(FOLDER / "chao.png").convert("RGBA")
    dirt = Image.open(FOLDER / "terra.png").convert("RGBA")
    outputs = {
        "chao_musgo.png": patchy_moss(grass, dirt),
        "chao_neve.png": swap_colors(grass, SNOW),
        "plataforma_musgo.png": mossy_platform(Image.open(FOLDER / "plataforma.png").convert("RGBA")),
    }
    for name, image in outputs.items():
        image.save(FOLDER / name)
        print("gerado:", FOLDER / name)
