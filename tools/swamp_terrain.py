"""
swamp_terrain.py
-----------------------------------------------------------------------------
Gera o terreno da fase PÂNTANO a partir do terreno do campo, trocando as
cores para as do pântano (combinando com o fundo):
  - chao_pantano.png        musgo verde-escuro encharcado
  - terra_pantano.png       lama escura (interior dos morros)
  - plataforma_pantano.png  ilhas de musgo e lama

    py tools/swamp_terrain.py
-----------------------------------------------------------------------------
"""
import colorsys
from PIL import Image
from cave_terrain import FOLDER, swap_colors

# Cores exatas do chão do campo → pântano
SWAMP = {
    (92, 186, 72): (82, 126, 64),     # grama clara → musgo
    (60, 140, 52): (48, 84, 50),      # grama escura → musgo escuro
    (142, 96, 58): (70, 60, 50),      # terra → lama
    (112, 72, 42): (50, 42, 36),      # terra escura → lama escura
    (168, 160, 150): (96, 106, 88),   # pedrinhas → pedrinhas com limo
}


def swampy(image):
    """Plataforma: verdes viram musgo apagado e o resto, lama escura."""
    out = image.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if not a:
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            mossy = 0.17 <= h <= 0.45 and s > 0.2
            if mossy:
                nr, ng, nb = colorsys.hsv_to_rgb(0.28, s * 0.55, v * 0.62)
            else:
                nr, ng, nb = colorsys.hsv_to_rgb(0.08, s * 0.35, v * 0.6)
            px[x, y] = (int(nr * 255), int(ng * 255), int(nb * 255), a)
    return out


if __name__ == "__main__":
    outputs = {
        "chao_pantano.png": swap_colors(Image.open(FOLDER / "chao.png").convert("RGBA"), SWAMP),
        "terra_pantano.png": swap_colors(Image.open(FOLDER / "terra.png").convert("RGBA"), SWAMP),
        "plataforma_pantano.png": swampy(Image.open(FOLDER / "plataforma.png").convert("RGBA")),
    }
    for name, image in outputs.items():
        image.save(FOLDER / name)
        print("gerado:", FOLDER / name)
