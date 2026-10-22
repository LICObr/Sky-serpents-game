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
from pathlib import Path

from PIL import Image

from pixel_character import OUTLINE, native_pixels, outline, place, remove_background, remove_rows, save_sides

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "source_art" / "personagens" / "viking" / "viking_cartao.webp"
OUT = ROOT / "assets" / "personagens" / "viking"

CROP = (1060, 70, 1330, 360)          # onde o viking está no cartão
GRID = {"step_x": 5.95, "offset_x": 2.6, "step_y": 6.4, "offset_y": 5.9}  # grade da pixel art
ART = 10                              # cada "pixel" da arte vira 10x10 no quadro

# Partes na grade da arte (x, y): martelo, punho e pernas
HAMMER_BOXES = [(30, 13, 45, 24), (31, 24, 45, 28)]  # cabeça e cabo do martelo (o que não é pele)
HANDLE = [(29, 24), (30, 24), (31, 23), (32, 23), (31, 24), (30, 25)]
FIST_BOX = (23, 24, 32, 32)           # antebraço e punho do braço do martelo
PUNCH_REACH = 3                       # o soco estica o braço este tanto
DUCK_ROWS = [30, 35, 37]              # linhas tiradas para agachar (barriga e pernas)

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
    armed = remove_background(native_pixels(SOURCE, CROP, GRID))
    unarmed = without_hammer(armed)
    # o mesmo enquadramento para todas as poses (com o martelo, que é o mais largo)
    box = armed.getbbox()
    poses = {
        "viking": armed,
        "viking_sem_martelo": unarmed,
        "viking_soco": punching(unarmed),
        "viking_agachado": remove_rows(armed, DUCK_ROWS),
        "viking_sem_martelo_agachado": remove_rows(unarmed, DUCK_ROWS),
    }
    for name, small in poses.items():
        # todas as poses com a caixa do viking com martelo: não "pulam" ao trocar
        save_sides(place(small, box, ART), OUT, name)
    hammer_sprite().save(OUT / "martelo.png")
    print("gerado:", OUT / "martelo.png")
