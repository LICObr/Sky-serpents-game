"""
honey_background.py
-----------------------------------------------------------------------------
Gera o fundo da fase FLORESTA DO MEL (assets/cenario/fundo_mel.png): a mesma
ideia da selva gelada (jungle_background.py), mas com MEL no lugar da neve:
  - copas e pinheiros em verde-amarelado, com mel escorrendo no topo;
  - pingos de mel no lugar dos cipós e colmeias penduradas em algumas copas;
  - névoa dourada e quente.

É desenhado numa resolução pequena e ampliado sem suavizar (pixel art).
As árvores "dão a volta" nas bordas, então a imagem já emenda sozinha
(fundo INFINITO) — por isso a fase marca BACKGROUND_SEAMLESS.

    py tools/honey_background.py
-----------------------------------------------------------------------------
"""
import math
import random
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "assets" / "cenario" / "fundo_mel.png"
W, H = 225, 150          # resolução "pixel art" (ampliada 4x no final)
SCALE = 4
FOG = (240, 226, 170)    # névoa dourada
HONEY = (238, 172, 32)
HONEY_LIGHT = (255, 214, 92)
SEED = 11

random.seed(SEED)


def mix(c1, c2, t):
    return tuple(int(a + (b - a) * t) for a, b in zip(c1, c2))


def sky(img):
    """Céu verde-água em cima e dourado embaixo (névoa quente)."""
    d = ImageDraw.Draw(img)
    top, bottom = (132, 176, 150), (238, 224, 170)
    for y in range(H):
        d.line([(0, y), (W, y)], fill=mix(top, bottom, y / H))


def wrap_draw(d, shape, x, *args):
    """Desenha a forma também deslocada de ±W, para emendar nas bordas."""
    for dx in (-W, 0, W):
        shape(d, x + dx, *args)


def pine(d, x, base, height, color, honey):
    """Pinheiro em camadas, com mel escorrendo no topo de cada camada."""
    tiers = 3
    for i in range(tiers):
        top = base - height + i * height // (tiers + 1)
        half = 3 + (i + 1) * height // 9
        bottom = top + height // 2
        d.polygon([(x, top), (x - half, bottom), (x + half, bottom)], fill=color)
        d.polygon([(x, top), (x - half // 3, top + height // 9), (x + half // 3, top + height // 9)], fill=honey)
        d.line([(x - 1, top + height // 9), (x - 1, top + height // 9 + 2)], fill=honey)  # pingo escorrendo
    d.rectangle([x - 1, base - height // 6, x + 1, base], fill=mix(color, (60, 40, 20), 0.5))


def hive(d, x, y, honey, dark):
    """Colmeia pequena pendurada: oval dourada com listras."""
    d.line([(x, y - 4), (x, y - 1)], fill=dark)
    d.ellipse([x - 3, y - 1, x + 3, y + 7], fill=honey)
    for stripe in (y + 1, y + 4):
        d.line([(x - 2, stripe), (x + 2, stripe)], fill=dark)
    d.point((x, y + 6), fill=dark)  # entrada


def canopy(d, x, base, height, color, drip, drips, has_hive, honey, dark):
    """Árvore de copa redonda com pingos de mel (e às vezes uma colmeia)."""
    d.rectangle([x - 1, base - height, x + 1, base], fill=mix(color, (60, 40, 20), 0.5))
    r = height // 3
    for ox, oy in ((-r // 2, 0), (r // 2, 0), (0, -r // 2)):
        d.ellipse([x + ox - r, base - height + oy - r, x + ox + r, base - height + oy + r], fill=color)
    for dx, length in drips:
        top = base - height + r // 2
        d.line([(x + dx, top), (x + dx, top + length)], fill=drip)
        d.point((x + dx, top + length + 1), fill=drip)
    if has_hive:
        hive(d, x + r // 2, base - height + r, honey, dark)


def layer(img, depth):
    """Uma camada de árvores. depth 0 = longe (bem enevoada), 1 = perto."""
    d = ImageDraw.Draw(img)
    green = mix((128, 160, 52), FOG, 0.7 - depth * 0.6)
    honey = mix(HONEY_LIGHT, FOG, 0.45 - depth * 0.4)
    drip = mix(HONEY, FOG, 0.6 - depth * 0.55)
    dark = mix((96, 60, 20), FOG, 0.55 - depth * 0.5)
    base = int(H * (0.62 + depth * 0.3))
    count = int(10 + depth * 6)
    for i in range(count):
        x = int(i * W / count + random.randint(-6, 6))
        height = int(random.randint(30, 46) * (0.7 + depth * 0.6))
        if random.random() < 0.5:
            wrap_draw(d, pine, x, base, height, green, honey)
        else:
            r = height // 3
            drips = [(-r // 2, random.randint(2, 5)), (r // 3, random.randint(2, 6))]
            has_hive = depth > 0.2 and random.random() < 0.35
            wrap_draw(d, canopy, x, base, height, green, drip, drips, has_hive, honey, dark)
    d.rectangle([0, base, W, H], fill=mix(green, (50, 60, 20), 0.15))  # chão da camada


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
    for depth in (0.0, 0.25, 0.5):
        layer(img, depth)
        fog_band(img, int(H * (0.58 + depth * 0.25)), 10, 0.5)
    layer(img, 0.8)
    fog_band(img, int(H * 0.92), 8, 0.35)
    img.resize((W * SCALE, H * SCALE), Image.NEAREST).save(OUT)
    print("gerado:", OUT)


if __name__ == "__main__":
    main()
