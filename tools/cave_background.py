"""
cave_background.py
-----------------------------------------------------------------------------
Gera o fundo da fase CAVERNA (assets/cenario/fundo_caverna.png) a partir da
arte original (source_art/cenario/caverna_original.jpg): a imagem na altura
da tela e, ao lado, a mesma imagem ESPELHADA. Assim a ponta direita encosta
na esquerda sem corte nenhum e o fundo fica INFINITO (a fase marca
BACKGROUND_SEAMLESS).

    py tools/cave_background.py
-----------------------------------------------------------------------------
"""
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "source_art" / "cenario" / "caverna_original.jpg"
OUT = ROOT / "assets" / "cenario" / "fundo_caverna.png"
HEIGHT = 600  # altura da tela do jogo


if __name__ == "__main__":
    original = Image.open(SOURCE).convert("RGB")
    width = round(original.width * HEIGHT / original.height)
    image = original.resize((width, HEIGHT), Image.LANCZOS)
    seamless = Image.new("RGB", (width * 2, HEIGHT))
    seamless.paste(image, (0, 0))
    seamless.paste(ImageOps.mirror(image), (width, 0))
    seamless.save(OUT, optimize=True)
    print("gerado:", OUT, seamless.size)
