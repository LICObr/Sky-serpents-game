"""
castle_background.py
-----------------------------------------------------------------------------
Gera o FUNDO PADRÃO (o vale dos castelos) a partir da arte original
(source_art/cenario/castelos_original.png):
  - corta a faixa de grama e terra de baixo da arte (ali fica o chão do jogo);
  - escala para a altura da tela e põe a mesma imagem ESPELHADA ao lado:
    a ponta direita encosta na esquerda sem corte e o fundo fica infinito.

  fundo.png              céu azul (fases sem fundo próprio, menu, escolha de fase)
  fundo_chefao_80.png    o mesmo vale com o céu levemente dourado (chefão com 80% de vida)
  fundo_chefao_40.png    céu de fim de tarde avermelhado (chefão com 40% de vida)

Só o CÉU muda de cor (e um pouquinho as montanhas lá no fundo): o resto
da imagem fica igual, então a troca no meio da luta é suave.

    py tools/castle_background.py
-----------------------------------------------------------------------------
"""
import numpy as np
from PIL import Image, ImageOps
from cave_background import HEIGHT, ROOT

SOURCE = ROOT / "source_art" / "cenario" / "castelos_original.png"
FOLDER = ROOT / "assets" / "cenario"
GROUND_STRIP_Y = 640       # daqui para baixo a arte tem a própria grama/terra (cortada)
HORIZON = 0.62             # o céu vai até esta fração da altura (mais forte lá em cima)

# (cor do céu, quanto ela pesa, onde pesa mais) — pouquinho, só para mudar o clima
#   "alto"      mais forte lá em cima, sumindo até o horizonte
#   "horizonte" brilho perto do horizonte (o alto do céu continua azul)
SKIES = {
    "fundo_chefao_80.png": ((255, 186, 120), 0.55, "horizonte"),  # fim de tarde dourado
    "fundo_chefao_40.png": ((214, 96, 86), 0.55, "alto"),          # entardecer avermelhado
}


def seamless_valley():
    """A arte sem a faixa de chão, na altura da tela, com o espelho ao lado."""
    original = Image.open(SOURCE).convert("RGB")
    valley = original.crop((0, 0, original.width, GROUND_STRIP_Y))
    width = round(valley.width * HEIGHT / valley.height)
    valley = valley.resize((width, HEIGHT), Image.LANCZOS)
    seamless = Image.new("RGB", (width * 2, HEIGHT))
    seamless.paste(valley, (0, 0))
    seamless.paste(ImageOps.mirror(valley), (width, 0))
    return seamless


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
    valley = seamless_valley()
    valley.save(FOLDER / "fundo.png", optimize=True)
    print("gerado:", FOLDER / "fundo.png", valley.size)
    for name, (color, strength, where) in SKIES.items():
        tint_sky(valley, color, strength, where).save(FOLDER / name, optimize=True)
        print("gerado:", FOLDER / name)
