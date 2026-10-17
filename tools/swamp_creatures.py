"""
swamp_creatures.py
-----------------------------------------------------------------------------
Gera os bichos e as coisas da fase 8 (PÂNTANO) em pixel art, no mesmo
padrão de creature_sprites.py (cada "pixel" vira um quadrado de 20x20 px):

  Sapos (a partir do sapo de sempre):
    sapo_lingua_*      marrom, com a língua rosada para fora
    sapo_venenoso_*    azul-elétrico com pintas pretas e barriga amarela
    sapo_boi_*         verde-oliva, papo enorme e verrugas (no jogo é bem maior)
  Jacarés (de lado, olhando para a esquerda):
    jacare_*           nadando (o rabo balança)
    jacare_olhos       o saltador escondido: só os olhos de fora da água
    jacare_bote        o saltador pulando de boca aberta
    jacare_tronco      o jacaré-tronco dormindo (parece um tronco com musgo)
    jacare_acordado    o jacaré-tronco acordado: olhos abertos e dentes
  libelula_*, mosquito_*, cobra_agua_*
  vitoria_regia, vitoria_regia_flor   folhas gigantes que boiam (plataformas)
  lama                                bloco de lama (trechos que deixam lento)

    py tools/swamp_creatures.py
-----------------------------------------------------------------------------
"""
from creature_sprites import FROG, OUT_DIR, render
from eagle_variants import pad, put, to_art, to_grid

FOLDER = OUT_DIR / "inimigos" / "pantano"

COLORS = {
    "1": (70, 112, 60, 255), "2": (40, 70, 38, 255), "3": (196, 184, 122, 255),   # jacaré
    "q": (198, 70, 92, 255),                                                       # rosa (língua, borda da folha)
    "V": (40, 110, 50, 255), "v": (84, 156, 72, 255),                              # folha / cobra
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

GATOR = ["""
..KK...........2.2.2.2.2..
.KeoK.KKKKKKKKK2K2K2K2K2K.
K1111K111111111111111111KK
K111111111111111111111111112K
KW1W1W1W33333333333333331KK.
.KKKKKKKKKKKKKKKKKKKKKKKK...
""", """
..KK...........2.2.2.2.2.K
.KeoK.KKKKKKKKK2K2K2K2K2K2K
K1111K1111111111111111111K.
K1111111111111111111111111K
KW1W1W1W3333333333333331K..
.KKKKKKKKKKKKKKKKKKKKKKK...
"""]

GATOR_EYES = """
.KK....KK.
KeoK..KeoK
K11K..K11K
"""

GATOR_BITE = """
K..........2.2.2.2.2...
1K...KK....K2K2K2K2K2K.
W1K.KeoKKKK11111111111KK
.W11K1111111111111111112K
...K11111111111111111111K
.W1W1W3333333333333311K..
KKKKKKKKKKKKKKKKKKKKKKK..
"""

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

LILY_PAD = """
Kq......................qK
KqKKKKKKKKKKKKKKKKKKKKKKqK
KvVvvvvVvvvvvvVvvvvvVvvvvK
.KvvvvvvvvvvvvvvvvvvvvvvK.
..KKKKKKKKKKKKKKKKKKKKKK..
"""

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
        **{f"jacare_{i}.png": draw(frame) for i, frame in enumerate(same_size(GATOR))},
        "jacare_olhos.png": draw(GATOR_EYES),
        "jacare_bote.png": draw(GATOR_BITE),
        "jacare_tronco.png": draw(LOG_ASLEEP),
        "jacare_acordado.png": draw(LOG_AWAKE),
        # asas para cima / para baixo, com o corpo na mesma linha nos dois quadros
        **{f"libelula_{i}.png": draw(frame) for i, frame in enumerate(same_size(DRAGONFLY, top=[0, 1]))},
        **{f"mosquito_{i}.png": draw(frame) for i, frame in enumerate(MOSQUITO)},
        **{f"cobra_agua_{i}.png": draw(frame) for i, frame in enumerate(WATER_SNAKE)},
    }
    for filename, image in sprites.items():
        image.save(FOLDER / filename)
    scenery = OUT_DIR / "cenario"
    draw(LILY_PAD).save(scenery / "vitoria_regia.png")
    render(MUD, palette_overrides=MUD_COLORS).save(scenery / "lama.png")
    print("gerado:", len(sprites) + 2, "imagens")
