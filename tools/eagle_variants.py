"""
eagle_variants.py
-----------------------------------------------------------------------------
Gera as VARIAÇÕES da águia (fase 6) a partir do desenho da águia original
(creature_sprites.py). Cada uma tem um traço bem exagerado, para dar para
reconhecer de longe, além da cor:

  aguia_lanca_*    bico COMPRIDO como uma lança (azul-acinzentada)
  aguia_dourada_*  COROA de ouro com uma joia vermelha (dourada)
  aguia_leque_*    rabo enorme em LEQUE, tipo pavão, com pontas coloridas (vermelha)
  aguia_larga_*    asas com o DOBRO do comprimento (escura; no jogo ela é maior)
  aguia_negra_*    MOICANO de espinhos, olhos vermelhos e rabo espetado (preta)
  aguia_pena       pena afiada que a negra solta ao subir

Cada variação tem os mesmos quadros da original: voo (2), mergulho e chão (2).

    py tools/eagle_variants.py
-----------------------------------------------------------------------------
"""
from creature_sprites import EAGLE_DIVE, EAGLE_FLY, EAGLE_GROUND, OUT_DIR, parse, render

FOLDER = OUT_DIR / "inimigos" / "aguia"

# Cores de cada variação: O = corpo, C = asa clara, c = contorno/rabo, W = cabeça, Z = bico e pés
COLORS = {
    "lanca":   {"O": (96, 112, 138, 255), "C": (140, 160, 186, 255), "c": (52, 60, 78, 255), "Z": (236, 150, 40, 255)},
    "dourada": {"O": (200, 150, 40, 255), "C": (244, 204, 92, 255), "c": (122, 82, 20, 255)},
    "leque":   {"O": (156, 64, 44, 255), "C": (214, 112, 70, 255), "c": (90, 30, 24, 255)},
    "larga":   {"O": (70, 72, 84, 255), "C": (120, 122, 138, 255), "c": (36, 36, 46, 255)},
    "negra":   {"O": (40, 34, 56, 255), "C": (92, 70, 132, 255), "c": (20, 16, 30, 255),
                "W": (206, 196, 232, 255), "Z": (255, 204, 60, 255)},
}
# Cores extras que já existem na paleta: e = ouro, z = ouro escuro, E = vermelho, T = verde-água


# ---------------------------------------------------------------- grade de "pixels"
def to_grid(art):
    return [list(row) for row in parse(art)]


def to_art(grid):
    return "\n".join("".join(row) for row in grid)


def pad(grid, top=0, right=0, bottom=0, left=0):
    """Aumenta a grade (com transparente) para caber o traço novo."""
    width = len(grid[0]) + left + right
    rows = [["."] * width for _ in range(top)]
    rows += [["."] * left + row + ["."] * right for row in grid]
    rows += [["."] * width for _ in range(bottom)]
    return rows


def put(grid, x, y, color):
    if 0 <= y < len(grid) and 0 <= x < len(grid[0]):
        grid[y][x] = color


def head_top(grid):
    """Linha mais alta da cabeça e as colunas dela."""
    y = min(y for y, row in enumerate(grid) if "W" in row)
    xs = [x for x, c in enumerate(grid[y]) if c in "WK"]
    return y, min(xs), max(xs)


def body_row(grid):
    """Linha com mais corpo (O): onde o rabo começa, na ponta direita."""
    return max(range(len(grid)), key=lambda y: grid[y].count("O"))


# ---------------------------------------------------------------- traços
def spear_beak(grid, extra=7):
    """Bico comprido: a linha do bico (Z colado na cabeça) vira uma lança."""
    grid = pad(grid, left=extra)
    for row in grid:
        text = "".join(row)
        start = len(text) - len(text.lstrip("."))
        if text.lstrip(".").startswith("Z") and "W" in text[start:start + 5]:
            for x in range(start):
                row[x] = "z" if x == 0 else "Z"  # ponta mais escura
            break
    return grid


def crown(grid):
    """Coroa de ouro PONTUDA em cima da cabeça, com uma joia vermelha no meio."""
    grid = pad(grid, top=5)
    y, left, right = head_top(grid)
    middle = (left + right) // 2
    for x in range(left - 1, right + 2):
        put(grid, x, y - 1, "e")            # aro
    put(grid, middle, y - 1, "E")           # joia
    for x in (left - 1, right + 1):         # pontas dos lados
        put(grid, x, y - 2, "e")
        put(grid, x, y - 3, "z")
    for h in range(2, 5):                   # ponta do meio, bem alta
        put(grid, middle, y - h, "e")
    put(grid, middle, y - 5, "z")
    return grid


def peacock_tail(grid, length=7):
    """Rabo em leque: cinco penas compridas abrindo para trás, com ponta colorida."""
    grid = pad(grid, top=4, right=length + 1, bottom=4)
    y0 = body_row(grid)
    x0 = max(x for x, c in enumerate(grid[y0]) if c != ".")
    for slope in (-2, -1, 0, 1, 2):
        points = [(x0 + i, y0 + round(slope * i / 3)) for i in range(1, length + 1)]
        for i, (x, y) in enumerate(points):
            put(grid, x, y, "C" if i < length - 2 else ("e" if i == length - 2 else "T"))
    return grid


def long_wings(grid):
    """Asas com o dobro do comprimento: as linhas só de asa (sem corpo nem cabeça) dobram."""
    body = [y for y, row in enumerate(grid) if "O" in row]
    out = []
    for y, row in enumerate(grid):
        out.append(list(row))
        only_wing = ("C" in row or "c" in row) and not set(row) & set("OWZ")
        if only_wing and (y < body[0] or y > body[-1]):
            out.append(list(row))
    return out


def punk(grid):
    """Moicano de espinhos para trás, olhos vermelhos e o rabo espetado."""
    grid = pad(grid, top=4, right=3)
    y, left, right = head_top(grid)
    for i, x in enumerate(range(left, right + 2)):
        height = 2 + i % 2 * 2  # espinhos alternando alto/baixo
        for h in range(1, height + 1):
            put(grid, x + h // 2, y - h, "C" if h == height else "c")
    for row in grid:
        if "W" in row:
            for x, c in enumerate(row):
                if c == "K":
                    row[x] = "E"  # olho vermelho
    y0 = body_row(grid)
    x0 = max(x for x, c in enumerate(grid[y0]) if c != ".")
    for dy, length in ((-1, 2), (0, 3), (1, 2)):
        for i in range(1, length + 1):
            put(grid, x0 + i, y0 + dy * i, "c")
    return grid


# Pena afiada (a águia negra solta três ao subir)
FEATHER = """
..c..
.cCc.
.cCc.
cCCCc
cCCCc
.cCc.
.cCc.
..c..
..c..
"""


# ---------------------------------------------------------------- quadros
def frames(name, *shapes):
    """Todos os quadros de uma variação, com os traços aplicados em ordem."""
    def draw(art):
        grid = to_grid(art)
        for shape in shapes:
            grid = shape(grid)
        return render(to_art(grid), palette_overrides=COLORS[name])

    sprites = {f"aguia_{name}_{i}.png": draw(frame) for i, frame in enumerate(EAGLE_FLY)}
    sprites[f"aguia_{name}_mergulho.png"] = draw(EAGLE_DIVE)
    for i, frame in enumerate(EAGLE_GROUND):
        sprites[f"aguia_{name}_chao_{i}.png"] = draw(frame)
    return sprites


if __name__ == "__main__":
    FOLDER.mkdir(parents=True, exist_ok=True)
    sprites = {
        **frames("lanca", spear_beak),
        **frames("dourada", crown),
        **frames("leque", peacock_tail),
        **frames("larga", long_wings),
        **frames("negra", punk),
        "aguia_pena.png": render(FEATHER, palette_overrides=COLORS["negra"]),
    }
    for filename, image in sprites.items():
        image.save(FOLDER / filename)
    print("gerado:", len(sprites), "imagens em", FOLDER)
