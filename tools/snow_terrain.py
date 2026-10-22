"""
snow_terrain.py
-----------------------------------------------------------------------------
Terreno TODO BRANCO para a fase do Urso (Selva Gelada), coberta de neve:
  - chao_branco.png        topo de neve (a neve do alto das montanhas, sem a terra)
  - terra_branca.png       neve compactada (interior dos morros)
  - plataforma_branca.png  ilhas cobertas de neve

    py tools/snow_terrain.py
-----------------------------------------------------------------------------
"""
import colorsys
from PIL import Image
from cave_terrain import FOLDER, swap_colors

# Cores exatas da terra → tons de neve (branco, sombra azulada e pedrinhas de gelo)
SNOW = {
    (142, 96, 58): (226, 236, 248),
    (112, 72, 42): (198, 216, 238),
    (168, 160, 150): (168, 196, 228),
    (34, 22, 30): (140, 166, 204),     # contorno escuro vira sombra azul (mais suave)
}


def snowy(image):
    """Ilha: o verde vira neve e o resto (terra e pedra) vira gelo azul-claro."""
    out = image.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if not a:
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if 0.17 <= h <= 0.45 and s > 0.2:      # grama → neve
                nr, ng, nb = colorsys.hsv_to_rgb(0.6, 0.05, min(1, 0.6 + v * 0.45))
            else:                                    # terra e pedra → gelo
                nr, ng, nb = colorsys.hsv_to_rgb(0.6, 0.18, min(1, 0.45 + v * 0.5))
            px[x, y] = (int(nr * 255), int(ng * 255), int(nb * 255), a)
    return out


if __name__ == "__main__":
    outputs = {
        "chao_branco.png": swap_colors(Image.open(FOLDER / "chao_neve.png").convert("RGBA"), SNOW),
        "terra_branca.png": swap_colors(Image.open(FOLDER / "terra.png").convert("RGBA"), SNOW),
        "plataforma_branca.png": snowy(Image.open(FOLDER / "plataforma.png").convert("RGBA")),
    }
    for name, image in outputs.items():
        image.save(FOLDER / name)
        print("gerado:", FOLDER / name)
