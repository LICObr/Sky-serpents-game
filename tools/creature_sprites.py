"""
creature_sprites.py
-----------------------------------------------------------------------------
Gera em assets/ os sprites pixel-art dos inimigos, do chefão Serpente e do
bloco de chão das fases. Mesmo padrão do herói: cada "pixel" de arte vira
um quadrado de 20x20 px (no jogo os sprites são reduzidos com setScale).

    py tools/creature_sprites.py
-----------------------------------------------------------------------------
"""
import colorsys
from pathlib import Path
from PIL import Image

CELL = 20
OUT_DIR = Path(__file__).resolve().parent.parent / "assets"

PALETTE = {
    ".": (0, 0, 0, 0),
    "K": (34, 22, 30, 255),     # contorno
    # Slime
    "G": (98, 200, 92, 255), "g": (52, 138, 62, 255), "j": (190, 250, 170, 255),
    "m": (30, 70, 36, 255),
    # Morcego
    "P": (124, 72, 168, 255), "p": (82, 44, 120, 255), "r": (255, 84, 84, 255),
    # Fantasma
    "W": (236, 242, 255, 255), "w": (176, 196, 232, 255), "o": (40, 40, 80, 255),
    # Serpente
    "T": (64, 176, 196, 255), "t": (32, 112, 146, 255), "l": (206, 242, 240, 255),
    "Y": (236, 226, 186, 255), "e": (255, 214, 64, 255), "E": (200, 40, 40, 255),
    "f": (150, 230, 255, 255),
    # Sapo
    "R": (126, 200, 60, 255), "r": (74, 140, 40, 255), "y": (236, 222, 120, 255),
    # Planta cuspidora
    "Q": (214, 58, 72, 255), "q": (150, 30, 46, 255), "v": (70, 160, 70, 255), "V": (40, 110, 50, 255),
    # Vespa
    "Z": (252, 206, 40, 255), "z": (200, 150, 20, 255), "x": (210, 230, 255, 255),
    # Ouriço
    "H": (126, 84, 52, 255), "h": (84, 54, 32, 255), "U": (236, 200, 160, 255), "u": (40, 26, 20, 255),
    # Águia
    "O": (128, 84, 46, 255), "C": (168, 116, 66, 255), "c": (78, 48, 26, 255),
    # Chão
    "A": (92, 186, 72, 255), "a": (60, 140, 52, 255), "B": (142, 96, 58, 255),
    "b": (112, 72, 42, 255), "s": (168, 160, 150, 255),
}

SLIME = ["""
..............
.....KKKK.....
...KKGGGGKK...
..KGGjjGGGGK..
.KGGjGGGGGGGK.
.KGGGKGGGKGGK.
KGGGGKGGGKGGGK
KGGGGGGGGGGGGK
KgGGGGmmGGGGgK
.KggGGGGGGggK.
..KKKKKKKKKK..
""", """
..............
..............
.....KKKK.....
...KKGGGGKK...
..KGGjjGGGGK..
.KGGjGKGGGKGK.
KGGGGKGGGKGGGK
KGGGGGGGGGGGGK
KgGGGGmmGGGGgK
KggGGGGGGGGggK
.KKKKKKKKKKKK.
"""]

BAT = ["""
K...............K
KK.............KK
KPK....K.K....KPK
KPPK..KPKPK..KPPK
.KPPKKPPPPPKKPPK.
..KPPPPrPrPPPPK..
...KKKPPPPPKKK...
.......KpK.......
.................
""", """
.................
.................
.......K.K.......
......KPKPK......
..KKKKPPPPPKKKK..
.KPPPPPrPrPPPPPK.
KPPPKKPPPPPKKPPPK
KPK...KKpKK...KPK
K...............K
"""]

GHOST = ["""
....KKKK....
..KKWWWWKK..
.KWWWWWWWWK.
.KWWWWWWWWK.
KWWKKWWKKWWK
KWWKoWWKoWWK
KWWWWWWWWWWK
KWWWWKKWWWWK
KWWWWKKWWWWK
KWWWWWWWWWWK
KWwWWWwWWWwK
KWKWWKKWWKWK
.K.KK..KK.K.
""", """
....KKKK....
..KKWWWWKK..
.KWWWWWWWWK.
.KWWWWWWWWK.
KWWKKWWKKWWK
KWWKoWWKoWWK
KWWWWWWWWWWK
KWWWWKKWWWWK
KWWWWKKWWWWK
KWWWWWWWWWWK
KwWWWwWWWwWK
KWKWWKWWWKWK
.KK.K.KK.KK.
"""]

SERPENT_HEAD = """
...........KK.........
..........KYYK........
.....KK..KYYK.........
....KYYKKYYK..........
....KKYYKKKKKKKK......
......KKtTTTTTTTKKK...
.....KtTTTTTTTTTTTTKK.
....KtTTTTTKKTTTTTTTTK
...KtTTTTTKeEKTTTTTTTK
..KfTTTTTTTKKTTTTTTKKK
..KffTTTTTTTTTTTKKK...
...KfTTlllllllllK.....
....KKllYllYllYlKK....
......KKKKKKKKKKK.....
"""

SERPENT_SEGMENT = """
.....KK.....
....KffK....
..KKtTTtKK..
.KtTTTTTTtK.
.KTTtTTtTTK.
KTTTTTTTTTTK
KTtTTtTTtTTK
KTTTTTTTTTTK
KllllllllllK
.KllllllllK.
..KKllllKK..
....KKKK....
"""

SERPENT_TAIL = """
........KK..
......KKffK.
....KKtTTTK.
..KKtTTTTTTK
KKfTTtTTtTTK
.KffTTTTTTTK
..KKllllllK.
....KKllllK.
......KKKK..
"""

# Sapo saltador: sentado / pulando
FROG = ["""
................
....KK....KK....
...KWoK..KWoK...
..KRRRRKKRRRRK..
.KRRjRRRRRRRRRK.
.KRRRRRRRRRRRRK.
KRRmmmmmmmmmRRRK
KRRyyyyyyyyyyRRK
.KRryyyyyyyyrRK.
KRRKKrrrrrrKKRRK
KKK..KKKKKK..KKK
""", """
....KK....KK....
...KWoK..KWoK...
..KRRRRKKRRRRK..
.KRRjRRRRRRRRRK.
.KRRRRRRRRRRRRK.
KRRmmmmmmmmmRRRK
.KRyyyyyyyyyyRK.
..KryyyyyyyyrK..
..KrK......KrK..
.KrK........KrK.
KKK..........KKK
"""]

# Planta cuspidora: boca fechada / aberta
PLANT = ["""
....KKKKK....
..KKQQWQQKK..
.KQQQQQQQWQK.
.KQWQQQQQQQK.
.KQQQQQWQQQK.
..KqqqqqqqK..
...KKKKKKK...
......Kv.....
..KK..KvK.KK.
.KvvK.KvKKvvK
.KVvvKKvKvvVK
..KKKKKvKKKK.
.....KVVK....
""", """
...KKK.KKK...
..KQQQKQQQK..
.KQWQKWKQWQK.
.KQQKWWWKQQK.
.KqqK...KqqK.
.KQQKWWWKQQK.
..KQQKWKQQK..
...KKKKKKK...
......Kv.....
..KK..KvK.KK.
.KvvK.KvKKvvK
.KVvvKKvKvvVK
..KKKKKvKKKK.
.....KVVK....
"""]

# Semente cuspida pela planta
SEED = """
.KKKK.
KvvVVK
KvjvVK
KvvvVK
KVVVVK
.KKKK.
"""

# Vespa mergulhadora: asas para cima / para baixo (olhando para a esquerda)
WASP = ["""
.....xx.xx.....
....xxxxxxx....
.....xxxxx.....
..KKKKKKKKKKK..
.KoZKZZKZZKZZK.
KZZZKZZKZZKZZKK
.KZZKzzKzzKzzKu
..KKKKKKKKKKK..
...K..K..K.....
""", """
...............
...............
..KKKKKKKKKKK..
.KoZKZZKZZKZZK.
KZZZKZZKZZKZZKK
.KZZKzzKzzKzzKu
..KKKKKKKKKKK..
....xxxxxxx....
.....xx.xx.....
"""]

# Ouriço espinhoso (olhando para a esquerda): passo A / passo B
HEDGEHOG = ["""
....K.K.K.K...
...KhKhKhKhK..
..KhHhHhHhHhK.
.KUUHHHHHHHHhK
KUuUUHHHHHHHHK
KUUUUHHHHHHHhK
.KKUUUHHHHHHhK
..KUUKKKKKKKK.
...KK..KK.KK..
""", """
....K.K.K.K...
...KhKhKhKhK..
..KhHhHhHhHhK.
.KUUHHHHHHHHhK
KUuUUHHHHHHHHK
KUUUUHHHHHHHhK
.KKUUUHHHHHHhK
..KUUKKKKKKKK.
..KK..KK..KK..
"""]

# Águia (olhando para a esquerda): voo asas para cima / asas para baixo
EAGLE_FLY = ["""
..c..................c.
..cCc...............cCc
...cCc.............cCc.
....cCcc.........ccCc..
.....cCCc.......cCCc...
..WWK.cCCCcc.ccCCCc....
.WWWWWOOOOOOOOOOOOccc..
ZZWWWWOOOOOOOOOOOOOcccc
.ZZ..cOOOOOOOOOOOcc..cc
......cOOOOOOOOcc......
........Z...Z..........
""", """
.......................
.......................
..WWK..................
.WWWWWOOOOOOOOOOOOccc..
ZZWWWWOOOOOOOOOOOOOcccc
.ZZ..cOOOOOOOOOOOcc..cc
....cCCccOOOOOOcCCc....
...cCCc..cOOOOc..cCCc..
..cCCc....Z..Z....cCCc.
.cCCc..............cCCc
.cCc................cCc
"""]

# Águia mergulhando: asas fechadas, corpo esticado (o jogo gira o desenho)
EAGLE_DIVE = """
.......................
..WWK..................
.WWWWWOOOOOOOOOcc......
ZZWWWWOOOOOOOOOOOcccc..
.ZZ..cOOOOOOOOOOcccccc.
......cOOOOOOOcc.......
.......................
"""

# Águia no chão (asas recolhidas): passo A / passo B
EAGLE_GROUND = ["""
...WWK......
..WWWWW.....
.ZZWWWWc....
.Z..cOOOcc..
....cOOOOOc.
....cOOOOOOc
....cOOCOOOc
.....cOOOOcc
......cOOc..
......Z..Z..
.....ZZ..ZZ.
""", """
...WWK......
..WWWWW.....
.ZZWWWWc....
.Z..cOOOcc..
....cOOOOOc.
....cOOOOOOc
....cOOCOOOc
.....cOOOOcc
......cOOc..
.......Z.Z..
......ZZ.ZZ.
"""]

# Ovo que a águia solta voando
EGG = """
..KKK..
.KWWWK.
KWWxWWK
KWWWWWK
KWwWWwK
KWWWWWK
.KwwwK.
..KKK..
"""

# Árvore quebrável da Selva Gelada (pinheiro com neve): inteira / rachada
TREE = ["""
...........KK...........
..........KWWK..........
.........KWWWWK.........
........KWWvvWWK........
.......KWvvvvvvWK.......
......KvvvVvvvvvvK......
.....KWWvvvvvVvvWWK.....
....KvvvVvvvvvvvvvvK....
...KvvvvvvvvVvvvvvvvK...
....KKvvVvvvvvvvVvKK....
....KWWvvvvvvVvvvWWK....
...KvvvVvvvvvvvvvvvvK...
..KvvvvvvvVvvvvvvVvvvK..
.KvvVvvvvvvvvvvVvvvvvvK.
..KKvvvvvvVvvvvvvvvvKK..
...KWWWvvvvvvvVvvWWWK...
..KvvvvvVvvvvvvvvvvvvK..
.KvvVvvvvvvvvVvvvvvVvvK.
KvvvvvvvVvvvvvvvvvvvvvvK
KVVVVVVVVVVVVVVVVVVVVVVK
.KKKKKKKKKHHHhKKKKKKKKK.
.........KHHHhK.........
.........KHhHhK.........
.........KHHHhK.........
.........KHHhhK.........
.........KHHHhK.........
.........KhHHhK.........
.........KHHHhK.........
........KHHHHHhK........
.......KhKKKKKKhK.......
""", """
...........KK...........
..........KWWK..........
.........KWW.WK.........
........KWWvv.WK........
.......KWvvvvvvWK.......
......KvvvVvv.vvvK......
.....KWWvvvvvVvvWWK.....
....KvvvV.vvvvvvvvvK....
...KvvvvvvvvVvvv.vvvK...
....KKvvVvvvvvvvVvKK....
....KWWvvvvv.VvvvWWK....
...KvvvVvvvvvvvvvvvvK...
..Kvvv.vvvVvvvvvvVvvvK..
.KvvVvvvvvvv.vvVvvvvvvK.
..KKvvvvvvVvvvvvvvvvKK..
...KWWWvvvvvvvVvvWWWK...
..Kvvvvv.VvvvvvvvvvvvK..
.KvvVvvvvvvvvVvvv.vVvvK.
KvvvvvvvVvvvvvvvvvvvvvvK
KVVVVVVVVVVVVVVVVVVVVVVK
.KKKKKKKKKHKHhKKKKKKKKK.
.........KHKHhK.........
.........KhHKhK.........
.........KHKHhK.........
.........KKHhhK.........
.........KHKHhK.........
.........KhHKhK.........
.........KHKHhK.........
........KHHKHHhK........
.......KhKKKKKKhK.......
"""]

# Bandeira de chegada (fim da fase sem chefão)
FLAG = """
KK..........
KZKKKKKKK...
KZQQQQQQQK..
KZQQWWQQQQK.
KZQQWWQQQQQK
KZQQQQQQQQK.
KZQQQQQQQK..
KZKKKKKKK...
KZ..........
KZ..........
KZ..........
KZ..........
KZ..........
KZ..........
KZ..........
KZ..........
KZ..........
KZ..........
KZ..........
KZ..........
KZ..........
KZ..........
KZ..........
KZ..........
KZ..........
KZ..........
KKKK........
"""

# Chão da Selva Gelada: musgo com manchas de neve
GROUND_JUNGLE_ART = """
AWaAWAaA
aAAWaAAA
KaKKaKKa
BBBBbBBB
BbBBBBsB
BBBsBBBb
bBBBBbBB
BBbBBBBB
"""

# Bloco de chão (8x8): grama em cima, terra com pedrinhas embaixo
GROUND = """
AAaAAAaA
aAAAaAAA
KaKKaKKa
BBBBbBBB
BbBBBBsB
BBBsBBBb
bBBBBbBB
BBbBBBBB
"""


def parse(art):
    rows = art.strip("\n").split("\n")
    width = max(len(r) for r in rows)
    return [r.ljust(width, ".") for r in rows]


# Bloco de terra (8x8): preenche o interior dos morros, abaixo da grama
DIRT = """
BBBBbBBB
BbBBBBsB
BBBsBBBb
bBBBBbBB
BBbBBBBB
BBBBBsBB
BsBBbBBB
BBBbBBBb
"""

# Trocas de paleta do chão (grama -> neve / grama mística)
GROUND_ICE = {"A": (236, 246, 255, 255), "a": (184, 214, 240, 255),
              "B": (96, 120, 150, 255), "b": (72, 94, 124, 255), "s": (170, 210, 240, 255)}
GROUND_JUNGLE = {"A": (66, 132, 70, 255), "a": (42, 96, 52, 255),
                 "B": (92, 64, 42, 255), "b": (66, 46, 30, 255), "s": (200, 222, 236, 255)}
GROUND_MYSTIC = {"A": (236, 120, 200, 255), "a": (190, 80, 160, 255),
                 "B": (96, 62, 120, 255), "b": (72, 44, 96, 255), "s": (200, 150, 230, 255)}


def render(art, mirror=False, palette_overrides=None):
    palette = {**PALETTE, **(palette_overrides or {})}
    rows = parse(art)
    if mirror:
        rows = [r[::-1] for r in rows]
    img = Image.new("RGBA", (len(rows[0]) * CELL, len(rows) * CELL))
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            color = palette[ch]
            if color[3]:
                img.paste(color, (x * CELL, y * CELL, (x + 1) * CELL, (y + 1) * CELL))
    return img


def recolor(img, hue_degrees, sat=1.0):
    """Gira a matiz dos pixels coloridos (gera variações de cor dos bichos)."""
    img = img.copy()
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if s < 0.15:
                continue
            r2, g2, b2 = colorsys.hsv_to_rgb((h + hue_degrees / 360) % 1, min(s * sat, 1), v)
            px[x, y] = (int(r2 * 255), int(g2 * 255), int(b2 * 255), a)
    return img


# Pasta (dentro de assets/) de cada imagem, pelo começo do nome
FOLDERS = {
    "slime": "inimigos/slime",
    "morcego": "inimigos/morcego",
    "fantasma": "inimigos/fantasma",
    "sapo": "inimigos/sapo",
    "planta": "inimigos/planta",
    "semente": "inimigos/planta",
    "vespa": "inimigos/vespa",
    "ourico": "inimigos/ourico",
    "aguia": "inimigos/aguia",
    "serpente": "chefoes/serpente_glacial",
    "chao": "cenario",
    "arvore": "cenario",
    "bandeira": "cenario",
    "terra": "cenario",
}


def folder_for(filename):
    for prefix, folder in FOLDERS.items():
        if filename.startswith(prefix):
            return folder
    return "."


def build_sprites():
    sprites = {}
    for i, frame in enumerate(SLIME):
        base = render(frame)
        sprites[f"slime_{i}.png"] = base
        sprites[f"slime_gelo_{i}.png"] = recolor(base, 85)      # verde -> azul
        sprites[f"slime_rosa_{i}.png"] = recolor(base, 200)     # verde -> rosa
    for i, frame in enumerate(BAT):
        base = render(frame)
        sprites[f"morcego_{i}.png"] = base
        sprites[f"morcego_rosa_{i}.png"] = recolor(base, 50)
    for i, frame in enumerate(GHOST):
        sprites[f"fantasma_{i}.png"] = render(frame)
    for i, frame in enumerate(FROG):
        sprites[f"sapo_{i}.png"] = render(frame)
    for i, frame in enumerate(PLANT):
        sprites[f"planta_{i}.png"] = render(frame)
    sprites["semente.png"] = render(SEED)
    for i, frame in enumerate(WASP):
        sprites[f"vespa_{i}.png"] = render(frame)
    for i, frame in enumerate(HEDGEHOG):
        sprites[f"ourico_{i}.png"] = render(frame)
    for i, frame in enumerate(EAGLE_FLY):
        sprites[f"aguia_{i}.png"] = render(frame)
    sprites["aguia_mergulho.png"] = render(EAGLE_DIVE)
    sprites["aguia_ovo.png"] = render(EGG)
    for i, frame in enumerate(EAGLE_GROUND):
        sprites[f"aguia_chao_{i}.png"] = render(frame)
    sprites["serpente_cabeca.png"] = render(SERPENT_HEAD)
    sprites["serpente_corpo.png"] = render(SERPENT_SEGMENT)
    sprites["serpente_cauda.png"] = render(SERPENT_TAIL)
    sprites["chao.png"] = render(GROUND)
    sprites["chao_gelo.png"] = render(GROUND, palette_overrides=GROUND_ICE)
    sprites["chao_rosa.png"] = render(GROUND, palette_overrides=GROUND_MYSTIC)
    sprites["terra.png"] = render(DIRT)
    sprites["terra_gelo.png"] = render(DIRT, palette_overrides=GROUND_ICE)
    sprites["terra_rosa.png"] = render(DIRT, palette_overrides=GROUND_MYSTIC)
    sprites["chao_selva.png"] = render(GROUND_JUNGLE_ART, palette_overrides=GROUND_JUNGLE)
    sprites["terra_selva.png"] = render(DIRT, palette_overrides=GROUND_JUNGLE)
    for i, frame in enumerate(TREE):
        sprites[f"arvore_{i}.png"] = render(frame)
    sprites["bandeira.png"] = render(FLAG)
    return sprites


if __name__ == "__main__":
    import sys
    target = Path(sys.argv[1]) if len(sys.argv) > 1 else OUT_DIR
    for filename, image in build_sprites().items():
        path = target / folder_for(filename) / filename
        path.parent.mkdir(parents=True, exist_ok=True)
        image.save(path)
        print("gerado:", path)
