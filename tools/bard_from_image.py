"""
bard_from_image.py
-----------------------------------------------------------------------------
Gera os sprites do BARDO a partir do print dele
(source_art/personagens/bardo/bardo_recorte.png — recorte do cartão):

  1. refaz a pixel art na grade original (cada "pixel" da arte tinha ~3,6 px
     no print: ele é mais detalhado que os outros), tira o fundo e o que
     sobrou do cartão (o nome embaixo, enfeites);
  2. ESPELHA: no cartão ele olha para a esquerda; no jogo a pose base olha
     para a direita, como os outros;
  3. monta as poses:
       bardo            parado (o alaúde nas costas e o florete pendurado)
       bardo_estocada   golpe: o florete reto para a frente (o pendurado some,
                        só fica a guarda na cintura)
       bardo_agachado
  4. cada pose vai para um quadro 500x500 (cada "pixel" da arte = 6 px),
     com o meio do corpo no meio do quadro e os pés na linha dos outros.

A caminhada e o pulo saem do tools/walk_frames.py.

    py tools/bard_from_image.py
-----------------------------------------------------------------------------
"""
from pathlib import Path

from PIL import Image

from pixel_character import (OUTLINE, is_dark_blue, keep_largest, native_pixels, outline, place,
                             remove_background, remove_rows, save_sides)

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "source_art" / "personagens" / "bardo" / "bardo_recorte.png"
OUT = ROOT / "assets" / "personagens" / "bardo"

CROP = (0, 0, 252, 282)
GRID = {"step_x": 3.58, "offset_x": 0.4, "step_y": 3.615, "offset_y": 3.3}  # grade da pixel art
ART = 6
CENTER_X = 40.5                       # meio do corpo (coluna da arte, já espelhado)
FEET_ROW = 68                         # a ponta do florete passa dos pés: corta aqui (encosta no chão)

# Na grade da arte, já espelhado (x, y)
HANGING_BLADE = (0, 55, 21)            # lâmina do florete pendurada, daqui até embaixo (a guarda fica)
THRUST = {"x0": 58, "x1": 77, "y": 43}  # golpe: lâmina reta saindo da mão da frente
DUCK_ROWS = [35, 47, 52, 58, 62]       # linhas tiradas para agachar (barriga e pernas)

STEEL_LIGHT = (226, 230, 238, 255)
STEEL = (160, 166, 178, 255)
GOLD = (214, 172, 70, 255)


def card_background(pixel):
    """Fundo do cartão: azul-escuro puxando para o roxo (um pouco mais solto que o padrão)."""
    r, g, b, a = pixel
    return a == 0 or (b >= r + 10 and b >= g + 10 and max(r, g, b) < 120)


def thrusting(img):
    """Estocada: some a lâmina pendurada e o florete sai reto da mão da frente."""
    x0, x1, y = THRUST["x0"], THRUST["x1"], THRUST["y"]
    out = Image.new("RGBA", (max(img.width, x1 + 3), img.height), (0, 0, 0, 0))  # espaço para a lâmina
    out.paste(img)
    px = out.load()
    bx0, by0, bx1 = HANGING_BLADE
    for yy in range(by0, out.height):
        for xx in range(bx0, bx1):
            px[xx, yy] = (0, 0, 0, 0)
    out = outline(out)
    px = out.load()
    for x in range(x0 + 1, x1):
        px[x, y - 1] = OUTLINE
        px[x, y] = STEEL_LIGHT
        px[x, y + 1] = STEEL
        px[x, y + 2] = OUTLINE
    px[x1, y] = STEEL_LIGHT               # ponta fininha
    px[x1, y + 1] = OUTLINE
    px[x1, y - 1] = OUTLINE
    px[x1 + 1, y] = OUTLINE
    for dy in range(-3, 5):               # guarda dourada (o "copo" do florete) na mão
        px[x0, y + dy] = GOLD if -2 <= dy <= 3 else OUTLINE
        px[x0 + 1, y + dy] = OUTLINE if dy in (-3, 4) else px[x0 + 1, y + dy]
    return out


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    bard = native_pixels(SOURCE, CROP, GRID).transpose(Image.FLIP_LEFT_RIGHT)
    bard = remove_background(bard, card_background)
    bard = keep_largest(remove_background(bard, is_dark_blue, holes=True))
    poses = {
        "bardo": bard,
        "bardo_estocada": thrusting(bard),
        "bardo_agachado": remove_rows(bard, DUCK_ROWS),
    }
    left, top, _, _ = bard.getbbox()
    box = (left, top, THRUST["x1"] + 2, FEET_ROW)
    for name, small in poses.items():
        save_sides(place(small, box, ART, CENTER_X), OUT, name)
