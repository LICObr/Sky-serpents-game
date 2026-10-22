"""
castle_background.py
-----------------------------------------------------------------------------
Gera os FUNDOS DOS CASTELOS a partir das artes originais (source_art/cenario/):
  - corta a faixa de chão de baixo da arte (ali fica o chão do jogo);
  - escala para a altura da tela e põe a mesma imagem ESPELHADA ao lado:
    a ponta direita encosta na esquerda sem corte e o fundo fica infinito.

  fundo.png              vale dos castelos, céu azul (fases sem fundo próprio,
                         menu, escolha de fase)
  fundo_chefao_80.png    o mesmo vale com o céu levemente dourado (chefão com 80% de vida)
  fundo_chefao_40.png    céu de fim de tarde avermelhado (chefão com 40% de vida)
  fundo_por_do_sol.png   reino de castelos com neve ao pôr do sol (fase da Serpente)
  fundo_neve.png         castelos congelados no meio da neve (fase do Urso)
  fundo_tempestade.png   costa dos castelos de noite, na tempestade, com o tornado
  fundo_tempestade_raio.png  a mesma costa ILUMINADA pelo relâmpago: tudo clareia
                         e o tornado fica brilhando (o jogo pisca para ela)

Nos fundos do chefão só o CÉU muda de cor (e um pouquinho as montanhas lá no
fundo): o resto da imagem fica igual, então a troca no meio da luta é suave.

    py tools/castle_background.py
-----------------------------------------------------------------------------
"""
import numpy as np
from PIL import Image, ImageOps
from cave_background import HEIGHT, ROOT

ART = ROOT / "source_art" / "cenario"
FOLDER = ROOT / "assets" / "cenario"
# arte original → (fundo gerado, linha onde começa o chão da própria arte — cortado)
VALLEY = ("castelos_original.png", "fundo.png", 640)
OTHER_BACKGROUNDS = [
    ("por_do_sol_original.png", "fundo_por_do_sol.png", 630),
    ("neve_original.png", "fundo_neve.png", 616),
    ("tempestade_original.png", "fundo_tempestade.png", 630),
]
STORM = ("tempestade_original.png", "fundo_tempestade_raio.png", 630)
TORNADO = (1266, 285)      # meio do tornado na arte original (x, y)
LIGHTNING_LIGHT = (214, 228, 255)  # luz fria do relâmpago
HORIZON = 0.62             # o céu vai até esta fração da altura (mais forte lá em cima)

# (cor do céu, quanto ela pesa, onde pesa mais) — pouquinho, só para mudar o clima
#   "alto"      mais forte lá em cima, sumindo até o horizonte
#   "horizonte" brilho perto do horizonte (o alto do céu continua azul)
SKIES = {
    "fundo_chefao_80.png": ((255, 186, 120), 0.55, "horizonte"),  # fim de tarde dourado
    "fundo_chefao_40.png": ((214, 96, 86), 0.55, "alto"),          # entardecer avermelhado
}


def scaled_art(source, ground_strip_y):
    """A arte sem a faixa de chão, na altura da tela."""
    original = Image.open(ART / source).convert("RGB")
    art = original.crop((0, 0, original.width, ground_strip_y))
    width = round(art.width * HEIGHT / art.height)
    return art.resize((width, HEIGHT), Image.LANCZOS)


def mirrored(art):
    """A imagem com o espelho dela ao lado: emenda perfeita (fundo infinito)."""
    seamless = Image.new("RGB", (art.width * 2, art.height))
    seamless.paste(art, (0, 0))
    seamless.paste(ImageOps.mirror(art), (art.width, 0))
    return seamless


def seamless_valley(source, ground_strip_y):
    """A arte sem a faixa de chão, na altura da tela, com o espelho ao lado."""
    return mirrored(scaled_art(source, ground_strip_y))


def lightning_lit(art, tornado, ground_strip_y):
    """A arte clareada pela luz fria do relâmpago, com um brilho forte em volta do tornado."""
    pixels = np.asarray(art).astype(np.float32) / 255
    height, width = pixels.shape[:2]
    scale = height / ground_strip_y
    cx, cy = tornado[0] * scale, tornado[1] * scale
    ys, xs = np.mgrid[0:height, 0:width].astype(np.float32)
    glow = np.exp(-(((xs - cx) / 170) ** 2 + ((ys - cy) / 240) ** 2))[..., None]  # oval em pé (o funil)
    # tudo clareia (mais nas sombras); no tornado clareia muito mais, sem apagar os redemoinhos dele
    lit = pixels ** (0.58 - 0.3 * glow)
    lit = lit * 0.82 + np.array(LIGHTNING_LIGHT, dtype=np.float32) / 255 * 0.18
    lit = lit + glow * 0.1
    return Image.fromarray((np.clip(lit, 0, 1) * 255).round().astype(np.uint8))


def tint_sky(image, color, strength, where):
    """Pinta só o céu (azul e nuvens claras): mais forte no alto ou perto do horizonte."""
    pixels = np.asarray(image).astype(np.float32)
    r, g, b = pixels[..., 0], pixels[..., 1], pixels[..., 2]
    height = pixels.shape[0]
    rows = np.arange(height, dtype=np.float32)[:, None]
    if where == "alto":
        t = np.clip((HORIZON * height - rows) / (HORIZON * height), 0, 1)
        by_height = t * t * (3 - 2 * t)                                # suave até o horizonte
    else:
        by_height = np.exp(-((rows / height - 0.38) / 0.17) ** 2)      # faixa brilhando acima das montanhas
    blue = np.clip((b - r) / 80, 0, 1)                                 # céu azul
    cloud = np.clip((np.minimum(np.minimum(r, g), b) - 170) / 60, 0, 1)  # nuvens claras
    weight = (by_height * np.maximum(blue, cloud) * strength)[..., None]
    light = (0.3 * r + 0.59 * g + 0.11 * b)[..., None] / 255
    target = np.array(color, dtype=np.float32) * (0.55 + 0.6 * light)  # a cor nova com a luz de cada pixel
    out = pixels * (1 - weight) + np.clip(target, 0, 255) * weight
    return Image.fromarray(out.round().astype(np.uint8))


if __name__ == "__main__":
    source, out, ground_y = VALLEY
    valley = seamless_valley(source, ground_y)
    valley.save(FOLDER / out, optimize=True)
    print("gerado:", FOLDER / out, valley.size)
    for name, (color, strength, where) in SKIES.items():
        tint_sky(valley, color, strength, where).save(FOLDER / name, optimize=True)
        print("gerado:", FOLDER / name)
    for source, out, ground_y in OTHER_BACKGROUNDS:
        background = seamless_valley(source, ground_y)
        background.save(FOLDER / out, optimize=True)
        print("gerado:", FOLDER / out, background.size)
    source, out, ground_y = STORM
    lit = mirrored(lightning_lit(scaled_art(source, ground_y), TORNADO, ground_y))
    lit.save(FOLDER / out, optimize=True)
    print("gerado:", FOLDER / out, lit.size)
