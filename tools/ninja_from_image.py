"""
ninja_from_image.py
-----------------------------------------------------------------------------
Gera os sprites do NINJA a partir do print dele
(source_art/personagens/ninja/ninja.png — recorte do cartão, fundo azul-escuro):

  1. refaz a pixel art na grade original (cada "pixel" da arte tinha
     ~7,4 px no print) e tira o fundo;
  2. monta as poses (olhando para a direita; a esquerda é o espelho):
       ninja           parado, com a katana na diagonal
       ninja_corte     golpe: a katana esticada para a frente
       ninja_agachado
  3. cada pose vai para um quadro 500x500 (cada "pixel" da arte = 10 px),
     com o meio do CORPO no meio do quadro (a bainha nas costas não conta)
     e os pés na mesma linha dos outros personagens.

A caminhada e o pulo saem do tools/walk_frames.py.

    py tools/ninja_from_image.py
-----------------------------------------------------------------------------
"""
from collections import Counter
from pathlib import Path

from PIL import Image

from pixel_character import OUTLINE, keep_largest, native_pixels, place, remove_background, remove_rows, save_sides

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "source_art" / "personagens" / "ninja" / "ninja.png"
OUT = ROOT / "assets" / "personagens" / "ninja"

CROP = (0, 0, 320, 372)
GRID = {"step_x": 7.435, "offset_x": 2.4, "step_y": 7.465, "offset_y": 6.0}  # grade da pixel art
ART = 10
CENTER_X = 24.5                       # meio do corpo (coluna da arte) = meio do quadro (a ponta do golpe cabe)

# Na grade da arte (x, y)
BLADE = ((33, 17), (14, 30))          # a katana na diagonal: da ponta até o cabo
BLADE_WIDTH = 1.6                     # distância da linha que ainda é lâmina
HAND_X = 34                           # daqui para a direita é a mão da frente (fica)
SLASH = {"x0": 37, "x1": 47, "y": 26} # golpe: lâmina reta saindo da mão da frente
DUCK_ROWS = [33, 37, 41]              # linhas tiradas para agachar (barriga e pernas)

STEEL_LIGHT = (222, 228, 236, 255)
STEEL = (158, 166, 178, 255)
GUARD = (120, 96, 40, 255)


def brightness(pixel):
    return max(pixel[:3])


def is_skin(pixel):
    r, g, b, a = pixel
    return a > 0 and r > 150 and g > 100 and b < 150 and r - b > 40


def distance_to_blade(x, y):
    (x0, y0), (x1, y1) = BLADE
    dx, dy = x1 - x0, y1 - y0
    t = max(0.0, min(1.0, ((x - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy)))
    return ((x - x0 - t * dx) ** 2 + (y - y0 - t * dy) ** 2) ** 0.5


def without_katana(img):
    """Tira a lâmina da diagonal: cada pixel dela vira a roupa em volta (a cor mais comum ao lado)."""
    out = img.copy()
    px = out.load()
    w, h = img.size
    blade = {(x, y) for y in range(h) for x in range(min(w, HAND_X))
             if px[x, y][3] and brightness(px[x, y]) > 60 and not is_skin(px[x, y])
             and distance_to_blade(x, y) <= BLADE_WIDTH}
    for x, y in sorted(blade, key=lambda p: distance_to_blade(*p), reverse=True):  # de fora para dentro
        around = [px[nx, ny] for nx in range(x - 1, x + 2) for ny in range(y - 1, y + 2)
                  if (nx, ny) != (x, y) and 0 <= nx < w and 0 <= ny < h and (nx, ny) not in blade and px[nx, ny][3]]
        if around:
            px[x, y] = Counter(around).most_common(1)[0][0]
        blade.discard((x, y))
    return out


def slashing(img):
    """Golpe: a lâmina sai reta da mão da frente (contorno, fio claro, sombra e a guarda)."""
    x0, x1, y = SLASH["x0"], SLASH["x1"], SLASH["y"]
    out = Image.new("RGBA", (max(img.width, x1 + 2), img.height), (0, 0, 0, 0))  # espaço para a lâmina
    out.paste(without_katana(img))
    px = out.load()
    for x in range(x0, x1):
        px[x, y - 1] = OUTLINE
        px[x, y] = STEEL_LIGHT
        px[x, y + 1] = STEEL
        px[x, y + 2] = OUTLINE
    px[x1, y] = STEEL_LIGHT               # ponta
    px[x1, y + 1] = OUTLINE
    px[x1, y - 1] = OUTLINE
    px[x1 + 1, y] = OUTLINE
    for dy in range(-2, 4):               # guarda (tsuba) colada na mão
        px[x0, y + dy] = GUARD if -1 <= dy <= 2 else OUTLINE
    return out


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    ninja = keep_largest(remove_background(native_pixels(SOURCE, CROP, GRID), holes=True))
    poses = {
        "ninja": ninja,
        "ninja_corte": slashing(ninja),
        "ninja_agachado": remove_rows(ninja, DUCK_ROWS),
    }
    left, top, _, bottom = ninja.getbbox()
    box = (left, top, SLASH["x1"] + 2, bottom)  # cabe a lâmina do golpe
    for name, small in poses.items():
        save_sides(place(small, box, ART, CENTER_X), OUT, name)
