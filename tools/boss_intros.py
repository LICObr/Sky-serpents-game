"""
boss_intros.py
-----------------------------------------------------------------------------
Gera as IMAGENS DE ABERTURA dos chefões (aparecem no começo da fase, como a
do urso na fase 4), a partir da arte que o jogo já usa:

  - dragões: recorta a pose "parado" da folha de animação
      chefoes/dragao_vermelho/dragao_intro.png
      chefoes/dragao_rosa/dragao_intro.png
  - serpente: monta o corpo inteiro (cabeça + segmentos + cauda) em onda,
    do mesmo jeito que o jogo desenha
      chefoes/serpente_glacial/serpente_intro.png

O urso já tem a sua (urso_intro.png, recortada por bear_sheet.py).

    py tools/boss_intros.py
-----------------------------------------------------------------------------
"""
import json
import math
from pathlib import Path
from PIL import Image, ImageOps

BOSSES = Path(__file__).resolve().parent.parent / "assets" / "chefoes"

DRAGON_FOLDERS = ["dragao_vermelho", "dragao_rosa"]
DRAGON_INTRO_FRAME = 72     # pose "parado": de pé, olhando para a esquerda

# Serpente: mesmas medidas do jogo (SCALE, SEGMENTS e SEGMENT_SPACING em boss_types.js)
SERPENT_SCALE = 0.17
SERPENT_SEGMENTS = 14       # o último é a cauda
SERPENT_SPACING = 22        # distância entre as partes (px do jogo)
WAVE_HEIGHT = 70            # altura da onda do corpo (px do jogo)
WAVE_LENGTH = 210           # comprimento de uma onda (px do jogo)
HEAD_LIFT = 24              # a cabeça fica um pouco levantada (px do jogo)
HEAD_LIFT_LENGTH = 80       # trecho do pescoço que levanta junto
SERPENT_WIDTH = 300         # largura final da imagem


def trim(image):
    """Corta as bordas transparentes (ignora sujeirinhas quase invisíveis)."""
    solid = image.getchannel("A").point(lambda a: 255 if a > 20 else 0)
    return image.crop(solid.getbbox())


def dragon_intro(folder):
    """Recorta um quadro da folha de animação do dragão."""
    meta = json.loads((BOSSES / folder / "dragao_animacoes.json").read_text(encoding="utf-8"))
    sheet = Image.open(BOSSES / folder / "dragao_animacoes.png").convert("RGBA")
    width, height = meta["frameWidth"], meta["frameHeight"]
    columns = sheet.width // width
    x = (DRAGON_INTRO_FRAME % columns) * width
    y = (DRAGON_INTRO_FRAME // columns) * height
    return trim(sheet.crop((x, y, x + width, y + height)))


def body_curve(x):
    """Forma do corpo: uma onda, com o pescoço levantado (a cabeça fica à direita)."""
    wave = WAVE_HEIGHT / 2 * math.sin(2 * math.pi * x / WAVE_LENGTH)
    lift = HEAD_LIFT * max(0.0, 1 - x / HEAD_LIFT_LENGTH) ** 2
    return -x, wave - lift


def body_points(count):
    """Uma parte a cada SERPENT_SPACING px AO LONGO do corpo (como o rastro da cabeça no jogo)."""
    points = [body_curve(0)]
    previous, walked, x = points[0], 0.0, 0.0
    while len(points) < count:
        x += 0.5
        current = body_curve(x)
        walked += math.dist(previous, current)
        previous = current
        if walked >= SERPENT_SPACING * len(points):
            points.append(current)
    return points


def serpent_intro():
    """Cabeça + corpo + cauda seguindo uma onda; cada parte olha para a da frente."""
    folder = BOSSES / "serpente_glacial"
    head = Image.open(folder / "serpente_cabeca.png").convert("RGBA")
    body = Image.open(folder / "serpente_corpo.png").convert("RGBA")
    tail = Image.open(folder / "serpente_cauda.png").convert("RGBA")
    unit = 1 / SERPENT_SCALE  # monta na resolução da arte e reduz no final

    points = body_points(SERPENT_SEGMENTS + 1)  # cabeça + segmentos + cauda
    parts = []
    for i, (x, y) in enumerate(points):
        # cada parte olha para a da frente; a cabeça segue a direção do pescoço
        front, back = (points[i - 1], (x, y)) if i > 0 else ((x, y), points[1])
        angle = math.degrees(math.atan2(front[1] - back[1], front[0] - back[0]))
        art = head if i == 0 else (tail if i == SERPENT_SEGMENTS else body)
        sprite = art.rotate(-angle, resample=Image.NEAREST, expand=True)
        parts.append((sprite, x * unit, y * unit))

    margin = max(head.width, head.height)
    left = min(x for _, x, _ in parts) - margin
    top = min(y for _, _, y in parts) - margin
    right = max(x for _, x, _ in parts) + margin
    bottom = max(y for _, _, y in parts) + margin
    canvas = Image.new("RGBA", (int(right - left), int(bottom - top)), (0, 0, 0, 0))

    # da cauda para a cabeça: as partes da frente ficam por cima (igual ao jogo)
    for sprite, x, y in reversed(parts):
        canvas.alpha_composite(sprite, (int(x - left - sprite.width / 2), int(y - top - sprite.height / 2)))

    serpent = trim(ImageOps.mirror(canvas))  # olhando para a esquerda, como os outros
    height = round(serpent.height * SERPENT_WIDTH / serpent.width)
    return serpent.resize((SERPENT_WIDTH, height), Image.LANCZOS)


if __name__ == "__main__":
    for folder in DRAGON_FOLDERS:
        path = BOSSES / folder / "dragao_intro.png"
        dragon_intro(folder).save(path)
        print("gerado:", path)
    path = BOSSES / "serpente_glacial" / "serpente_intro.png"
    serpent_intro().save(path)
    print("gerado:", path)
