"""
viking_from_image.py
-----------------------------------------------------------------------------
Gera os sprites do VIKING a partir do cartão dele
(source_art/personagens/viking/viking_cartao.webp — a imagem da escolha de
personagem, com o fundo azul-escuro):

  1. recorta o viking e refaz a pixel art na GRADE original dela (cada
     "pixel" da arte tinha ~6x6,4 px na imagem): fica nítido, sem borrão;
  2. tira o fundo azul-escuro (o que encosta na borda);
  3. monta as poses (olhando para a direita; a esquerda é o espelho):
       viking              parado, com o martelo
       viking_sem_martelo  parado, sem o martelo (o punho fechado)
       viking_soco         braço esticado para a frente (soco e arremesso)
       viking_agachado / viking_sem_martelo_agachado
  4. desenha o MARTELO solto (martelo.png), que gira no ar quando ele joga;
  5. cada pose vai para um quadro 500x500 (cada "pixel" da arte = 10 px)
     com os pés na mesma linha dos outros personagens.

A caminhada e o pulo saem do tools/walk_frames.py.

    py tools/viking_from_image.py
-----------------------------------------------------------------------------
"""
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "source_art" / "personagens" / "viking" / "viking_cartao.webp"
OUT = ROOT / "assets" / "personagens" / "viking"

CROP = (1060, 70, 1330, 360)          # onde o viking está no cartão
GRID = {"step_x": 5.95, "offset_x": 2.6, "step_y": 6.4, "offset_y": 5.9}  # grade da pixel art
ART = 10                              # cada "pixel" da arte vira 10x10 no quadro
CANVAS = 500
FEET_Y = 470                          # base dos pés no quadro (igual à hitbox dos outros)

# Partes na grade da arte (x, y): martelo, punho e pernas
HAMMER_BOXES = [(30, 13, 45, 24), (31, 24, 45, 28)]  # cabeça e cabo do martelo (o que não é pele)
HANDLE = [(29, 24), (30, 24), (31, 23), (32, 23), (31, 24), (30, 25)]
FIST_BOX = (23, 24, 32, 32)           # antebraço e punho do braço do martelo
PUNCH_REACH = 3                       # o soco estica o braço este tanto
DUCK_ROWS = [30, 35, 37]              # linhas tiradas para agachar (barriga e pernas)

OUTLINE = (20, 16, 24, 255)
STEEL = {"H": (156, 178, 194, 255), "h": (112, 132, 150, 255), "L": (206, 220, 230, 255),
         "B": (120, 74, 40, 255), "b": (84, 50, 28, 255), "K": OUTLINE}
HAMMER = """
..KKKKKKKKKK..
.KLLHHHHHHhhK.
KLLHHHHHHHHhhK
KLHHHHHHHHHhhK
KHHHHHHHHHHhhK
KHHHHHHHHHhhhK
.KhhhhhhhhhhK.
..KKKKBbKKKK..
.....KBbK.....
.....KBbK.....
.....KBbK.....
.....KBbK.....
.....KBbK.....
.....KBbK.....
......KK......
"""


def native_pixels():
    """A pixel art do viking na resolução original (um valor por "pixel" da arte)."""
    image = np.asarray(Image.open(SOURCE).convert("RGB")).astype(float)
    x0, y0, x1, y1 = CROP
    crop = image[y0:y1, x0:x1]
    cols = np.arange(GRID["offset_x"] + GRID["step_x"] / 2, crop.shape[1] - 1, GRID["step_x"])
    rows = np.arange(GRID["offset_y"] + GRID["step_y"] / 2, crop.shape[0] - 1, GRID["step_y"])
    small = np.zeros((len(rows), len(cols), 4), dtype=np.uint8)
    for j, y in enumerate(rows):
        for i, x in enumerate(cols):
            yy, xx = int(round(y)), int(round(x))
            block = crop[max(0, yy - 1):yy + 2, max(0, xx - 1):xx + 2].reshape(-1, 3)
            small[j, i, :3] = np.median(block, axis=0).round()
            small[j, i, 3] = 255
    return Image.fromarray(small, "RGBA").copy()


def is_background(pixel):
    r, g, b, a = pixel
    return a == 0 or (b > r + 14 and b >= g + 10 and max(r, g, b) < 120)


def remove_background(img):
    """Apaga o azul-escuro que encosta na borda (o fundo do cartão)."""
    w, h = img.size
    px = img.load()
    queue = deque([(x, y) for x in range(w) for y in (0, h - 1)] + [(x, y) for y in range(h) for x in (0, w - 1)])
    seen = set()
    while queue:
        x, y = queue.popleft()
        if (x, y) in seen or not (0 <= x < w and 0 <= y < h) or not is_background(px[x, y]):
            continue
        seen.add((x, y))
        px[x, y] = (0, 0, 0, 0)
        queue.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])
    return img


def is_skin(pixel):
    r, g, b, a = pixel
    return a > 0 and r > 170 and 110 < g < 200 and b < 150 and r - b > 60


def without_hammer(img):
    """O viking sem o martelo: some a cabeça e o cabo; o punho fica."""
    out = img.copy()
    px = out.load()
    for x0, y0, x1, y1 in HAMMER_BOXES:
        for y in range(y0, min(y1, out.height)):
            for x in range(x0, min(x1, out.width)):
                if not is_skin(px[x, y]):
                    px[x, y] = (0, 0, 0, 0)
    for x, y in HANDLE:
        if not is_skin(px[x, y]):
            px[x, y] = (0, 0, 0, 0)
    return outline(out)


def punching(img):
    """Braço esticado: antebraço e punho vão para a frente; o vão vira braço."""
    out = img.copy()
    px, src = out.load(), img.load()
    x0, y0, x1, y1 = FIST_BOX
    arm = [[src[x, y] for x in range(x0, x1)] for y in range(y0, y1)]
    for row, y in zip(arm, range(y0, y1)):
        for i, color in enumerate(row):
            if color[3]:
                px[x0 + i + PUNCH_REACH, y] = color
        # o vão que ficou para trás é preenchido com o próprio braço (cor da primeira coluna)
        first = next((c for c in row if c[3]), None)
        if first:
            for dx in range(PUNCH_REACH):
                if px[x0 + dx, y][3] == 0:
                    px[x0 + dx, y] = first
    return outline(out)


def ducking(img):
    """Agachado: tira umas linhas da barriga e das pernas (fica mais baixo)."""
    rows = [y for y in range(img.height) if y not in DUCK_ROWS]
    out = Image.new("RGBA", img.size, (0, 0, 0, 0))
    offset = len(DUCK_ROWS)
    for new_y, y in enumerate(rows):
        out.paste(img.crop((0, y, img.width, y + 1)), (0, new_y + offset))
    return out


def outline(img):
    """Contorno escuro em volta de tudo que ficou sem borda (onde o martelo saiu)."""
    out = img.copy()
    px, src = out.load(), img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            if src[x, y][3]:
                continue
            around = [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
            if any(0 <= ax < w and 0 <= ay < h and src[ax, ay][3] and src[ax, ay][:3] != OUTLINE[:3]
                   and max(src[ax, ay][:3]) > 60 for ax, ay in around):
                px[x, y] = OUTLINE
    return out


def hammer_sprite():
    rows = [row for row in HAMMER.strip("\n").split("\n")]
    width = max(len(row) for row in rows)
    img = Image.new("RGBA", (width * ART, len(rows) * ART), (0, 0, 0, 0))
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            if ch != ".":
                img.paste(STEEL[ch], (x * ART, y * ART, (x + 1) * ART, (y + 1) * ART))
    return img


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    armed = remove_background(native_pixels())
    unarmed = without_hammer(armed)
    # o mesmo enquadramento para todas as poses (com o martelo, que é o mais largo)
    box = armed.getbbox()
    poses = {
        "viking": armed,
        "viking_sem_martelo": unarmed,
        "viking_soco": punching(unarmed),
        "viking_agachado": ducking(armed),
        "viking_sem_martelo_agachado": ducking(unarmed),
    }
    for name, small in poses.items():
        # amplia (sem borrar) com a mesma caixa do viking com martelo: as poses
        # não "pulam" ao trocar; os pés ficam na base do quadro
        art = small.crop(box)
        big = art.resize((art.width * ART, art.height * ART), Image.NEAREST)
        canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
        canvas.paste(big, ((CANVAS - big.width) // 2, FEET_Y - big.height), big)
        canvas.save(OUT / f"{name}_direita.png")
        canvas.transpose(Image.FLIP_LEFT_RIGHT).save(OUT / f"{name}_esquerda.png")
        print("gerado:", OUT / f"{name}_direita.png")
    hammer_sprite().save(OUT / "martelo.png")
    print("gerado:", OUT / "martelo.png")
