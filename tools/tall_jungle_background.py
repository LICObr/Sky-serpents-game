"""
tall_jungle_background.py
-----------------------------------------------------------------------------
Gera o fundo da fase MONTANHA DA SELVA (assets/cenario/fundo_selva_alta.png):
árvores ALTÍSSIMAS de selva, no estilo da selva do Minecraft:
  - troncos grossos e listrados que sobem até sair pelo topo da imagem;
  - copas em blocos quadrados (folhas com pixels claros e escuros);
  - cipós pendurados nas copas e nos galhos;
  - três camadas (longe, meio, perto) separadas por névoa.

É desenhado numa resolução pequena e ampliado sem suavizar (pixel art).
As árvores "dão a volta" nas bordas, então a imagem já emenda sozinha
(fundo INFINITO) — por isso a fase marca BACKGROUND_SEAMLESS.

    py tools/tall_jungle_background.py
-----------------------------------------------------------------------------
"""
import math
import random
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "assets" / "cenario" / "fundo_selva_alta.png"
W, H = 225, 150          # resolução "pixel art" (ampliada 4x no final)
SCALE = 4
FOG = (176, 204, 186)    # névoa verde-clara da selva
BARK = (104, 84, 46)
BARK_STRIPE = (78, 60, 32)
LEAVES = (52, 112, 40)
LEAVES_LIGHT = (84, 150, 52)
LEAVES_DARK = (34, 80, 30)
VINE = (40, 94, 36)
SEED = 21

random.seed(SEED)


def mix(c1, c2, t):
    return tuple(int(a + (b - a) * t) for a, b in zip(c1, c2))


def sky(img):
    """Céu azul-esverdeado em cima, névoa clara embaixo."""
    d = ImageDraw.Draw(img)
    top, bottom = (120, 168, 188), (190, 214, 190)
    for y in range(H):
        d.line([(0, y), (W, y)], fill=mix(top, bottom, y / H))


def wrap_draw(d, shape, x, *args):
    """Desenha a forma também deslocada de ±W, para emendar nas bordas."""
    for dx in (-W, 0, W):
        shape(d, x + dx, *args)


def trunk(d, x, width, top, colors):
    """Tronco grosso com listras verticais (casca da árvore da selva)."""
    bark, stripe = colors
    d.rectangle([x, top, x + width - 1, H], fill=bark)
    for sx in range(x + 1, x + width - 1, 3):
        d.line([(sx, top), (sx, H)], fill=stripe)


def leaf_block(d, x, y, w, h, colors, rng):
    """Bloco de folhas quadrado, com pixels mais claros e mais escuros."""
    base, light, dark = colors
    d.rectangle([x, y, x + w - 1, y + h - 1], fill=base)
    for _ in range(w * h // 6):
        px, py = x + rng.randrange(w), y + rng.randrange(h)
        d.point((px, py), fill=light if rng.random() < 0.5 else dark)


def vine(d, x, y, length, color):
    """Cipó pendurado (com folhinhas de vez em quando)."""
    d.line([(x, y), (x, y + length)], fill=color)
    for vy in range(y + 2, y + length, 4):
        d.point((x + 1, vy), fill=color)


def jungle_tree(d, x, width, canopy_y, colors, rng):
    """Árvore altíssima: tronco até o topo, copa em blocos, galhos e cipós."""
    bark, stripe, base, light, dark, vine_color = colors
    trunk(d, x, width, canopy_y, (bark, stripe))
    # copa em degraus: um bloco largo e outro menor por cima
    span = width * 4
    leaf_block(d, x - span // 2 + width // 2, canopy_y, span, 6, (base, light, dark), rng)
    leaf_block(d, x - span // 3 + width // 2, canopy_y - 4, span * 2 // 3, 5, (base, light, dark), rng)
    for _ in range(3):  # cipós caindo da copa
        vine(d, x - span // 2 + width // 2 + rng.randrange(span), canopy_y + 6, rng.randint(6, 18), vine_color)
    # galhos com tufos de folhas ao longo do tronco
    for branch_y in range(canopy_y + 22, H - 20, rng.randint(18, 26)):
        side = -1 if rng.random() < 0.5 else 1
        bx = x + (width if side > 0 else 0)
        d.line([(bx, branch_y), (bx + side * 4, branch_y - 2)], fill=bark)
        leaf_block(d, bx + side * 4 - 3, branch_y - 5, 7, 4, (base, light, dark), rng)
        vine(d, bx + side * 4, branch_y - 1, rng.randint(4, 10), vine_color)


def layer(img, depth, count):
    """Uma camada de árvores. depth 0 = longe (bem enevoada), 1 = perto."""
    d = ImageDraw.Draw(img)
    fade = 0.75 - depth * 0.7
    colors = tuple(mix(c, FOG, fade) for c in (BARK, BARK_STRIPE, LEAVES, LEAVES_LIGHT, LEAVES_DARK, VINE))
    width = int(2 + depth * 6)
    rng = random.Random(SEED + int(depth * 100))
    for i in range(count):
        x = int(i * W / count + rng.randint(-5, 5))
        canopy_y = rng.randint(-2, 18)  # copas lá no alto (algumas saem da imagem)
        wrap_draw(d, jungle_tree, x, width, canopy_y, colors, random.Random(rng.random()))
    ground = int(H * (0.86 + depth * 0.1))
    d.rectangle([0, ground, W, H], fill=mix(colors[2], (30, 50, 24), 0.2))  # mato no chão da camada


def fog_band(img, y, thickness, strength):
    """Faixa de névoa: clareia suavemente em volta de uma altura."""
    px = img.load()
    for yy in range(max(0, y - thickness), min(H, y + thickness)):
        t = (1 - abs(yy - y) / thickness) * strength
        for x in range(W):
            wave = 0.85 + 0.15 * math.sin((x / W) * math.tau * 2 + y)  # emenda nas bordas
            px[x, yy] = mix(px[x, yy], FOG, t * wave)


def main():
    img = Image.new("RGB", (W, H))
    sky(img)
    layer(img, 0.0, 9)
    fog_band(img, int(H * 0.7), 14, 0.45)
    layer(img, 0.45, 6)
    fog_band(img, int(H * 0.85), 10, 0.35)
    layer(img, 0.9, 4)
    img.resize((W * SCALE, H * SCALE), Image.NEAREST).save(OUT)
    print("gerado:", OUT)


if __name__ == "__main__":
    main()
