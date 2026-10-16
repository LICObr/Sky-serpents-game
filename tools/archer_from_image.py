"""
archer_from_image.py
-----------------------------------------------------------------------------
Usa uma IMAGEM PRONTA da arqueira (assets/personagens/arqueira/arqueira_original.png
— ou .jpg/.webp) como sprite do jogo, sem redesenhar nada:

  1. remove o fundo cinza-escuro (inclusive vãos fechados, como dentro do
     arco), sem apagar os contornos e os olhos, que têm tom mais quente;
  2. pinta os OLHOS de azul (manchas escuras mais altas que largas dentro
     do rosto — as sobrancelhas, que são mais largas, ficam como estão);
  3. recorta, centraliza e encaixa num quadro 500x500 com os pés embaixo
     (mesmo padrão dos sprites do herói);
  4. gera as poses: ATAQUE = imagem original (arco esticado com flecha);
     PARADA = mesma imagem sem a flecha e com a corda reta (arco relaxado);
     AGACHADA = parada um pouco achatada — tudo virado para os dois lados.

    py tools/archer_from_image.py            # gera os sprites
    py tools/archer_from_image.py --debug    # também salva arqueira_debug.png
-----------------------------------------------------------------------------
"""
import sys
from collections import deque
from pathlib import Path
from PIL import Image

ASSETS = Path(__file__).resolve().parent.parent / "assets" / "personagens" / "arqueira"
SOURCE_NAMES = ["arqueira_original.png", "arqueira_original.jpg", "arqueira_original.jpeg", "arqueira_original.webp"]

CANVAS = 500
CONTENT_HEIGHT = 470           # altura da personagem dentro do quadro (px)
BACKGROUND_MAX = 34            # canal máximo para um pixel ser "fundo" escuro
BACKGROUND_CHROMA = 6          # diferença máxima entre R, G e B no fundo (cinza neutro)
MIN_ENCLOSED_BACKGROUND = 400  # vãos fechados maiores que isso (px) também são fundo
EYE_DARK_MAX = 55              # canal máximo para um pixel ser "olho" escuro
EYE_BLUE = (64, 150, 240, 255)
EYE_BLUE_DARK = (24, 60, 140, 255)
FACING_RIGHT = True            # a imagem original olha para a direita?

# --- Pose PARADA (arco relaxado), derivada da imagem com o arco esticado ---
# Coordenadas na imagem original (1269x1240). Se trocar a imagem, ajuste aqui.
ARROW_SHAFT = (637, 581, 1115, 619)     # faixa da haste da flecha, com contorno (x0, y0, x1, y1)
ARROW_HEAD = (1108, 500, 1269, 700)     # ponta da flecha (fora do arco): apagar tudo
ARROW_FEATHERS = (570, 572, 640, 642)   # penas da flecha junto à mão
GLOVE_SAMPLE = (605, 600)               # cor da luva para cobrir as penas
STRING_BOXES = [(770, 195, 892, 350), (770, 690, 940, 950)]  # corda puxada em "V"
BOW_TOP_TIP = (878, 212)                # onde a corda se prende no arco
BOW_BOTTOM_TIP = (925, 938)
STRING_COLOR = (226, 212, 186, 255)
STRING_WIDTH = 9


def find_source():
    for name in SOURCE_NAMES:
        path = ASSETS / name
        if path.exists():
            return path
    sys.exit(f"Salve a imagem em {ASSETS / SOURCE_NAMES[0]} e rode de novo.")


def is_background(pixel):
    """Fundo = cinza escuro NEUTRO (R≈G≈B). Olhos/contornos têm tom quente."""
    r, g, b, a = pixel
    return a < 20 or (max(r, g, b) <= BACKGROUND_MAX and max(r, g, b) - min(r, g, b) <= BACKGROUND_CHROMA)


def remove_background(img):
    """
    Apaga o fundo: regiões de cinza neutro que tocam a borda da imagem OU
    que são grandes (ex.: o vão dentro do arco, espaços entre mechas do
    cabelo). Manchinhas neutras pequenas (ruído dentro de olhos/contornos)
    são mantidas.
    """
    w, h = img.size
    px = img.load()
    seen = bytearray(w * h)
    for sy in range(h):
        for sx in range(w):
            if seen[sy * w + sx] or not is_background(px[sx, sy]):
                continue
            region, touches_border, queue = [], False, deque([(sx, sy)])
            seen[sy * w + sx] = 1
            while queue:
                x, y = queue.popleft()
                region.append((x, y))
                if x in (0, w - 1) or y in (0, h - 1):
                    touches_border = True
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx] and is_background(px[nx, ny]):
                        seen[ny * w + nx] = 1
                        queue.append((nx, ny))
            if touches_border or len(region) >= MIN_ENCLOSED_BACKGROUND:
                for x, y in region:
                    px[x, y] = (0, 0, 0, 0)
    return img


def dark_components(img):
    """Manchas escuras (pretas) que NÃO tocam o fundo transparente."""
    w, h = img.size
    px = img.load()
    seen = bytearray(w * h)
    components = []
    for sy in range(h):
        for sx in range(w):
            r, g, b, a = px[sx, sy]
            if seen[sy * w + sx] or a == 0 or max(r, g, b) > EYE_DARK_MAX:
                continue
            pixels, touches_bg, queue = [], False, deque([(sx, sy)])
            while queue:
                x, y = queue.popleft()
                if not (0 <= x < w and 0 <= y < h) or seen[y * w + x]:
                    continue
                r, g, b, a = px[x, y]
                if a == 0:
                    touches_bg = True
                    continue
                if max(r, g, b) > EYE_DARK_MAX:
                    continue
                seen[y * w + x] = 1
                pixels.append((x, y))
                queue.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])
            if not touches_bg:
                components.append(pixels)
    return components


def is_skin(pixel):
    r, g, b, a = pixel
    return a > 0 and r > 190 and 120 < g < 225 and 70 < b < 180 and r - g > 20


def skin_ratio_around(img, xs, ys, margin=8):
    """Fração de pixels de PELE na moldura em volta de uma mancha."""
    w, h = img.size
    px = img.load()
    left, right = max(min(xs) - margin, 0), min(max(xs) + margin, w - 1)
    top, bottom = max(min(ys) - margin, 0), min(max(ys) + margin, h - 1)
    ring = [(x, top) for x in range(left, right + 1)] + [(x, bottom) for x in range(left, right + 1)]
    ring += [(left, y) for y in range(top, bottom + 1)] + [(right, y) for y in range(top, bottom + 1)]
    return sum(is_skin(px[x, y]) for x, y in ring) / len(ring)


def paint_eyes_blue(img):
    """
    Pinta de azul os OLHOS: manchas escuras mais altas que largas e
    cercadas de pele (assim vãos escuros do cabelo não são confundidos).
    """
    w, h = img.size
    px = img.load()
    min_area = (w * h) * 0.00004
    eyes = []
    for pixels in dark_components(img):
        xs = [p[0] for p in pixels]
        ys = [p[1] for p in pixels]
        width, height = max(xs) - min(xs) + 1, max(ys) - min(ys) + 1
        tall = height >= width * 1.15
        if tall and len(pixels) >= min_area and height < h * 0.12 and skin_ratio_around(img, xs, ys) > 0.5:
            eyes.append((pixels, min(ys), height))

    # Mantém só os 2 maiores (os dois olhos)
    eyes.sort(key=lambda e: len(e[0]), reverse=True)
    eyes = eyes[:2]

    # Se só um olho ficou "solto", o outro costuma estar grudado no contorno
    # do rosto: procura pixels escuros na MESMA ALTURA, logo ao lado.
    if len(eyes) == 1:
        eyes.append(find_twin_eye(img, eyes[0]))

    for pixels, top, height in eyes:
        for x, y in pixels:
            # terço de cima mais escuro (pupila/cílios), resto azul
            px[x, y] = EYE_BLUE_DARK if y < top + height / 3 else EYE_BLUE
    return len([e for e in eyes if e[0]])


def find_twin_eye(img, eye):
    """Pixels escuros numa faixa ao lado do olho encontrado (o outro olho)."""
    pixels, top, height = eye
    xs = [p[0] for p in pixels]
    width = max(xs) - min(xs) + 1
    px = img.load()

    best = []
    for direction in (1, -1):  # procura à direita e à esquerda
        start = max(xs) + width // 2 if direction > 0 else min(xs) - width // 2
        candidates = []
        for x in range(start, start + direction * width * 4, direction):
            column = [(x, y) for y in range(top, top + height)
                      if 0 <= x < img.width and px[x, y][3] > 0 and max(px[x, y][:3]) <= EYE_DARK_MAX]
            if len(column) >= height * 0.6:      # coluna quase toda escura = olho
                candidates.extend(column)
            elif candidates:
                break                             # fim do olho
        if len(candidates) > len(best):
            best = candidates
    return best, top, height


def is_light(pixel):
    """Cor clara/bege da flecha e da corda (a pele é mais alaranjada)."""
    r, g, b, a = pixel
    return a > 0 and r > 180 and g > 160 and b > 125


def relax_bow(img):
    """
    Gera a pose PARADA: sem flecha e com a corda reta (arco sem esticar).
    """
    img = img.copy()
    px = img.load()
    w, h = img.size

    # Haste da flecha (com o contorno escuro dela): cada coluna da faixa é
    # preenchida metade com o que está logo ACIMA e metade com o que está
    # logo ABAIXO (queixo/gola, braço, madeira do arco ou fundo transparente).
    x0, y0, x1, y1 = ARROW_SHAFT
    middle = (y0 + y1) // 2
    for x in range(x0, min(x1, w)):
        above, below = px[x, y0 - 3], px[x, y1 + 3]
        for y in range(y0, y1):
            px[x, y] = above if y < middle else below

    # Ponta da flecha (fica fora do arco, sobre o fundo): apaga
    x0, y0, x1, y1 = ARROW_HEAD
    for x in range(x0, min(x1, w)):
        for y in range(y0, y1):
            px[x, y] = (0, 0, 0, 0)

    # Penas da flecha: viram parte da luva
    glove = px[GLOVE_SAMPLE]
    x0, y0, x1, y1 = ARROW_FEATHERS
    for x in range(x0, x1):
        for y in range(y0, y1):
            if is_light(px[x, y]):
                px[x, y] = glove

    # Corda puxada (em "V"): apaga
    for x0, y0, x1, y1 in STRING_BOXES:
        for x in range(x0, x1):
            for y in range(y0, y1):
                if is_light(px[x, y]):
                    px[x, y] = (0, 0, 0, 0)

    # Corda reta entre as pontas do arco (por trás do corpo/braço)
    (ax, ay), (bx, by) = BOW_TOP_TIP, BOW_BOTTOM_TIP
    for y in range(ay, by + 1):
        cx = ax + (bx - ax) * (y - ay) / (by - ay)
        for x in range(int(cx - STRING_WIDTH / 2), int(cx + STRING_WIDTH / 2) + 1):
            if 0 <= x < w and px[x, y][3] == 0:
                px[x, y] = STRING_COLOR
    return img


def fit_to_canvas(img, bbox):
    """Recorta a personagem e encaixa num quadro 500x500 com os pés embaixo.
    Todas as poses usam o MESMO recorte (bbox) para não "pularem" na troca."""
    img = img.crop(bbox)
    scale = CONTENT_HEIGHT / img.height
    if img.width * scale > CANVAS:
        scale = CANVAS / img.width
    img = img.resize((round(img.width * scale), round(img.height * scale)), Image.NEAREST)
    canvas = Image.new("RGBA", (CANVAS, CANVAS))
    canvas.paste(img, ((CANVAS - img.width) // 2, CANVAS - img.height - 10), img)
    return canvas


def ducked(img):
    """Pose agachada: a mesma arte um pouco achatada, apoiada no chão."""
    content = img.crop((0, 0, CANVAS, CANVAS))
    content = content.crop(content.getbbox())
    squashed = content.resize((content.width, round(content.height * 0.82)), Image.NEAREST)
    canvas = Image.new("RGBA", (CANVAS, CANVAS))
    canvas.paste(squashed, ((CANVAS - squashed.width) // 2, CANVAS - squashed.height - 10), squashed)
    return canvas


def main():
    source = find_source()
    img = Image.open(source).convert("RGBA")
    remove_background(img)
    eyes = paint_eyes_blue(img)

    drawn = img                 # imagem original: arco esticado (ATAQUE)
    relaxed = relax_bow(img)    # arco sem esticar (PARADA)
    bbox = drawn.getbbox()      # mesmo enquadramento para todas as poses

    attack = fit_to_canvas(drawn, bbox)
    stand = fit_to_canvas(relaxed, bbox)
    if not FACING_RIGHT:
        attack = attack.transpose(Image.FLIP_LEFT_RIGHT)
        stand = stand.transpose(Image.FLIP_LEFT_RIGHT)

    poses = {"arqueira": stand, "arqueira_ataque": attack, "arqueira_agachada": ducked(stand)}
    for name, image in poses.items():
        image.save(ASSETS / f"{name}_direita.png")
        image.transpose(Image.FLIP_LEFT_RIGHT).save(ASSETS / f"{name}_esquerda.png")
    if "--debug" in sys.argv:
        stand.save(ASSETS / "arqueira_debug.png")
    print(f"Arqueira gerada a partir de {source.name} (olhos pintados: {eyes}).")


if __name__ == "__main__":
    main()
