"""
jungle_background.py
-----------------------------------------------------------------------------
Gera o fundo da fase SELVA GELADA (assets/cenario/fundo_selva.png):
uma selva misturada com pinheiros nevados, em várias camadas que ficam mais
claras e apagadas ao longe (NEBLINA), com faixas de névoa e cipós.

É desenhado numa resolução pequena e ampliado sem suavizar (pixel art).
As árvores "dão a volta" nas bordas, então a imagem já emenda sozinha
(fundo INFINITO) — por isso a fase marca BACKGROUND_SEAMLESS em levels.js.

(Alternativa guardada: assets/cenario/fundo_selva_original.webp)

    py tools/jungle_background.py
-----------------------------------------------------------------------------
"""
import math
import random
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "assets" / "cenario" / "fundo_selva.png"
W, H = 225, 150          # resolução "pixel art" (ampliada 4x no final)
SCALE = 4
FOG = (214, 228, 226)    # cor da neblina
SEED = 7

random.seed(SEED)


def mix(c1, c2, t):
    return tuple(int(a + (b - a) * t) for a, b in zip(c1, c2))


def sky(img):
    """Céu esverdeado-acinzentado, mais claro embaixo (névoa)."""
    d = ImageDraw.Draw(img)
    top, bottom = (128, 168, 170), (200, 218, 214)
    for y in range(H):
        d.line([(0, y), (W, y)], fill=mix(top, bottom, y / H))


def wrap_draw(d, shape, x, *args):
    """Desenha a forma também deslocada de ±W, para emendar nas bordas."""
    for dx in (-W, 0, W):
        shape(d, x + dx, *args)


def pine(d, x, base, height, color, snow):
    """Pinheiro em camadas, com neve no topo de cada camada."""
    tiers = 3
    for i in range(tiers):
        top = base - height + i * height // (tiers + 1)
        half = 3 + (i + 1) * height // 9
        bottom = top + height // 2
        d.polygon([(x, top), (x - half, bottom), (x + half, bottom)], fill=color)
        d.polygon([(x, top), (x - half // 3, top + height // 9), (x + half // 3, top + height // 9)], fill=snow)
    d.rectangle([x - 1, base - height // 6, x + 1, base], fill=mix(color, (40, 30, 20), 0.5))


def canopy(d, x, base, height, color, vine, rng):
    """Árvore de selva: tronco fino, copa redonda e cipós pendurados."""
    d.rectangle([x - 1, base - height, x + 1, base], fill=mix(color, (40, 30, 20), 0.5))
    r = height // 3
    for ox, oy in ((-r // 2, 0), (r // 2, 0), (0, -r // 2)):
        d.ellipse([x + ox - r, base - height + oy - r, x + ox + r, base - height + oy + r], fill=color)
    for vx, length in rng:
        d.line([(x + vx, base - height + r // 2), (x + vx + 1, base - height + r // 2 + length)], fill=vine)


def layer(img, depth):
    """Uma camada de árvores. depth 0 = longe (bem enevoada), 1 = perto."""
    d = ImageDraw.Draw(img)
    green = mix((70, 120, 90), FOG, 0.75 - depth * 0.6)
    snow = mix((240, 246, 250), FOG, 0.5 - depth * 0.4)
    vine = mix((50, 90, 60), FOG, 0.7 - depth * 0.6)
    base = int(H * (0.62 + depth * 0.3))
    count = int(10 + depth * 6)
    for i in range(count):
        x = int(i * W / count + random.randint(-6, 6))
        height = int(random.randint(30, 46) * (0.7 + depth * 0.6))
        if random.random() < 0.55:
            wrap_draw(d, pine, x, base, height, green, snow)
        else:
            r = height // 3
            vines = [(-r // 2, random.randint(height // 4, height // 2)), (r // 3, random.randint(height // 4, height // 2))]
            wrap_draw(d, canopy, x, base, height, green, vine, vines)
    d.rectangle([0, base, W, H], fill=mix(green, (30, 40, 30), 0.15))  # chão da camada


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
        fog_band(img, int(H * (0.58 + depth * 0.25)), 10, 0.55)
    layer(img, 0.8)
    fog_band(img, int(H * 0.92), 8, 0.4)
    img.resize((W * SCALE, H * SCALE), Image.NEAREST).save(OUT)
    print("gerado:", OUT)


if __name__ == "__main__":
    main()
