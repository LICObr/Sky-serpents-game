"""
walk_frames.py
-----------------------------------------------------------------------------
Gera os quadros de CAMINHADA e de PULO dos personagens a partir da pose
parada, mexendo SÓ as pernas (e a mão livre do guerreiro). O resto do
desenho fica idêntico.

Caminhada de verdade (4 quadros, um PASSO de cada vez):
  passo_a       pé da frente na frente, o de trás atrás (apoiando)
  passo_a_meio  o pé de trás SOBE e passa por baixo do corpo
  passo_b       agora o de trás está na frente (cruzando o outro)
  passo_b_meio  o pé da frente sobe e passa
A perna de trás fica um pouco mais escura, para dar para ver qual está na
frente quando elas se cruzam. Pé levantado fica atrás do corpo (só aparece a
canela e o pé, mais altos).

Pulo:
  pulo   subindo: as duas pernas encolhidas
  queda  descendo: uma perna na frente, já se preparando para pousar

Como funciona: abaixo do quadril cada perna é deslocada para frente ou para
trás, de "pixel" em "pixel" da arte (mais perto do pé = mais deslocado), para
os blocos da pixel art continuarem inteiros.

A arqueira segura o arco com os dois braços, então nela só as pernas mexem
(no viking também — com e sem o martelo —, no ninja e no bardo).

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
# Viking (tools/viking_from_image.py): com e sem o martelo, as pernas no mesmo lugar
VIKING_LEGS = dict(art=10, steps=[(400, 0), (420, 1), (440, 2)], back=[(400, 0, 190)], front=[(400, 190, 500)],
                   hand=None, facing=1)
SPRITES["viking/viking"] = [("direita", VIKING_LEGS)]
SPRITES["viking/viking_sem_martelo"] = [("direita", VIKING_LEGS)]
# Ninja (tools/ninja_from_image.py): base aberta, perna de trás na diagonal
SPRITES["ninja/ninja"] = [("direita", dict(art=10, steps=[(340, 0), (380, 1), (420, 2)],
                                           back=[(340, 0, 250)], front=[(340, 250, 500)], hand=None, facing=1))]
# Bardo (tools/bard_from_image.py): arte mais miúda (6 px); o florete pendurado atrás não anda junto
SPRITES["bardo/bardo"] = [("direita", dict(art=6, steps=[(398, 0), (422, 1), (440, 2)],
                                           back=[(398, 139, 250)], front=[(398, 250, 500)], hand=None, facing=1))]
BACK_LEG_SHADE = 0.8       # a perna de trás um pouco mais escura

# Cada quadro: (perna de trás, perna da frente, mão)
#   perna = (pé anda quantos "pixels" para a frente, sobe quantos "pixels")
#   mão   = quantos "pixels" a mão livre balança para a frente
FRAMES = {
    "passo_a":      ((-2, 0), (2, 0), 1),
    "passo_a_meio": ((1, 2), (0, 0), 0),
    "passo_b":      ((2, 0), (-2, 0), -1),
    "passo_b_meio": ((0, 0), (1, 2), 0),
    "pulo":         ((-1, 2), (1, 2), 1),
    "queda":        ((-1, 0), (2, 1), -1),
}


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
    """Quanto da passada a linha y anda: quadril 0, canela 1, pé 2."""
    return max((value for start, value in steps if y >= start), default=0)


def move_leg(leg, cfg, foot, lift):
    """Leva o pé `foot` "pixels" para a frente (a canela vai metade) e sobe a perna `lift` "pixels"."""
    art, steps, facing = cfg["art"], cfg["steps"], cfg["facing"]
    out = Image.new("RGBA", leg.size, (0, 0, 0, 0))
    for y in range(steps[0][0], leg.height):
        row = leg.crop((0, y, leg.width, y + 1))
        dx = int(step_at(steps, y) * foot / 2 + (0.5 if foot >= 0 else -0.5)) * art * facing
        out.alpha_composite(row, (dx, y - lift * art))
    return out


def shade(image, factor):
    """Escurece (perna de trás)."""
    r, g, b, a = image.split()
    r, g, b = (channel.point(lambda v: int(v * factor)) for channel in (r, g, b))
    return Image.merge("RGBA", (r, g, b, a))


def swing_hand(image, box, dx):
    """Move a mão para o lado; o espaço que ela deixa vira a cor que estava ao lado dela."""
    if dx == 0:
        return image
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


def leg_frame(stand, cfg, back_pose, front_pose, hand):
    """Um quadro: perna levantada fica atrás do corpo; a de trás por baixo da da frente."""
    image = stand
    if cfg["hand"]:
        image = swing_hand(image, cfg["hand"], cfg["facing"] * hand * cfg["art"])
    back, rest = cut_leg(image, cfg["back"])
    front, rest = cut_leg(rest, cfg["front"])
    back = shade(move_leg(back, cfg, *back_pose), BACK_LEG_SHADE)
    front = move_leg(front, cfg, *front_pose)

    frame = Image.new("RGBA", stand.size, (0, 0, 0, 0))
    lifted = [leg for leg, (_, lift) in ((back, back_pose), (front, front_pose)) if lift]
    planted = [leg for leg, (_, lift) in ((back, back_pose), (front, front_pose)) if not lift]
    for leg in lifted:        # pé levantado: atrás do corpo (só aparece canela e pé)
        frame.alpha_composite(leg)
    frame.alpha_composite(rest)
    for leg in planted:       # a de trás primeiro, a da frente por cima
        frame.alpha_composite(leg)
    return frame


if __name__ == "__main__":
    for base, sides in SPRITES.items():
        for side, cfg in sides:
            stand = Image.open(FOLDER / f"{base}_{side}.png").convert("RGBA")
            for name, (back_pose, front_pose, hand) in FRAMES.items():
                frame = leg_frame(stand, cfg, back_pose, front_pose, hand)
                frame.save(FOLDER / f"{base}_{name}_{side}.png")
                print("gerado:", FOLDER / f"{base}_{name}_{side}.png")
                if len(sides) == 1:  # o outro lado é só o espelho (como a pose parada)
                    ImageOps.mirror(frame).save(FOLDER / f"{base}_{name}_esquerda.png")
                    print("gerado:", FOLDER / f"{base}_{name}_esquerda.png")
