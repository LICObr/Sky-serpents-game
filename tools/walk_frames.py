"""
walk_frames.py
-----------------------------------------------------------------------------
Gera os quadros de CAMINHADA dos personagens a partir da pose parada, mexendo
SÓ as pernas (e a mão livre do guerreiro). O resto do desenho fica idêntico.

Como funciona: abaixo do quadril cada perna é deslocada para frente ou para
trás, de "pixel" em "pixel" da arte (mais perto do pé = mais deslocado), para
os blocos da pixel art continuarem inteiros.
  passo_a → perna da frente para frente, a de trás para trás
  passo_b → o contrário
A animação no jogo é: passo_a, parado, passo_b, parado.

A arqueira segura o arco com os dois braços, então nela só as pernas mexem.

    py tools/walk_frames.py
-----------------------------------------------------------------------------
"""
from pathlib import Path
from PIL import Image, ImageOps

FOLDER = Path(__file__).resolve().parent.parent / "assets" / "personagens"

# Medidas de cada desenho (px da imagem de 500x500):
#   steps    a partir de qual altura cada parte da perna anda quantos "pixels" da
#            arte: quadril (0), canela (1), pé (2) — nas linhas reais do desenho
#   art      tamanho de um "pixel" da arte
#   back / front  faixas x da perna de trás / da frente, por altura:
#            [(a partir de y, x0, x1), ...] (o pé às vezes é mais largo que a perna)
#   hand     caixa da mão livre (x0, y0, x1, y1) ou None
#   facing   +1 olhando para a direita, -1 para a esquerda
KNIGHT_STEPS = [(397, 0), (412, 1), (430, 2)]
SPRITES = {
    "guerreiro/heroi": [
        ("direita", dict(art=15, steps=KNIGHT_STEPS, back=[(397, 0, 243)], front=[(397, 243, 500)],
                         hand=(138, 314, 206, 382), facing=1)),
        ("esquerda", dict(art=15, steps=KNIGHT_STEPS, back=[(397, 280, 500)], front=[(397, 0, 280)],
                          hand=(320, 314, 388, 382), facing=-1)),
    ],
    "arqueira/arqueira": [
        ("direita", dict(art=16, steps=[(412, 0), (442, 1), (460, 2)],
                         back=[(412, 100, 200), (450, 60, 200)], front=[(412, 250, 346), (450, 250, 370)],
                         hand=None, facing=1)),
    ],
}
HAND_STEPS = 1             # quanto a mão balança (em "pixels" da arte)


def cut_leg(image, bands):
    """Recorta uma perna (faixas por altura) e devolve (perna, imagem sem a perna)."""
    leg = Image.new("RGBA", image.size, (0, 0, 0, 0))
    rest = image.copy()
    for i, (y0, x0, x1) in enumerate(bands):
        y1 = bands[i + 1][0] if i + 1 < len(bands) else image.height
        box = (x0, y0, x1, y1)
        leg.paste(image.crop(box), box[:2])
        rest.paste((0, 0, 0, 0), box)
    return leg, rest


def step_at(steps, y):
    """Quantos "pixels" da arte a linha y anda (quadril 0, canela 1, pé 2)."""
    return max((value for start, value in steps if y >= start), default=0)


def move_leg(leg, steps, art, direction):
    """Desloca cada linha da perna conforme a parte (canela, pé)."""
    out = Image.new("RGBA", leg.size, (0, 0, 0, 0))
    for y in range(steps[0][0], leg.height):
        row = leg.crop((0, y, leg.width, y + 1))
        out.alpha_composite(row, (direction * step_at(steps, y) * art, y))
    return out


def swing_hand(image, box, dx):
    """Move a mão para o lado; o espaço que ela deixa vira a cor que estava ao lado dela."""
    x0, y0, x1, y1 = box
    hand = image.crop(box)
    out = image.copy()
    px, src = out.load(), image.load()
    edge = x0 - 1 if dx > 0 else x1  # coluna vizinha, do lado de onde a mão saiu
    for y in range(y0, y1):
        for x in range(x0, x1):
            px[x, y] = src[edge, y]
    out.alpha_composite(hand, (x0 + dx, y0))
    return out


def walk_frame(stand, cfg, sign):
    """sign = +1 (passo_a) ou -1 (passo_b)."""
    art, facing, steps = cfg["art"], cfg["facing"], cfg["steps"]
    image = stand
    if cfg["hand"]:
        image = swing_hand(image, cfg["hand"], facing * sign * HAND_STEPS * art)
    back, rest = cut_leg(image, cfg["back"])
    front, rest = cut_leg(rest, cfg["front"])
    frame = rest
    frame.alpha_composite(move_leg(back, steps, art, -facing * sign))
    frame.alpha_composite(move_leg(front, steps, art, facing * sign))
    return frame


if __name__ == "__main__":
    for base, sides in SPRITES.items():
        for side, cfg in sides:
            stand = Image.open(FOLDER / f"{base}_{side}.png").convert("RGBA")
            for name, sign in (("passo_a", 1), ("passo_b", -1)):
                frame = walk_frame(stand, cfg, sign)
                frame.save(FOLDER / f"{base}_{name}_{side}.png")
                print("gerado:", FOLDER / f"{base}_{name}_{side}.png")
                if len(sides) == 1:  # o outro lado é só o espelho (como a pose parada)
                    ImageOps.mirror(frame).save(FOLDER / f"{base}_{name}_esquerda.png")
                    print("gerado:", FOLDER / f"{base}_{name}_esquerda.png")
