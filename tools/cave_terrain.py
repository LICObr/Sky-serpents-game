"""
cave_terrain.py
-----------------------------------------------------------------------------
Gera o terreno da fase CAVERNA a partir do terreno do campo, trocando as
cores para PEDRA (combinando com o caminho de pedra do fundo):
  - chao_caverna.png        topo de pedra clara com um pouco de musgo
  - terra_caverna.png       rocha escura (interior dos morros)
  - plataforma_caverna.png  ilhas de pedra

    py tools/cave_terrain.py
-----------------------------------------------------------------------------
"""
import colorsys
from pathlib import Path
from PIL import Image

FOLDER = Path(__file__).resolve().parent.parent / "assets" / "cenario"
# Cores exatas do chão do campo → pedra
STONE = {
    (92, 186, 72): (150, 148, 142),   # grama clara → pedra clara
    (60, 140, 52): (96, 108, 80),     # grama escura → musgo escuro
    (142, 96, 58): (86, 80, 84),      # terra → rocha
    (112, 72, 42): (64, 58, 64),      # terra escura → rocha escura
    (168, 160, 150): (124, 118, 122), # pedrinhas
}


def swap_colors(image, palette):
    out = image.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if (r, g, b) in palette:
                px[x, y] = (*palette[(r, g, b)], a)
    return out


def stony(image):
    """Plataforma: tudo vira tons de pedra (o verde fica um musgo bem apagado)."""
    out = image.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if not a:
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            mossy = 0.17 <= h <= 0.45 and s > 0.2
            nr, ng, nb = colorsys.hsv_to_rgb(0.22 if mossy else 0.75, s * (0.35 if mossy else 0.12), v * 0.8)
            px[x, y] = (int(nr * 255), int(ng * 255), int(nb * 255), a)
    return out


if __name__ == "__main__":
    outputs = {
        "chao_caverna.png": swap_colors(Image.open(FOLDER / "chao.png").convert("RGBA"), STONE),
        "terra_caverna.png": swap_colors(Image.open(FOLDER / "terra.png").convert("RGBA"), STONE),
        "plataforma_caverna.png": stony(Image.open(FOLDER / "plataforma.png").convert("RGBA")),
    }
    for name, image in outputs.items():
        image.save(FOLDER / name)
        print("gerado:", FOLDER / name)
