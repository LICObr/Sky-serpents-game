"""
bee_boss_sprites.py
-----------------------------------------------------------------------------
Gera as imagens dos chefões da fase 5 a partir das artes originais
(source_art/chefoes/...):

  COLMEIA (1º chefão) — colmeia_original.png é a cena inteira:
    chefoes/colmeia/colmeia_cenario_vazio.png → a cena no tamanho da arena (800x600)
                                          SEM a colmeia: o buraco dela é preenchido
                                          espelhando a paisagem dos dois lados
    chefoes/colmeia/colmeia.png         → só a colmeia, recortada da cena por um
                                          contorno + remoção do fundo azulado
                                          (é o chefão, desenhado por cima da cena)
    chefoes/colmeia/colmeia.json        → onde a colmeia fica na arena (para o
                                          chefão ficar exatamente no lugar dela)

  ABELHA RAINHA (2º chefão)
    abelha_original.png → chefoes/abelha_rainha/abelha_animacoes.png/.json
      voando   (4 quadros) asas batendo + corpo balançando
      atacando (1 quadro)  inclinada para frente, pronta para o ferrão
    + gota_mel.png (mel que cai do teto) e espirro_mel.png (tiro da rainha)

    py tools/bee_boss_sprites.py
-----------------------------------------------------------------------------
"""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
from sprite_utils import cut_flat_background

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "source_art" / "chefoes"
ASSETS = ROOT / "assets" / "chefoes"
# ---------------------------------------------------------------- colmeia
# Contorno da colmeia na imagem original (x, y), de cima no sentido horário.
HIVE_OUTLINE = [
    (750, 0), (900, 0), (950, 60), (980, 120), (1030, 170), (1090, 240), (1115, 300), (1120, 360),
    (1108, 420), (1088, 470), (1060, 530), (1032, 580), (1010, 620), (980, 660), (960, 700),
    (940, 740), (905, 785), (880, 790), (860, 770), (840, 745), (810, 720), (775, 700),
    (750, 660), (725, 620), (700, 580), (680, 520), (660, 470), (638, 420), (618, 360),
    (612, 300), (622, 245), (650, 200), (680, 160), (710, 120), (735, 60),
]
HIVE_MOUTH = (860, 480)       # boca da colmeia na imagem original (de onde saem as abelhas)
ARENA_SIZE = (800, 600)       # a cena preenche a arena inteira (cortando as laterais)
# Buraco para apagar a colmeia da cena: o contorno com folga (para levar junto
# os fios de musgo e pingos de mel pendurados em volta)
HOLE_MARGIN = 18              # px da arena
SEAM_BAND = 0.2               # largura da emenda pontilhada (fração do buraco)
BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]  # pontilhado da emenda


def is_background(r, g, b):
    """Céu, montanhas e água: tons azulados e claros (a colmeia é dourada/marrom/musgo)."""
    return b > r + 8 and (r + g + b) > 180


def hive_mask(image):
    """Máscara da colmeia na imagem original."""
    mask = Image.new("L", image.size, 0)
    ImageDraw.Draw(mask).polygon(HIVE_OUTLINE, fill=255)
    px, mp = image.load(), mask.load()
    for y in range(image.height):
        for x in range(image.width):
            if mp[x, y] and is_background(*px[x, y][:3]):
                mp[x, y] = 0
    return mask.filter(ImageFilter.MedianFilter(5))  # tira sujeirinhas soltas na borda


def to_arena(image):
    """Escala a imagem para a altura da arena e corta as laterais (centralizada)."""
    width, height = ARENA_SIZE
    scale = height / image.height
    resized = image.resize((round(image.width * scale), height), Image.LANCZOS)
    left = (resized.width - width) // 2
    return resized.crop((left, 0, left + width, height)), scale, left


def hole_mask(original):
    """Onde está a colmeia na cena da arena (contorno com folga)."""
    polygon = Image.new("L", original.size, 0)
    ImageDraw.Draw(polygon).polygon(HIVE_OUTLINE, fill=255)
    arena, _, _ = to_arena(polygon.convert("RGBA"))
    inside = arena.getchannel("R").point(lambda a: 255 if a > 20 else 0)
    return inside.filter(ImageFilter.MaxFilter(HOLE_MARGIN * 2 + 1))


def seam_at(y):
    """Onde fica a emenda (fração do buraco). No alto, na copa da árvore, fica no
    meio; mais embaixo vai para perto da borda esquerda, para quase tudo vir do
    lado direito (montanhas e lago) e não copiar a cachoeira da esquerda."""
    t = min(max((y - 240) / 80, 0), 1)
    return 0.5 - 0.3 * t * t * (3 - 2 * t)


def fill_hole(scene, hole):
    """Apaga a colmeia: cada linha do buraco espelha a paisagem da esquerda e da
    direita, com uma emenda pontilhada (como em pixel art) entre as duas."""
    out = scene.copy()
    px, src, mask = out.load(), scene.load(), hole.load()
    width, height = scene.size

    def reflect(x):  # espelha também na borda da imagem
        x = -x if x < 0 else x
        x = 2 * (width - 1) - x if x > width - 1 else x
        return min(max(x, 0), width - 1)

    for y in range(height):
        seam = seam_at(y)
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
                k = min(max((t - (seam - SEAM_BAND / 2)) / SEAM_BAND, 0), 1)
                px[xx, y] = from_right if k * 16 > BAYER[y % 4][xx % 4] + 0.5 else from_left
    return out


def hive():
    """Devolve (cena da arena sem a colmeia, colmeia recortada, posição da colmeia e da boca)."""
    original = Image.open(SOURCE / "colmeia" / "colmeia_original.png").convert("RGBA")
    scene, scale, left = to_arena(original)
    # 256 cores deixam o arquivo leve; a colmeia sai desta mesma cena (pixels idênticos)
    palette = scene.convert("RGB").quantize(colors=256, method=Image.Quantize.FASTOCTREE)
    scene = palette.convert("RGBA")
    arena_mask, _, _ = to_arena(hive_mask(original).convert("RGBA"))

    cut = scene.copy()
    cut.putalpha(arena_mask.getchannel("R").point(lambda a: 255 if a > 127 else 0))
    box = cut.getbbox()
    layout = {
        "x": box[0], "y": box[1],
        "mouth": [round(HIVE_MOUTH[0] * scale - left), round(HIVE_MOUTH[1] * scale)],
    }

    empty = fill_hole(scene.convert("RGB"), hole_mask(original))
    return to_palette(empty, palette), cut.crop(box), layout


def to_palette(image, palette):
    """Grava com as mesmas 256 cores da cena, sem trocar nenhuma (o buraco só
    copia pixels que já existem na cena)."""
    colors = palette.getpalette()[:768]
    index = {tuple(colors[i:i + 3]): i // 3 for i in range(0, len(colors), 3)}
    out = Image.new("P", image.size)
    out.putpalette(colors)
    pixels = image.load()
    out.putdata([index[pixels[x, y]] for y in range(image.height) for x in range(image.width)])
    return out


# ---------------------------------------------------------------- abelha
BEE_BACKGROUND_TOLERANCE = 40   # diferença máxima para o fundo liso da imagem
WING_BOTTOM = 135               # onde as asas encostam no corpo (y na imagem original)
WING_FLAP = [1.0, 0.62, 0.28, 0.62]   # altura das asas em cada quadro do voo
BODY_BOB = [0, 3, 6, 3]               # corpo sobe e desce junto (px)
ATTACK_TILT_DEG = 14                  # inclinação no quadro de ataque
PADDING = 24


def split_wings(bee, wing_bottom):
    """Separa as asas (pixels brancos/azul-claro acima do corpo) do resto da abelha."""
    wings = Image.new("RGBA", bee.size, (0, 0, 0, 0))
    body = bee.copy()
    src, wpx, bpx = bee.load(), wings.load(), body.load()
    for y in range(min(wing_bottom, bee.height)):
        for x in range(bee.width):
            r, g, b, a = src[x, y]
            if a and min(r, g, b) > 185:
                wpx[x, y] = (r, g, b, a)
                bpx[x, y] = (0, 0, 0, 0)
    return body, wings


def flap_frame(body, wings, wing_scale, bob):
    """Um quadro do voo: asas achatadas em direção ao corpo + corpo deslocado."""
    frame = Image.new("RGBA", (body.width + PADDING * 2, body.height + PADDING * 2), (0, 0, 0, 0))
    frame.alpha_composite(body, (PADDING, PADDING + bob))
    box = wings.getbbox()
    if box:
        part = wings.crop(box)
        height = max(2, round(part.height * wing_scale))
        part = part.resize((part.width, height), Image.NEAREST)
        frame.alpha_composite(part, (PADDING + box[0], PADDING + bob + box[3] - height))
    return frame


def bee_sheet():
    original = Image.open(SOURCE / "abelha_rainha" / "abelha_original.png")
    cut = cut_flat_background(original, BEE_BACKGROUND_TOLERANCE)
    box = cut.getbbox()
    bee = cut.crop(box)
    body, wings = split_wings(bee, WING_BOTTOM - box[1])  # altura das asas já no recorte

    frames = [flap_frame(body, wings, scale, bob) for scale, bob in zip(WING_FLAP, BODY_BOB)]
    attack = flap_frame(body, wings, 1.0, 0).rotate(ATTACK_TILT_DEG, resample=Image.BICUBIC)
    frames.append(attack)

    width, height = frames[0].size
    sheet = Image.new("RGBA", (width * len(frames), height), (0, 0, 0, 0))
    for i, frame in enumerate(frames):
        sheet.alpha_composite(frame, (i * width, 0))
    meta = {
        "frameWidth": width,
        "frameHeight": height,
        "facesRight": False,
        "animations": {"voando": [0, 1, 2, 3], "atacando": [4]},
    }
    return sheet, meta


# ---------------------------------------------------------------- mel
def honey_drop():
    """Gota de mel comprida (pixel art 12x22 ampliada 2x)."""
    art = Image.new("RGBA", (12, 22), (0, 0, 0, 0))
    d = ImageDraw.Draw(art)
    outline, honey, dark, light = (120, 66, 8, 255), (246, 178, 30, 255), (214, 128, 12, 255), (255, 236, 150, 255)
    d.polygon([(1, 0), (10, 0), (8, 9), (9, 14), (8, 18), (6, 21), (5, 21), (3, 18), (2, 14), (3, 9)], fill=honey, outline=outline)
    d.line([(7, 2), (6, 17)], fill=dark)
    d.line([(4, 3), (4, 12)], fill=light)
    d.point((5, 15), fill=light)
    return art.resize((24, 44), Image.NEAREST)


def honey_squirt():
    """Espirro de mel (tiro da rainha): gota gorda na frente, rabo afinando e
    respingos para trás. Apontando para a DIREITA (o jogo gira na direção do tiro)."""
    width, height = 40, 24
    shape = Image.new("L", (width, height), 0)
    d = ImageDraw.Draw(shape)
    d.ellipse([22, 5, 37, 19], fill=255)                                     # gota da frente
    d.polygon([(24, 7), (12, 9), (5, 12), (12, 15), (24, 17)], fill=255)     # rabo afinando
    for x, y, r in ((8, 5, 2), (3, 17, 1), (15, 20, 2), (17, 3, 1)):         # respingos
        d.ellipse([x - r, y - r, x + r, y + r], fill=255)

    inside = shape.filter(ImageFilter.MinFilter(3))  # o que sobra é o contorno
    outline, honey, light, shine = (120, 66, 8, 255), (232, 152, 20, 255), (250, 192, 52, 255), (255, 240, 170, 255)
    art = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    px, sp, ip = art.load(), shape.load(), inside.load()
    for y in range(height):
        for x in range(width):
            if sp[x, y]:
                px[x, y] = outline if not ip[x, y] else (light if y < height * 0.45 else honey)
    for x, y in ((27, 8), (28, 8), (29, 8), (26, 9)):
        px[x, y] = shine
    return art.resize((width * 2, height * 2), Image.NEAREST)


if __name__ == "__main__":
    empty_scene, hive_cut, layout = hive()
    outputs = {
        ASSETS / "colmeia" / "colmeia_cenario_vazio.png": empty_scene,
        ASSETS / "colmeia" / "colmeia.png": hive_cut,
        ASSETS / "abelha_rainha" / "gota_mel.png": honey_drop(),
        ASSETS / "abelha_rainha" / "espirro_mel.png": honey_squirt(),
    }
    sheet, meta = bee_sheet()
    outputs[ASSETS / "abelha_rainha" / "abelha_animacoes.png"] = sheet
    for path, image in outputs.items():
        image.save(path, optimize=True)
        print("gerado:", path)
    for path, data in ((ASSETS / "abelha_rainha" / "abelha_animacoes.json", meta),
                       (ASSETS / "colmeia" / "colmeia.json", layout)):
        path.write_text(json.dumps(data, indent=2), encoding="utf-8")
        print("gerado:", path)
