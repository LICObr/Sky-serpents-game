"""
favicon.py
-----------------------------------------------------------------------------
Gera os ÍCONES do jogo a partir da cabeça do Dragão Vermelho
(assets/chefoes/dragao_vermelho/dragao_intro.png, gerada por boss_intros.py):
  assets/icones/favicon-16.png e favicon-32.png → aba do navegador
  assets/icones/apple-touch-icon.png (180x180)  → atalho na tela do celular
                                                  (com o azul do céu do jogo,
                                                  porque no iPhone o fundo
                                                  transparente fica preto)

    py tools/favicon.py
-----------------------------------------------------------------------------
"""
from pathlib import Path
from PIL import Image

ASSETS = Path(__file__).resolve().parent.parent / "assets"
SOURCE = ASSETS / "chefoes" / "dragao_vermelho" / "dragao_intro.png"
OUT = ASSETS / "icones"
HEAD_BOX = (0, 0, 46, 46)          # cabeça e pescoço do dragão (canto de cima à esquerda)
SKY = (43, 139, 216, 255)          # azul do céu do menu (cenario/fundo.png)
TOUCH_SIZE = 180
TOUCH_SCALE = 4                    # ampliação sem suavizar (pixel art nítida)


def head():
    return Image.open(SOURCE).convert("RGBA").crop(HEAD_BOX)


def touch_icon(art):
    """Cabeça ampliada até as bordas (como um retrato), sobre o azul do céu."""
    big = art.resize((art.width * TOUCH_SCALE, art.height * TOUCH_SCALE), Image.NEAREST)
    margin = (big.width - TOUCH_SIZE) // 2
    big = big.crop((margin, margin, margin + TOUCH_SIZE, margin + TOUCH_SIZE))
    icon = Image.new("RGBA", (TOUCH_SIZE, TOUCH_SIZE), SKY)
    icon.alpha_composite(big)
    return icon


if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    art = head()
    outputs = {
        "favicon-16.png": art.resize((16, 16), Image.LANCZOS),
        "favicon-32.png": art.resize((32, 32), Image.LANCZOS),
        "apple-touch-icon.png": touch_icon(art),
    }
    for name, image in outputs.items():
        image.save(OUT / name, optimize=True)
        print("gerado:", OUT / name)
