"""
eaglet_boss_sprites.py
-----------------------------------------------------------------------------
Gera as imagens do chefão da fase 6, o FILHOTE DE ÁGUIA, a partir das três
artes originais (source_art/chefoes/filhote_aguia/), que são a mesma cena
com o filhote em três poses: olhando para a direita, para a esquerda e
chamando a mamãe (olhando para cima, de bico aberto).

  chefoes/filhote_aguia/ninho_cenario.png   → a cena no tamanho da arena (800x600)
                                              com o ninho VAZIO (o buraco do filhote é
                                              preenchido espelhando a paisagem dos lados)
  chefoes/filhote_aguia/filhote_*.png       → o filhote em cada pose, todas do mesmo
                                              tamanho (trocar a pose não desloca nada)
  chefoes/filhote_aguia/ninho_frente.png    → a beirada da frente do ninho: desenhada
                                              POR CIMA do filhote, ele parece afundar
                                              no ninho quando balança
  chefoes/filhote_aguia/filhote.json        → onde fica cada coisa na arena
  chefoes/filhote_aguia/minhoca.png         → o tiro do filhote (minhoca marrom)
  chefoes/filhote_aguia/graveto.png         → gravetos que caem quando ele chama a mamãe

    py tools/eaglet_boss_sprites.py
-----------------------------------------------------------------------------
"""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "source_art" / "chefoes" / "filhote_aguia"
OUT = ROOT / "assets" / "chefoes" / "filhote_aguia"
ARENA_SIZE = (800, 600)       # a cena preenche a arena inteira (cortando as laterais)
BASE_POSE = "esquerda"        # a cena da arena sai desta pose (a "do meio")
# Contorno do filhote em cada pose, na imagem original (x, y). A linha de baixo
# (y = RIM_Y) é a beirada do ninho: dali para baixo são os gravetos da frente.
RIM_Y = 302
POSES = {
    "direita": {
        "outline": [(586, 227), (604, 224), (618, 229), (630, 237), (637, 242), (646, 246), (648, 258),
                    (650, 268), (649, 284), (642, 293), (632, 296), (632, RIM_Y), (566, RIM_Y),
                    (568, 288), (569, 268), (573, 248), (579, 236)],
        "mouth": (648, 276),
    },
    "esquerda": {
        "outline": [(598, 227), (612, 224), (626, 229), (637, 237), (645, 250), (649, 268), (648, 285),
                    (656, 292), (657, RIM_Y), (588, RIM_Y), (590, 294), (582, 290), (577, 282),
                    (576, 268), (584, 262), (588, 248), (592, 236)],
        "mouth": (578, 276),
    },
    "chamando": {
        "outline": [(578, 206), (592, 194), (612, 186), (632, 180), (652, 178), (661, 186), (664, 205),
                    (664, 232), (658, 245), (652, 255), (658, 265), (660, 280), (662, RIM_Y),
                    (560, RIM_Y), (562, 290), (566, 272), (570, 240), (572, 222)],
        "mouth": (655, 200),
    },
}
POSE_KEYS = {"direita": "RIGHT", "esquerda": "LEFT", "chamando": "CALL"}  # nomes no filhote.json
HOLE_MARGIN = 6               # folga em volta do filhote ao apagá-lo da cena (px da arena)
BODY_EXTENSION = 14           # o corpo continua para dentro do ninho (para balançar sem "cortar")
FRONT_BOX = (545, RIM_Y - 3, 690, 340)  # beirada da frente do ninho (imagem original)
BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]  # pontilhado da emenda


def load(pose):
    return Image.open(SOURCE / f"filhote_{pose}_original.jpg").convert("RGB")


def arena_transform(image):
    """Escala para a altura da arena e devolve (escala, corte da esquerda)."""
    scale = ARENA_SIZE[1] / image.height
    return scale, (round(image.width * scale) - ARENA_SIZE[0]) // 2


def to_arena(image):
    """A imagem no tamanho da arena (centralizada, cortando as laterais)."""
    scale, left = arena_transform(image)
    resized = image.resize((round(image.width * scale), ARENA_SIZE[1]), Image.LANCZOS)
    return resized.crop((left, 0, left + ARENA_SIZE[0], ARENA_SIZE[1]))


def to_arena_point(point, image):
    scale, left = arena_transform(image)
    return round(point[0] * scale - left), round(point[1] * scale)


def is_background(r, g, b):
    """Céu, montanhas e pinheiros atrás da cabeça (o filhote é branco, amarelo e marrom)."""
    bluish = b > r + 8
    dark_green = g > r + 12 and g > b + 4 and r + g + b < 360
    return bluish or dark_green


def pose_mask(image, outline):
    """Máscara do filhote: dentro do contorno e sem os pixels do fundo."""
    mask = Image.new("L", image.size, 0)
    ImageDraw.Draw(mask).polygon(outline, fill=255)
    px, mp = image.load(), mask.load()
    for y in range(image.height):
        for x in range(image.width):
            if mp[x, y] and is_background(*px[x, y]):
                mp[x, y] = 0
    return mask.filter(ImageFilter.MedianFilter(3))


def extend_body(cut, rim_y):
    """Repete a última linha do corpo para baixo: ao subir balançando ele não aparece cortado."""
    px = cut.load()
    for y in range(rim_y, min(cut.height, rim_y + BODY_EXTENSION)):
        for x in range(cut.width):
            if px[x, rim_y - 1][3] and not px[x, y][3]:
                px[x, y] = px[x, rim_y - 1 - (y - rim_y) % 3]
    return cut


def fill_hole(scene, hole):
    """Apaga o filhote: cada linha do buraco espelha a paisagem da esquerda e da
    direita, com uma emenda pontilhada (como em pixel art) no meio."""
    out = scene.copy()
    px, src, mask = out.load(), scene.load(), hole.load()
    width, height = scene.size

    def reflect(x):
        return min(max(x, 0), width - 1)

    for y in range(height):
        x = 0
        while x < width:
            if not mask[x, y]:
                x += 1
                continue
            x0 = x
            while x < width and mask[x, y]:
                x += 1
            x1 = x - 1
            for xx in range(x0, x1 + 1):
                t = (xx - x0 + 0.5) / (x1 - x0 + 1)
                from_left = src[reflect(x0 - 1 - (xx - x0)), y]
                from_right = src[reflect(x1 + 1 + (x1 - xx)), y]
                k = min(max((t - 0.4) / 0.2, 0), 1)
                px[xx, y] = from_right if k * 16 > BAYER[y % 4][xx % 4] + 0.5 else from_left
    return out


def eaglet():
    """Cena vazia, poses do filhote (mesmo tamanho), beirada do ninho e posições."""
    base = load(BASE_POSE)
    scene = to_arena(base)
    rim_y = to_arena_point((0, RIM_Y), base)[1]

    cuts, union = {}, None
    for pose, data in POSES.items():
        image = load(pose)
        arena_image = to_arena(image).convert("RGBA")
        mask = to_arena(pose_mask(image, data["outline"]).convert("RGB")).getchannel("R")
        arena_image.putalpha(mask.point(lambda a: 255 if a > 127 else 0))
        cuts[pose] = arena_image
        box = arena_image.getbbox()
        union = box if union is None else (min(union[0], box[0]), min(union[1], box[1]),
                                          max(union[2], box[2]), max(union[3], box[3]))

    # apaga o filhote da cena: o buraco junta as três poses (com folga). Onde
    # outra pose mostra o fundo de verdade (ex.: o céu atrás da cabeça erguida),
    # copia de lá; o que nenhuma pose mostra (o corpo no ninho) é espelhado.
    grown = {pose: cut.getchannel("A").filter(ImageFilter.MaxFilter(HOLE_MARGIN * 2 + 1))
             for pose, cut in cuts.items()}
    hole = Image.new("L", ARENA_SIZE, 0)
    for mask in grown.values():
        hole.paste(255, mask=mask)
    empty = scene.copy()
    for pose, mask in grown.items():
        shows_background = Image.composite(hole, Image.new("L", ARENA_SIZE, 0), mask.point(lambda a: 255 - a))
        empty.paste(to_arena(load(pose)), mask=shows_background)
        hole.paste(0, mask=shows_background)
    empty = fill_hole(empty, hole)

    crop = (union[0], union[1], union[2], union[3] + BODY_EXTENSION)
    sprites = {pose: extend_body(cut, rim_y).crop(crop) for pose, cut in cuts.items()}

    front_left, front_top = to_arena_point(FRONT_BOX[:2], base)
    front_right, front_bottom = to_arena_point(FRONT_BOX[2:], base)
    front = empty.crop((front_left, front_top, front_right, front_bottom))

    layout = {
        "eaglet": {"x": crop[0], "y": crop[1]},
        "front": {"x": front_left, "y": front_top},
        "mouth": {POSE_KEYS[pose]: [p - o for p, o in zip(to_arena_point(data["mouth"], base), crop[:2])]
                  for pose, data in POSES.items()},
    }
    return empty, sprites, front, layout


def worm():
    """Minhoca marrom em pixel art (16x6, ampliada 3x), já ondulando."""
    art = Image.new("RGBA", (16, 6), (0, 0, 0, 0))
    d = ImageDraw.Draw(art)
    body, ring, light, outline = (176, 110, 88), (138, 80, 64), (210, 146, 120), (70, 40, 30)
    wave = [3, 2, 2, 1, 1, 2, 2, 3, 3, 2, 2, 1, 1, 2, 2, 3]
    for x, y in enumerate(wave):
        d.point((x, y - 1), fill=outline)
        d.point((x, y), fill=light if x % 4 == 1 else body)
        d.point((x, y + 1), fill=ring if x % 3 == 0 else body)
        d.point((x, y + 2), fill=outline)
    d.point((15, wave[15]), fill=(40, 20, 14))  # olhinho na ponta
    return art.resize((48, 18), Image.NEAREST)


def twig():
    """Graveto caindo (ponta para baixo), com dois galhinhos e uma folha."""
    art = Image.new("RGBA", (8, 22), (0, 0, 0, 0))
    d = ImageDraw.Draw(art)
    bark, dark, leaf = (110, 78, 44), (70, 48, 28), (70, 120, 46)
    d.line([(4, 0), (4, 21)], fill=bark)
    d.line([(5, 2), (5, 19)], fill=dark)
    d.line([(4, 6), (1, 3)], fill=bark)
    d.line([(5, 12), (7, 9)], fill=bark)
    d.rectangle([0, 2, 1, 3], fill=leaf)
    return art.resize((24, 66), Image.NEAREST)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    empty, sprites, front, layout = eaglet()
    empty.save(OUT / "ninho_cenario.png", optimize=True)
    for pose, sprite in sprites.items():
        sprite.save(OUT / f"filhote_{pose}.png")
    front.save(OUT / "ninho_frente.png")
    (OUT / "filhote.json").write_text(json.dumps(layout, indent=2))
    worm().save(OUT / "minhoca.png")
    twig().save(OUT / "graveto.png")
    print("gerado:", OUT, layout)
