"""
cave_creatures.py
-----------------------------------------------------------------------------
Gera os bichos da fase 7 (CAVERNA) em pixel art, no mesmo padrão de
creature_sprites.py (cada "pixel" vira um quadrado de 20x20 px):

  Morcegos (a partir do morcego de sempre):
    morcego_vampiro_*  vermelho, olhos amarelos e PRESAS
    morcego_sonico_*   roxo de orelhas ENORMES
    morcego_gigante_*  quase preto, olhos vermelhos e chifrinhos (no jogo é bem maior)
  Rastejantes:
    centopeia_*        comprida, segmentada, cheia de pernas
    aranha_*           preta com a ampulheta vermelha e as pernas abertas
    besouro_dormindo   o besouro-pedra fingindo ser uma pedra
    besouro_*          acordado: olhos acesos e perninhas
  traca_*              traça peluda com "olhos" desenhados nas asas
  pedra_caverna        pedra pontuda que cai do teto (fica em cenario/)

    py tools/cave_creatures.py
-----------------------------------------------------------------------------
"""
from creature_sprites import BAT, OUT_DIR, render
from eagle_variants import pad, put, to_art, to_grid

FOLDER = OUT_DIR / "inimigos" / "caverna"

COLORS = {
    "1": (120, 20, 36, 255), "2": (186, 38, 54, 255),                            # vampiro
    "3": (130, 84, 200, 255), "4": (196, 168, 244, 255),                         # sônico
    "5": (52, 40, 70, 255),                                                      # gigante
    "7": (186, 100, 40, 255), "8": (112, 54, 24, 255), "9": (60, 30, 16, 255),   # centopeia (9 = pernas)
    "@": (30, 26, 38, 255), "%": (84, 60, 120, 255), "+": (210, 34, 44, 255),    # aranha
    "*": (112, 110, 118, 255), "=": (66, 64, 74, 255), "-": (162, 160, 168, 255),  # besouro-pedra
    "~": (255, 140, 40, 255),                                                    # olhos acesos
    "S": (204, 190, 152, 255), "X": (132, 110, 78, 255), "d": (64, 48, 36, 255),  # traça
    "D": (118, 110, 102, 255), "F": (78, 72, 68, 255), "I": (164, 156, 144, 255),  # pedra
}

CENTIPEDE = ["""
K.K...................
.K.K..................
..KKKK.KKKK.KKKK.KKKK.
.K7e77K8778K8778K8778K
K77777777777777777777K
.KKKKKKKKKKKKKKKKKKKK.
..9..9...9..9...9..9..
.9..9...9..9...9..9...
""", """
K.K...................
.K.K..................
..KKKK.KKKK.KKKK.KKKK.
.K7e77K8778K8778K8778K
K77777777777777777777K
.KKKKKKKKKKKKKKKKKKKK.
...9..9...9..9...9..9.
....9..9...9..9...9..9
"""]

SPIDER = ["""
.K.........K.
..K.......K..
K..K.@@@.K..K
.KK.@%%%@.KK.
...@@%+%@@...
K.K@@@+@@@K.K
.K..@@@@@..K.
...K.+.+.K...
""", """
..K.......K..
.K.........K.
..KK.@@@.KK..
K...@%%%@...K
.KK@@%+%@@KK.
...@@@+@@@...
.KK.@@@@@.KK.
K..K.+.+.K..K
"""]

BEETLE_SLEEP = """
..............
.....KKKK.....
...KK----KK...
..K-**-***-K..
.K***-****-*K.
K************K
K====*****===K
.KKKKKKKKKKKK.
"""

BEETLE = ["""
.....KKKK.....
...KK----KK...
..K-**-***-K..
.K~**-****-*K.
K~~**********K
.K==========K.
..9.9....9.9..
.9...9..9...9.
""", """
.....KKKK.....
...KK----KK...
..K-**-***-K..
.K~**-****-*K.
K~~**********K
.K==========K.
...9.9..9.9...
..9...99...9..
"""]

MOTH = ["""
..K.......K..
...K.....K...
.KKSK.K.KSKK.
KSSXSKdKSXSSK
KSdSSKSKSSdSK
.KSSXKSKXSSK.
..KKSKSKSKK..
.....KSK.....
......K......
""", """
..K.......K..
...K.....K...
......K......
.KKKSKSKSKKK.
KSXSdKSKdSXSK
KSSSSKSKSSSSK
.KSXSKSKSXSK.
..KKKKSKKKK..
......K......
"""]

ROCK = """
.KKKKKKKK.
KDDIDDDDFK
KDIDDDDFFK
.KDDDIDFK.
.KDDDDFFK.
..KDIDFK..
..KDDDFK..
...KDFK...
...KDFK...
....KK....
"""


def recolor(grid, swaps):
    return [[swaps.get(c, c) for c in row] for row in grid]


def head_top(grid):
    """Linha e colunas das orelhinhas do morcego (o 'K.K' do meio, no alto da cabeça)."""
    for y, row in enumerate(grid):
        text = "".join(row)
        middle = len(text) // 2
        if text[middle - 1:middle + 2] == "K.K":
            return y, middle - 1, middle + 1
    raise ValueError("cabeça do morcego não encontrada")


def fangs(grid):
    """Presas brancas penduradas dos dois lados da boca."""
    for y, row in enumerate(grid):
        if "1" in row:  # boca (já trocada para vermelho escuro)
            x = row.index("1")
            put(grid, x - 1, y + 1, "W")
            put(grid, x + 1, y + 1, "W")
            break
    return grid


def big_ears(grid):
    """Orelhas enormes em cima da cabeça (3 'pixels' de altura cada)."""
    grid = pad(grid, top=3)
    y, left, right = head_top(grid)
    for x, outer in ((left, left - 1), (right, right + 1)):
        put(grid, outer, y - 3, "K")
        put(grid, outer, y - 2, "4")
        put(grid, x, y - 2, "K")
        put(grid, outer, y - 1, "4")
        put(grid, x, y - 1, "4")
    return grid


def horns(grid):
    """Chifrinhos brancos em cima da cabeça."""
    grid = pad(grid, top=1)
    y, left, right = head_top(grid)
    put(grid, left, y - 1, "W")
    put(grid, right, y - 1, "W")
    return grid


def draw(art_or_grid):
    art = art_or_grid if isinstance(art_or_grid, str) else to_art(art_or_grid)
    return render(art, palette_overrides=COLORS)


def bats():
    sprites = {}
    for i, frame in enumerate(BAT):
        base = to_grid(frame)
        sprites[f"morcego_vampiro_{i}.png"] = draw(fangs(recolor(base, {"P": "2", "p": "1", "r": "e"})))
        sprites[f"morcego_sonico_{i}.png"] = draw(big_ears(recolor(base, {"P": "3", "p": "3", "r": "W"})))
        sprites[f"morcego_gigante_{i}.png"] = draw(horns(recolor(base, {"P": "5", "p": "5", "r": "E"})))
    return sprites


if __name__ == "__main__":
    FOLDER.mkdir(parents=True, exist_ok=True)
    sprites = {
        **bats(),
        **{f"centopeia_{i}.png": draw(frame) for i, frame in enumerate(CENTIPEDE)},
        **{f"aranha_{i}.png": draw(frame) for i, frame in enumerate(SPIDER)},
        "besouro_dormindo.png": draw(BEETLE_SLEEP),
        **{f"besouro_{i}.png": draw(frame) for i, frame in enumerate(BEETLE)},
        **{f"traca_{i}.png": draw(frame) for i, frame in enumerate(MOTH)},
    }
    for filename, image in sprites.items():
        image.save(FOLDER / filename)
    draw(ROCK).save(OUT_DIR / "cenario" / "pedra_caverna.png")
    print("gerado:", len(sprites) + 1, "imagens")
