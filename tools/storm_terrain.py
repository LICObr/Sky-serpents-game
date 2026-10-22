"""
storm_terrain.py
-----------------------------------------------------------------------------
Terreno da fase da TEMPESTADE (de noite): verde bem escuro, quase preto.
  - chao_tempestade.png        grama verde-escura molhada
  - terra_tempestade.png       terra quase preta
  - plataforma_tempestade.png  ilhas escuras com musgo

    py tools/storm_terrain.py
-----------------------------------------------------------------------------
"""
import colorsys
from PIL import Image
from cave_terrain import FOLDER, swap_colors

# Cores exatas do chão do campo → noite de tempestade
NIGHT = {
    (92, 186, 72): (38, 70, 44),      # grama clara → verde bem escuro
    (60, 140, 52): (22, 44, 28),      # grama escura → quase preto
    (142, 96, 58): (30, 30, 30),      # terra → quase preta
    (112, 72, 42): (20, 20, 22),      # terra escura → preta
    (168, 160, 150): (54, 62, 60),    # pedrinhas → cinza molhado
}


def darkened(image):
    """Ilha: o verde vira verde-escuro e o resto, pedra quase preta."""
    out = image.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if not a:
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            mossy = 0.17 <= h <= 0.45 and s > 0.2
            nr, ng, nb = colorsys.hsv_to_rgb(0.36 if mossy else 0.5, s * (0.55 if mossy else 0.12), v * (0.32 if mossy else 0.24))
            px[x, y] = (int(nr * 255), int(ng * 255), int(nb * 255), a)
    return out


if __name__ == "__main__":
    outputs = {
        "chao_tempestade.png": swap_colors(Image.open(FOLDER / "chao.png").convert("RGBA"), NIGHT),
        "terra_tempestade.png": swap_colors(Image.open(FOLDER / "terra.png").convert("RGBA"), NIGHT),
        "plataforma_tempestade.png": darkened(Image.open(FOLDER / "plataforma.png").convert("RGBA")),
    }
    for name, image in outputs.items():
        image.save(FOLDER / name)
        print("gerado:", FOLDER / name)
