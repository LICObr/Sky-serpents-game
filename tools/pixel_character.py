"""
pixel_character.py
-----------------------------------------------------------------------------
Funções comuns para transformar o PRINT de um personagem (pixel art
ampliada e meio borrada, num fundo azul-escuro) nos sprites do jogo:

  native_pixels      refaz a pixel art na GRADE original (um valor por
                     "pixel" da arte, pela mediana do meio de cada bloco)
  remove_background  apaga o fundo azul-escuro que encosta na borda
  keep_largest       fica só com o personagem (some texto e enfeites do cartão)
  outline            contorno escuro onde algo foi apagado (ex.: o martelo)
  remove_rows        tira linhas (agachar: o personagem fica mais baixo)
  place              amplia sem borrar e põe num quadro 500x500, com os pés
                     na mesma linha dos outros personagens
  save_sides         salva o _direita e o espelho _esquerda

Usado por viking_from_image.py, ninja_from_image.py e bard_from_image.py.
-----------------------------------------------------------------------------
"""
from collections import deque

import numpy as np
from PIL import Image

CANVAS = 500
FEET_Y = 470                          # base dos pés no quadro (igual à hitbox dos outros)
OUTLINE = (20, 16, 24, 255)


def native_pixels(source, crop, grid):
    """
    A pixel art na resolução original.
    grid: {"step_x", "offset_x", "step_y", "offset_y"} — tamanho de um "pixel"
    da arte no print e onde começa a grade (dentro do recorte).
    """
    image = np.asarray(Image.open(source).convert("RGB")).astype(float)
    x0, y0, x1, y1 = crop
    part = image[y0:y1, x0:x1]
    cols = np.arange(grid["offset_x"] + grid["step_x"] / 2, part.shape[1] - 1, grid["step_x"])
    rows = np.arange(grid["offset_y"] + grid["step_y"] / 2, part.shape[0] - 1, grid["step_y"])
    small = np.zeros((len(rows), len(cols), 4), dtype=np.uint8)
    for j, y in enumerate(rows):
        for i, x in enumerate(cols):
            yy, xx = int(round(y)), int(round(x))
            block = part[max(0, yy - 1):yy + 2, max(0, xx - 1):xx + 2].reshape(-1, 3)
            small[j, i, :3] = np.median(block, axis=0).round()
            small[j, i, 3] = 255
    return Image.fromarray(small, "RGBA").copy()


def is_dark_blue(pixel, max_value=120):
    """O fundo dos cartões: azul-escuro (azul bem mais forte que vermelho e verde)."""
    r, g, b, a = pixel
    return a == 0 or (b > r + 14 and b >= g + 10 and max(r, g, b) < max_value)


def remove_background(img, is_background=is_dark_blue, holes=False):
    """
    Apaga o fundo que encosta na borda (preenchimento a partir das bordas).
    holes=True também apaga o fundo "preso" dentro do desenho (ex.: o vão entre
    as pontas da faixa e a cabeça do ninja) — só para quem não tem azul-escuro na roupa.
    """
    w, h = img.size
    px = img.load()
    if holes:
        for y in range(h):
            for x in range(w):
                if is_background(px[x, y]):
                    px[x, y] = (0, 0, 0, 0)
        return img
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


def keep_largest(img):
    """Fica só com a maior mancha do desenho (some o que sobrou do cartão: texto, enfeites)."""
    w, h = img.size
    px = img.load()
    seen, best = set(), []
    for y0 in range(h):
        for x0 in range(w):
            if (x0, y0) in seen or not px[x0, y0][3]:
                continue
            blob, queue = [], deque([(x0, y0)])
            seen.add((x0, y0))
            while queue:
                x, y = queue.popleft()
                blob.append((x, y))
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1),
                               (x + 1, y + 1), (x - 1, y - 1), (x + 1, y - 1), (x - 1, y + 1)):
                    if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in seen and px[nx, ny][3]:
                        seen.add((nx, ny))
                        queue.append((nx, ny))
            if len(blob) > len(best):
                best = blob
    out = Image.new("RGBA", img.size, (0, 0, 0, 0))
    out_px = out.load()
    for x, y in best:
        out_px[x, y] = px[x, y]
    return out


def outline(img, color=OUTLINE):
    """Contorno escuro em volta de tudo que ficou sem borda."""
    out = img.copy()
    px, src = out.load(), img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            if src[x, y][3]:
                continue
            around = [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
            if any(0 <= ax < w and 0 <= ay < h and src[ax, ay][3] and src[ax, ay][:3] != color[:3]
                   and max(src[ax, ay][:3]) > 60 for ax, ay in around):
                px[x, y] = color
    return out


def remove_rows(img, rows):
    """Tira algumas linhas (barriga e pernas) e desce o resto: o personagem fica mais baixo."""
    kept = [y for y in range(img.height) if y not in rows]
    out = Image.new("RGBA", img.size, (0, 0, 0, 0))
    offset = len(rows)
    for new_y, y in enumerate(kept):
        out.paste(img.crop((0, y, img.width, y + 1)), (0, new_y + offset))
    return out


def place(small, box, art, center_x=None):
    """
    Amplia (sem borrar) o pedaço `box` da arte e põe num quadro 500x500, com
    os pés na base. Todas as poses usam a mesma caixa: não "pulam" ao trocar.
    center_x: coluna da arte que fica no meio do quadro (o meio do CORPO, para
    a hitbox ficar em cima dele); None = centraliza a caixa.
    """
    part = small.crop(box)
    big = part.resize((part.width * art, part.height * art), Image.NEAREST)
    canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    x = (CANVAS - big.width) // 2 if center_x is None else round(CANVAS / 2 - (center_x - box[0]) * art)
    canvas.paste(big, (x, FEET_Y - big.height), big)
    return canvas


def save_sides(canvas, folder, name):
    """Salva a pose olhando para a direita e o espelho (esquerda)."""
    canvas.save(folder / f"{name}_direita.png")
    canvas.transpose(Image.FLIP_LEFT_RIGHT).save(folder / f"{name}_esquerda.png")
    print("gerado:", folder / f"{name}_direita.png")
