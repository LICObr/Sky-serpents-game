"""
coin_sprite.py
-----------------------------------------------------------------------------
Gera a MOEDA do jogo (assets/itens/moeda.png) a partir da arte original
(source_art/itens/moeda_original.png): apaga o fundo preto em volta, corta
as sobras e reduz para um tamanho leve (o jogo ajusta a escala).

    py tools/coin_sprite.py
-----------------------------------------------------------------------------
"""
from pathlib import Path
from PIL import Image
from sprite_utils import cut_flat_background

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "source_art" / "itens" / "moeda_original.png"
OUT = ROOT / "assets" / "itens" / "moeda.png"
SIZE = 64                     # lado da imagem final (px)
BACKGROUND_TOLERANCE = 60     # o fundo é preto; o contorno da moeda é marrom


if __name__ == "__main__":
    coin = cut_flat_background(Image.open(SOURCE), BACKGROUND_TOLERANCE)
    coin = coin.crop(coin.getbbox())
    coin.resize((SIZE, SIZE), Image.LANCZOS).save(OUT)
    print("gerado:", OUT)
