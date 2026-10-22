"""
cave_background.py
-----------------------------------------------------------------------------
Gera o fundo da fase CAVERNA (assets/cenario/fundo_caverna.jpg) a partir da
arte original (source_art/cenario/caverna_original.jpg): a imagem na altura
da tela e, ao lado, a mesma imagem ESPELHADA. Assim a ponta direita encosta
na esquerda sem corte nenhum e o fundo fica INFINITO (a fase marca
BACKGROUND_SEAMLESS). O pântano usa a mesma ideia (swamp_background.py).

    py tools/cave_background.py
-----------------------------------------------------------------------------
"""
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
HEIGHT = 600  # altura da tela do jogo


def save_background(image, out):
    """Fundo é opaco: salva em JPG (bem mais leve que PNG — o jogo carrega mais rápido)."""
    image.convert("RGB").save(out, "JPEG", quality=90, optimize=True, progressive=True)


def mirror_background(source, out):
    """Imagem na altura da tela + a mesma espelhada ao lado (emenda perfeita)."""
    original = Image.open(source).convert("RGB")
    width = round(original.width * HEIGHT / original.height)
    image = original.resize((width, HEIGHT), Image.LANCZOS)
    seamless = Image.new("RGB", (width * 2, HEIGHT))
    seamless.paste(image, (0, 0))
    seamless.paste(ImageOps.mirror(image), (width, 0))
    save_background(seamless, out)
    print("gerado:", out, seamless.size)


if __name__ == "__main__":
    mirror_background(ROOT / "source_art" / "cenario" / "caverna_original.jpg",
                      ROOT / "assets" / "cenario" / "fundo_caverna.jpg")
