"""
meadow_trees.py
-----------------------------------------------------------------------------
Árvores quebráveis do CAMPO (tutorial): as mesmas da neve (arvore_0/1), mas
com a neve dos galhos trocada por folhas verde-claras.
  arvore_campo_0.png   inteira
  arvore_campo_1.png   rachada

    py tools/meadow_trees.py
-----------------------------------------------------------------------------
"""
from pathlib import Path
from PIL import Image

FOLDER = Path(__file__).resolve().parent.parent / "assets" / "cenario"
SNOW = (236, 242, 255)
LEAVES = (104, 194, 84)    # verde-claro, como a grama do campo


if __name__ == "__main__":
    for i in range(2):
        image = Image.open(FOLDER / f"arvore_{i}.png").convert("RGBA")
        px = image.load()
        for y in range(image.height):
            for x in range(image.width):
                r, g, b, a = px[x, y]
                if a and (r, g, b) == SNOW:
                    px[x, y] = (*LEAVES, a)
        image.save(FOLDER / f"arvore_campo_{i}.png")
        print("gerado:", FOLDER / f"arvore_campo_{i}.png")
