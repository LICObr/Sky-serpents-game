"""
swamp_creatures.py
-----------------------------------------------------------------------------
Gera os bichos e as coisas da fase 8 (PÂNTANO) em pixel art, no mesmo
padrão de creature_sprites.py (cada "pixel" vira um quadrado de 20x20 px):

  Sapos (a partir do sapo de sempre):
    sapo_lingua_*      marrom, com a língua rosada para fora
    sapo_venenoso_*    azul-elétrico com pintas pretas e barriga amarela
    sapo_boi_*         verde-oliva, papo enorme e verrugas (no jogo é bem maior)
  Jacarés (de lado, olhando para a esquerda) — compridos e mal-encarados:
    jacare_*           nadando (o rabo balança)
    jacare_olhos       o saltador escondido: só a cabeça de fora da água
    jacare_bote        de boca escancarada (bote e salto)
    jacare_tronco      o jacaré-tronco dormindo (parece um tronco com musgo)
    jacare_acordado    o jacaré-tronco acordado: olhos abertos e dentes
  libelula_*, mosquito_*, cobra_agua_*
  tartaruga_*, tartaruga_casco   tartaruga e ela escondida no casco
  piranha_*, poraque_*           peixe dentuço e o peixe-elétrico
  garca_*                        garça pescadora (parada numa perna só)
  sanguessuga_*                  sanguessuga
  vitoria_regia, vitoria_regia_flor   folhas gigantes que boiam (plataformas)
  lama                                bloco de lama (trechos que deixam lento)

    py tools/swamp_creatures.py
-----------------------------------------------------------------------------
"""
import math

from creature_sprites import FROG, OUT_DIR, render
from eagle_variants import pad, put, to_art, to_grid

FOLDER = OUT_DIR / "inimigos" / "pantano"

COLORS = {
    "1": (70, 112, 60, 255), "2": (40, 70, 38, 255), "3": (196, 184, 122, 255),   # jacaré
    "q": (198, 70, 92, 255),                                                       # rosa (língua, borda da folha)
    "V": (40, 110, 50, 255), "v": (84, 156, 72, 255),                              # folha / cobra
    "h": (58, 54, 40, 255), "z": (232, 160, 40, 255),                              # peixe-elétrico / sanguessuga
    "Z": (246, 206, 52, 255), "u": (44, 36, 30, 255),                              # bico e pernas da garça
}
# Cores de cada sapo (R = corpo, j = brilho, y = barriga, r = escuro, m = boca)
FROGS = {
    "lingua":   {"R": (150, 118, 62, 255), "j": (196, 164, 98, 255), "y": (232, 212, 152, 255),
                 "r": (104, 78, 40, 255), "m": (96, 32, 52, 255)},
    "venenoso": {"R": (40, 128, 232, 255), "j": (146, 202, 255, 255), "y": (250, 220, 44, 255),
                 "r": (22, 70, 150, 255)},
    "boi":      {"R": (92, 128, 52, 255), "j": (132, 168, 82, 255), "y": (246, 196, 106, 255),
                 "r": (62, 90, 32, 255)},
}

LOG_ASLEEP = """
...KKKKKKKKKKKKKKKKKKKKK..
.KKhhHvvHHHhHHHHvHHHHhHHK.
KUhHHHHHhHHHHHHhHHHHHHHHUK
KUUhHHHHHHHHhHHHHHHHhHHUUK
KhUHHHvHHHHHHHHHvvHHHHHUhK
.KKKKKKKKKKKKKKKKKKKKKKKK.
"""

LOG_AWAKE = """
...KKKKKKKKKKKKKKKKKKKKK..
.KKeEHvvHHHhHHHHvHHHHhHHK.
WKhHHHHHhHHHHHHhHHHHHHHHUK
.WKHHHHHHHHHhHHHHHHHhHHUUK
WKUHHHvHHHHHHHHHvvHHHHHUhK
.KKKKKKKKKKKKKKKKKKKKKKKK.
"""

DRAGONFLY = ["""
....xx..xx......
...xxx.xxx......
.KK.Kx.Kx.......
KEEKTTTTTTTTTTTK
KEEKtTtTtTtTtTK.
.KK.............
""", """
................
.KK.............
KEEKTTTTTTTTTTTK
KEEKtTtTtTtTtTK.
.KK.Kx.Kx.......
...xxx.xxx......
....xx..xx......
"""]

MOSQUITO = ["""
...x.x...
..xxKxx..
KKKKoKK..
...K.K.K.
..K..K..K
""", """
.........
..xxKxx..
KKKKoKK..
..xK.Kx..
..K..K..K
"""]

WATER_SNAKE = ["""
.KK.......KKK.....
KeoK....KKVVVKK...
KVVVKK.KVVKKVVVKK.
.KKVVVKVVK..KKVVVK
...KKVVVK.....KKK.
.....KKK..........
""", """
.KK...............
KeoKK......KKK....
KVVVVKK..KKVVVKK..
.KKKVVVKKVVK.KKVVK
....KKVVVVK...KVK.
......KKKK.....K..
"""]

# Vitória-régia de lado: folha redonda (vista um pouco de cima) com a borda
# avermelhada levantada; a de flor tem uma flor branca e rosa no meio
LILY_PAD = """
..........................
..........................
..........................
...KKKKKKKKKKKKKKKKKKKK...
.KKvvVvvvvvvVvvvvvvVvvvvK.
KqqqqqqqqqqqqqqqqqqqqqqqqK
.KKKKKKKKKKKKKKKKKKKKKKKK.
"""

LILY_FLOWER = """
...........WqW............
.........qWWZWWq..........
..........qWWWq...........
...KKKKKKKKKKKKKKKKKKKK...
.KKvvVvvvvvvVvvvvvvVvvvvK.
KqqqqqqqqqqqqqqqqqqqqqqqqK
.KKKKKKKKKKKKKKKKKKKKKKKK.
"""

# Tartaruga (olhando para a esquerda): casco marrom, cabeça de bico curvo
TURTLE = ["""
..........KKKKKKKK......
........KKCOCCOOCOKK....
.......KOOcOOOOcOOOOK...
......KOOcOOOOOOcOOOOK..
..KKK.KOcOOOOOOOOcOOOOK.
.K1KeKKKKKKKKKKKKKKKKKKK
K111KK1111111111111111K.
KK1111K1K1111111111K1K..
.KKKKKK1K.........K1K...
......KKK.........KKK...
""", """
..........KKKKKKKK......
........KKCOCCOOCOKK....
.......KOOcOOOOcOOOOK...
......KOOcOOOOOOcOOOOK..
..KKK.KOcOOOOOOOOcOOOOK.
.K1KeKKKKKKKKKKKKKKKKKKK
K111KK1111111111111111K.
KK1111111K1K111K1K11KK..
.KKKKK...K1K...K1K......
.........KKK...KKK......
"""]

TURTLE_SHELL = """
........................
........................
..........KKKKKKKK......
........KKCOCCOOCOKK....
.......KOOcOOOOcOOOOK...
......KOOcOOOOOOcOOOOK..
......KOcOOOOOOOOcOOOOK.
......KKKKKKKKKKKKKKKKKK
.......KyyyyyyyyyyyyyyK.
........KKKKKKKKKKKKKK..
"""

# Piranha (olhando para a esquerda): prateada, barriga vermelha, dentuça e brava
PIRANHA = ["""
........KKK.........
......KKoooK....KK..
....KKwwwwwwKK.KoK..
...KwwKKwwwwwwKKooK.
..KwwKeEKwwwwwwwwoK.
.KwwwwwwwwwwwwwwwK..
KWKWwwwQQQQQQQwwwKoK
KQWQWQQQQQQQQQQwKKoK
.KKKKKKKKKKKKKKKK.KK
""", """
........KKK.........
......KKoooK........
....KKwwwwwwKK......
...KwwKKwwwwwwKK.KK.
..KwwKeEKwwwwwwwKooK
.KwwwwwwwwwwwwwwwKoK
KWKWwwwQQQQQQQwwwKoK
KQWQWQQQQQQQQQQwKK.K
.KKKKKKKKKKKKKKKK...
"""]

# Garça (olhando para a esquerda): branca, bico amarelo, penacho preto, numa perna só
HERON = ["""
............KKK.......
...........KWWWK......
.......ZZZZKWKeWKKKK..
...........KWWWWK.....
............KWWK......
............KWK.......
...........KWK........
...........KWK........
............KWK.......
............KWWKKKK...
...........KWWWWWwwKK.
...........KWWWWWwwwwK
............KWWWWwwwK.
.............KKWWwKK..
...............KuK....
...............KuK....
...............KuK....
...............KuK....
..............KuuuK...
.............KKKKKKK..
""", """
......................
............KKK.......
...........KWWWK......
.......ZZZZKWKeWKKKK..
...........KWWWWK.....
............KWWK......
............KWK.......
............KWK.......
............KWWKKKK...
...........KWWWWWwwKK.
...........KWWWWWwwwwK
............KWWWWwwwK.
.............KKWWwKK..
...............KuK....
...............KuK....
...............KuK....
...............KuK....
..............KuuuK...
.............KKKKKKK..
"""]

# Sanguessuga: esticada e encolhida (boca vermelha na frente)
LEECH = ["""
............
.KKKKKKKKK..
KQhhzhhzhhK.
KQQhhhhhhhhK
.KKKKKKKKKK.
""", """
....KKKKK...
..KKhhzhhK..
.KQhhhhhhhK.
KQQhhzhhhhhK
.KKKKKKKKKK.
"""]

MUD = """
bBbBBbBB
BbbBBUbB
BBhBbBBB
bBUBBbBh
"""
MUD_COLORS = {"B": (62, 50, 40, 255), "b": (46, 36, 30, 255), "h": (32, 24, 20, 255), "U": (128, 122, 104, 255)}  # lama molhada (U = brilho)


def recolor(art, colors):
    return render(art, palette_overrides={**COLORS, **colors})


def frog_tongue(grid):
    """Língua rosada pendurada do meio da boca."""
    mouth_row = next(y for y, row in enumerate(grid) if "m" in row)
    middle = len(grid[0]) // 2
    for dy in (1, 2):
        put(grid, middle, mouth_row + dy, "q")
        put(grid, middle - 1, mouth_row + dy, "q")
    put(grid, middle, mouth_row + 3, "q")
    return grid


def frog_spots(grid):
    """Pintas pretas no corpo (sapo venenoso)."""
    for y, row in enumerate(grid):
        for x, c in enumerate(row):
            if c == "R" and (x * 3 + y * 5) % 7 == 0:
                row[x] = "K"
    return grid


def frog_throat(grid):
    """Papo enorme (sapo-boi): a barriga vira um balão amarelo, com verrugas no corpo."""
    for y, row in enumerate(grid):
        for x, c in enumerate(row):
            if c == "R" and (x + y * 2) % 5 == 0:
                row[x] = "r"  # verrugas
    belly = [y for y, row in enumerate(grid) if "y" in row]
    if belly:
        for x, c in enumerate(grid[belly[0] - 1]):
            if c == "m":
                grid[belly[0] - 1][x] = "y"  # o papo sobe por cima da linha da boca
    return grid


def frog(name, shape):
    return {f"sapo_{name}_{i}.png": recolor(to_art(shape(to_grid(frame))), FROGS[name]) for i, frame in enumerate(FROG)}


def draw(art):
    return render(art, palette_overrides=COLORS)


def outline(grid):
    """Pixel do bicho encostado no vazio (ou na borda) vira contorno preto."""
    height, width = len(grid), len(grid[0])
    edge = []
    for y in range(height):
        for x in range(width):
            if grid[y][x] == ".":
                continue
            around = [(x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)]
            if any(not (0 <= ax < width and 0 <= ay < height) or grid[ay][ax] == "." for ax, ay in around):
                edge.append((x, y))
    for x, y in edge:
        grid[y][x] = "K"
    return grid


GATOR_WIDTH, GATOR_HEIGHT = 48, 11


def gator_shape(x, frame):
    """Topo e base do jacaré em cada coluna: focinho comprido, cabeça, corpo e rabo afinando."""
    if x <= 14:
        return (2 if x in (1, 2) else 3), 7          # focinho (com a narina)
    if x <= 20:
        return (1 if 16 <= x <= 19 else 2), 8        # cabeça (calombo do olho)
    if x <= 36:
        return 1, 8                                  # corpo
    t = (x - 36) / (GATOR_WIDTH - 1 - 36)            # rabo
    top, bottom = round(1 + 4 * t), round(8 - 3 * t)
    if frame == 1 and x >= 42:
        top, bottom = top - 1, bottom - 1            # rabo balançando
    return top, bottom


def gator_grid(frame=0, open_mouth=False):
    """Jacaré comprido e mal-encarado: olho amarelo e vermelho debaixo de uma
    sobrancelha caída, sorriso de dentes até debaixo do olho, escamas nas costas."""
    grid = [["."] * GATOR_WIDTH for _ in range(GATOR_HEIGHT)]
    shapes = [gator_shape(x, frame) for x in range(GATOR_WIDTH)]
    for x, (top, bottom) in enumerate(shapes):
        if open_mouth and x <= 14:
            jaw_top = 3 - round((14 - x) * 3 / 14)    # mandíbula de cima levantada
            for y in range(jaw_top, jaw_top + 3):
                grid[y][x] = "1"
            for y in range(jaw_top + 3, 5):
                grid[y][x] = "E"                      # boca vermelha
            for y in range(5, 8):
                grid[y][x] = "1"
            continue
        for y in range(top, bottom + 1):
            grid[y][x] = "1"
    outline(grid)
    for x in range(13, 37):
        grid[shapes[x][1] - 1][x] = "3"               # barriga
    for x in range(21, 45):
        top = shapes[x][0]
        if grid[top + 1][x] == "1":
            grid[top + 1][x] = "2"                    # costas escuras
    for x in range(22, 45, 3):
        top = shapes[x][0]
        grid[top - 1][x] = "K"                        # escamas pontudas
        grid[top][x] = "2"
    if open_mouth:
        for x in range(1, 15):
            jaw_top = 3 - round((14 - x) * 3 / 14)
            if x % 2 == 0:
                grid[jaw_top + 2][x] = "W"            # dentes de cima
            else:
                grid[5][x] = "W"                      # dentes de baixo
    else:
        for x in range(1, 19):
            grid[5][x] = "W" if (x % 2 == 0 and x <= 14) else "K"   # sorriso cheio de dentes
        grid[4][6] = "W"
        grid[6][11] = "W"
    # olho mau: sobrancelha pesada caindo para o focinho, pupila na frente
    grid[2][17] = grid[2][18] = grid[2][19] = "K"
    grid[3][16] = "K"
    grid[3][17] = "K"
    grid[3][18] = "e"
    grid[3][19] = "E"
    grid[3][2] = "K"                                  # narina
    for leg in ((22, 33) if frame == 0 else (24, 31)):
        grid[9][leg], grid[9][leg + 1], grid[9][leg + 2] = "K", "1", "K"
        grid[10][leg], grid[10][leg + 1], grid[10][leg + 2] = "K", "K", "K"
    return grid


def gator_eyes():
    """Só o alto da cabeça (narina e olho mau) para fora d'água."""
    head = [row[:22] for row in gator_grid()[:5]]
    for x in range(22):
        if head[4][x] != ".":
            head[4][x] = "K"                          # linha d'água
    return head


def eel_grid(phase):
    """Peixe-elétrico comprido ondulando: marrom-escuro com a barriga laranja."""
    width, height = 34, 8
    grid = [["."] * width for _ in range(height)]
    centers = []
    for x in range(width):
        wave = 0 if x <= 5 else math.sin(x * 0.42 + phase) * 1.3
        center = 3.5 + wave
        half = 1.9 if x < 27 else max(0.4, 1.9 - (x - 26) * 0.25)
        centers.append(center)
        for y in range(height):
            if abs(y + 0.5 - center) <= half:
                grid[y][x] = "h"
    outline(grid)
    for x in range(width):
        column = [y for y in range(height) if grid[y][x] == "h"]
        if column:
            grid[column[-1]][x] = "z"                 # barriga laranja
    grid[2][2] = "e"                                  # olhinho
    grid[2][3] = "K"
    return grid


def same_size(frames, top=None):
    """Completa os quadros com transparente (à direita e embaixo) até todos terem o mesmo tamanho.
    top: linhas vazias extras em cima de cada quadro (para alinhar o corpo)."""
    grids = [pad(to_grid(frame), top=(top[i] if top else 0)) for i, frame in enumerate(frames)]
    width = max(len(g[0]) for g in grids)
    height = max(len(g) for g in grids)
    return [to_art(pad(g, right=width - len(g[0]), bottom=height - len(g))) for g in grids]


if __name__ == "__main__":
    FOLDER.mkdir(parents=True, exist_ok=True)
    sprites = {
        **frog("lingua", frog_tongue),
        **frog("venenoso", frog_spots),
        **frog("boi", frog_throat),
        **{f"jacare_{i}.png": draw(to_art(gator_grid(i))) for i in range(2)},
        "jacare_olhos.png": draw(to_art(gator_eyes())),
        "jacare_bote.png": draw(to_art(gator_grid(0, open_mouth=True))),
        "jacare_tronco.png": draw(LOG_ASLEEP),
        "jacare_acordado.png": draw(LOG_AWAKE),
        # asas para cima / para baixo, com o corpo na mesma linha nos dois quadros
        **{f"libelula_{i}.png": draw(frame) for i, frame in enumerate(same_size(DRAGONFLY, top=[0, 1]))},
        **{f"mosquito_{i}.png": draw(frame) for i, frame in enumerate(MOSQUITO)},
        **{f"cobra_agua_{i}.png": draw(frame) for i, frame in enumerate(WATER_SNAKE)},
        **{f"tartaruga_{i}.png": draw(frame) for i, frame in enumerate(TURTLE)},
        "tartaruga_casco.png": draw(TURTLE_SHELL),
        **{f"piranha_{i}.png": draw(frame) for i, frame in enumerate(PIRANHA)},
        **{f"poraque_{i}.png": draw(to_art(eel_grid(phase))) for i, phase in enumerate((0, math.pi))},
        **{f"garca_{i}.png": draw(frame) for i, frame in enumerate(same_size(HERON))},
        **{f"sanguessuga_{i}.png": draw(frame) for i, frame in enumerate(LEECH)},
    }
    for filename, image in sprites.items():
        image.save(FOLDER / filename)
    scenery = OUT_DIR / "cenario"
    draw(LILY_PAD).save(scenery / "vitoria_regia.png")
    draw(LILY_FLOWER).save(scenery / "vitoria_regia_flor.png")
    render(MUD, palette_overrides=MUD_COLORS).save(scenery / "lama.png")
    print("gerado:", len(sprites) + 3, "imagens")
