"""
dragon_variants.py
-----------------------------------------------------------------------------
Gera as variações de cor dos dragões (e dos projéteis) a partir da arte
original, girando a matiz (hue) apenas dos pixels coloridos. Assim o estilo
pixel-art é mantido e só a cor muda.

    py tools/dragon_variants.py
-----------------------------------------------------------------------------
"""
import colorsys
from pathlib import Path
from PIL import Image

ASSETS = Path(__file__).resolve().parent.parent / "assets"

# arquivo de origem -> [(arquivo gerado, rotação de matiz em graus, ganho de saturação)]
# (caminhos relativos a assets/)
VARIANTS = {
    "chefoes/dragao_vermelho/bola_fogo.png":     [("chefoes/serpente_glacial/bola_gelo.png", 190, 1.0),
                                                  ("chefoes/dragao_rosa/bola_rosa.png", 300, 1.0)],
}


def shift_hue(image, degrees, saturation_gain):
    """Gira a matiz dos pixels saturados; tons de cinza (contornos, olhos) ficam iguais."""
    image = image.convert("RGBA")
    pixels = image.load()
    shift = degrees / 360.0
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if s < 0.15:
                continue
            nr, ng, nb = colorsys.hsv_to_rgb((h + shift) % 1.0, min(s * saturation_gain, 1.0), v)
            pixels[x, y] = (int(nr * 255), int(ng * 255), int(nb * 255), a)
    return image


if __name__ == "__main__":
    for source, outputs in VARIANTS.items():
        original = Image.open(ASSETS / source)
        for filename, degrees, gain in outputs:
            shift_hue(original, degrees, gain).save(ASSETS / filename)
            print("gerado:", ASSETS / filename)
