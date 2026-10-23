"""
soldier_from_image.py
-----------------------------------------------------------------------------
Gera os sprites do OPERADOR DE DRONES a partir do cartão dele
(source_art/personagens/soldado/operador_cartao.png — print pequeno, fundo
azul-arroxeado com drones desenhados ao longe):

  1. recorta o soldado (sem o texto do cartão e sem o morteiro do lado);
  2. apaga o fundo que encosta na borda (azul-arroxeado escuro) e fica só
     com a maior mancha (some o que sobrou dos drones do fundo);
  3. espelha: no cartão o drone está na mão do lado esquerdo da imagem; no
     jogo, olhando para a DIREITA, ele fica na frente;
  4. monta as poses (a esquerda é o espelho):
       soldado           parado, segurando o drone
       soldado_lanca     acabou de lançar: a mão vazia (o drone saiu voando)
       soldado_agachado
     e o DRONE sozinho (drone.png) com a granada deitada embaixo, para o projétil;
  5. cada pose vai para um quadro 500x500 (cada pixel do print = 4 px), com
     o meio do corpo no meio do quadro e os pés na linha dos outros.

A caminhada e o pulo saem do tools/walk_frames.py.

    py tools/soldier_from_image.py
-----------------------------------------------------------------------------
"""
from pathlib import Path

from PIL import Image

from pixel_character import keep_largest, place, remove_background, remove_rows, save_sides

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "source_art" / "personagens" / "soldado" / "operador_cartao.png"
OUT = ROOT / "assets" / "personagens" / "soldado"

CROP = (0, 8, 124, 132)       # o soldado com o drone (sem o texto e sem o morteiro)
ART = 4                       # cada pixel do print vira 4x4 no quadro de 500
# No recorte JÁ ESPELHADO (drone à direita):
DRONE_BOX = (74, 40, 106, 100)  # o drone na mão (com a granada pendurada)
HAND_X = 74                   # da mão para a direita é o drone
MORTAR = (0, 88, 12, 124)     # o morteiro encostado na outra mão (sai)
DUCK_ROWS = list(range(92, 102))  # linhas tiradas para agachar (coxas)


def is_card_background(pixel):
    """Fundo do cartão: azul-arroxeado escuro (o uniforme é oliva, com mais verde que azul)."""
    r, g, b, a = pixel
    return a == 0 or (b >= r + 8 and b >= g + 5 and max(r, g, b) < 112)


def soldier():
    card = Image.open(SOURCE).convert("RGBA").crop(CROP)
    clean = remove_background(card, is_card_background).transpose(Image.FLIP_LEFT_RIGHT)
    px = clean.load()
    x0, y0, x1, y1 = MORTAR
    for y in range(y0, y1):
        for x in range(x0, x1):
            px[x, y] = (0, 0, 0, 0)
    return keep_largest(clean)


def without_drone(img):
    """Lançou: tudo que estava além da mão (o drone e a granada) some."""
    out = img.copy()
    px = out.load()
    x0, y0, x1, y1 = DRONE_BOX
    for y in range(y0, min(y1, out.height)):
        for x in range(max(x0, HAND_X), min(x1, out.width)):
            px[x, y] = (0, 0, 0, 0)
    return keep_largest(out)


DRONE_ROWS = 13               # no recorte do drone: linhas 0..12 são o drone (hélices e corpo)
BOMB_ROWS = (28, 52)          # a granada pendurada (no meio sobra um pedaço da mão, que sai)
BOMB_SCALE = 0.7


def drone_only(img):
    """
    O projétil: o drone com a granada DEITADA logo embaixo dele (no cartão ela
    fica pendurada longe, por uma alça segurada pela mão).
    """
    x0, y0, x1, y1 = DRONE_BOX
    part = img.crop((max(x0, HAND_X), y0, x1, y1))
    drone = part.crop((0, 0, part.width, DRONE_ROWS))
    bomb = part.crop((0, BOMB_ROWS[0], part.width, BOMB_ROWS[1]))
    bomb = bomb.crop(bomb.getbbox()).rotate(-90, expand=True)          # deitada, ponta para a frente
    bomb = bomb.resize((max(1, round(bomb.width * BOMB_SCALE)), max(1, round(bomb.height * BOMB_SCALE))), Image.NEAREST)
    drone = drone.crop(drone.getbbox())
    out = Image.new("RGBA", (max(drone.width, bomb.width), drone.height + bomb.height - 1), (0, 0, 0, 0))
    out.paste(drone, ((out.width - drone.width) // 2, 0), drone)
    out.paste(bomb, ((out.width - bomb.width) // 2, drone.height - 1), bomb)  # encostada no drone
    return out


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    body = soldier()
    poses = {
        "soldado": body,
        "soldado_lanca": without_drone(body),
        "soldado_agachado": remove_rows(body, DUCK_ROWS),
    }
    box = body.getbbox()
    center_x = (box[0] + HAND_X) / 2      # meio do corpo (sem o drone)
    for name, small in poses.items():
        save_sides(place(small, box, ART, center_x), OUT, name)
    drone = drone_only(body)
    drone.resize((drone.width * ART, drone.height * ART), Image.NEAREST).save(OUT / "drone.png")
    print("gerado:", OUT / "drone.png", drone.size)
