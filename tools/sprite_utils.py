"""
sprite_utils.py
-----------------------------------------------------------------------------
Funções de imagem usadas por mais de uma ferramenta (ex.: tirar o fundo liso
de uma arte antes de virar sprite). Não é para rodar sozinho.
-----------------------------------------------------------------------------
"""


def cut_flat_background(image, tolerance):
    """Apaga o fundo liso (a cor dos cantos) que encosta nas bordas."""
    image = image.convert("RGBA")
    px = image.load()
    w, h = image.size
    background = px[0, 0][:3]
    seen = set()
    stack = [(x, y) for x in range(w) for y in (0, h - 1)] + [(x, y) for y in range(h) for x in (0, w - 1)]
    while stack:
        x, y = stack.pop()
        if (x, y) in seen or not (0 <= x < w and 0 <= y < h):
            continue
        r, g, b, _ = px[x, y]
        if abs(r - background[0]) + abs(g - background[1]) + abs(b - background[2]) > tolerance:
            continue
        seen.add((x, y))
        px[x, y] = (0, 0, 0, 0)
        stack.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
    return image
