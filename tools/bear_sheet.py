"""
bear_sheet.py
-----------------------------------------------------------------------------
Separa a SPRITE SHEET do Urso Polar (assets/chefoes/urso_polar/urso_sheet.png,
fundo azul-escuro, 12 seções com título e números) em quadros e monta uma
folha uniforme que o Phaser entende (mesmo formato dos dragões):

  1. cada seção é recortada sem o título e sem os números;
  2. o fundo escuro vira transparente (pixels parecidos com a cor do fundo);
  3. os quadros são separados pelas colunas vazias entre eles;
  4. limpeza: some com sujeirinhas soltas e suaviza a borda;
  5. todos os quadros vão para células do mesmo tamanho, alinhados pelo
     centro (horizontal) e pela base/pés (vertical).

Também recorta a imagem de abertura (urso_intro_original.png → urso_intro.png).

Saída (assets/chefoes/urso_polar):
  urso_animacoes.png  → folha com todos os quadros (grade)
  urso_animacoes.json → tamanho do quadro e quais quadros cada animação usa

    py tools/bear_sheet.py            # gera a folha
    py tools/bear_sheet.py --debug    # também salva uma prévia com os recortes
-----------------------------------------------------------------------------
"""
import json
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

FOLDER = Path(__file__).resolve().parent.parent / "assets" / "chefoes" / "urso_polar"
SOURCE = FOLDER / "urso_sheet.png"

BACKGROUND = (8, 15, 20)  # azul quase preto do fundo
BG_DISTANCE = 34          # diferença mínima da cor do fundo para ser "desenho"
COLUMN_GAP = 4            # colunas vazias que separam dois quadros
MIN_FRAME_WIDTH = 24      # ignora sujeirinhas estreitas (ex.: respingos soltos)
MIN_COLUMN_PIXELS = 2     # coluna com menos pixels que isso conta como vazia
CELL_PADDING = 4
GRID_COLUMNS = 10

# Seções: nome no jogo, retângulo dos desenhos (x0, y0, x1, y1) já sem título
# e sem números, e quantos quadros a seção tem.
SECTIONS = [
    ("parado",     (18, 50, 770, 140), 9),    # 1. idle
    ("andando",    (795, 50, 1515, 140), 8),  # 2. passo normal
    ("correndo",   (18, 225, 770, 314), 8),   # 3. correndo (investida)
    ("batendo",    (795, 225, 1515, 316), 8), # 4. batendo a pata (terremoto)
    ("pulando",    (18, 395, 770, 508), 8),   # 5. pulo
    ("impacto",    (795, 405, 1515, 508), 8), # 6. pisando no chão (aterrissagem)
    ("derrapando", (18, 595, 770, 674), 8),   # 7. derrapando (fim da investida)
    ("agachado",   (795, 595, 1515, 674), 8), # 8. agachado (preparando)
    ("levantando", (18, 748, 770, 830), 9),   # 9. levantando
    ("atacando",   (795, 748, 1515, 830), 8), # 10. mordida / garra (arremesso)
    ("virando_esq", (18, 905, 345, 962), 8),  # 11. virando (de frente, lado esquerdo)
    ("virando_dir", (425, 905, 860, 962), 9), # 11. virando (de frente, lado direito)
    ("morrendo",   (885, 900, 1515, 966), 8), # 12. morrendo
]


# Quadros extras da 2ª imagem (fundo azul-claro com degradê): recortados um a
# um e o fundo é removido por "balde de tinta" a partir das bordas.
EXTRA_SOURCE = FOLDER / "urso_sheet_extra.png"
EXTRA_SECTIONS = [
    ("rugindo", [(178, 800, 340, 895), (378, 800, 535, 895), (565, 800, 722, 895), (760, 800, 910, 895)]),
    ("enrolado", [(178, 922, 302, 1006), (330, 922, 458, 1006), (500, 922, 628, 1006), (660, 922, 770, 1006)]),
]
FILL_STEP = 16
INTRO_SOURCE = FOLDER / "urso_intro_original.png"   # imagem da abertura da fase 4            # diferença máxima entre vizinhos do fundo (degradê suave)


def cut_by_flood_fill(image, box):
    """Recorta um quadro e apaga o fundo que encosta nas bordas (balde de tinta)."""
    frame = image.crop(box).convert("RGBA")
    px = frame.load()
    w, h = frame.size
    seen = [[False] * h for _ in range(w)]
    stack = [(x, y) for x in range(w) for y in (0, h - 1)] + [(x, y) for y in range(h) for x in (0, w - 1)]
    for x, y in stack:
        seen[x][y] = True
    while stack:
        x, y = stack.pop()
        r, g, b, _ = px[x, y]
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not seen[nx][ny]:
                nr, ng, nb, _ = px[nx, ny]
                if abs(nr - r) + abs(ng - g) + abs(nb - b) <= FILL_STEP:
                    seen[nx][ny] = True
                    stack.append((nx, ny))
    for x in range(w):
        for y in range(h):
            if seen[x][y]:
                px[x, y] = (0, 0, 0, 0)
    return clean(frame.crop(frame.getbbox()))


def is_drawing(pixel):
    r, g, b = pixel[:3]
    br, bg_, bb = BACKGROUND
    return abs(r - br) + abs(g - bg_) + abs(b - bb) > BG_DISTANCE


def cut_section(sheet, box):
    """Recorta a seção e devolve uma imagem RGBA com o fundo transparente."""
    section = sheet.crop(box).convert("RGBA")
    pixels = section.load()
    w, h = section.size
    for y in range(h):
        for x in range(w):
            if not is_drawing(pixels[x, y]):
                pixels[x, y] = (0, 0, 0, 0)
    return section


def split_merged(spans, counts, expected):
    """Quadros encostados viram um só: corta o mais largo na coluna mais vazia do meio."""
    spans = list(spans)
    while len(spans) < expected:
        i = max(range(len(spans)), key=lambda k: spans[k][1] - spans[k][0])
        x0, x1 = spans[i]
        lo, hi = x0 + (x1 - x0) * 3 // 10, x0 + (x1 - x0) * 7 // 10
        cut = min(range(lo, hi), key=lambda x: counts[x])
        spans[i:i + 1] = [(x0, cut), (cut + 1, x1)]
    return spans


def split_frames(section, expected):
    """Separa os quadros pelas colunas (quase) vazias."""
    w, h = section.size
    alpha = section.getchannel("A").load()
    counts = [sum(1 for y in range(h) if alpha[x, y]) for x in range(w)]
    filled = [c >= MIN_COLUMN_PIXELS for c in counts]

    spans, start, gap = [], None, 0
    for x, on in enumerate(filled + [False] * (COLUMN_GAP + 1)):
        if on:
            if start is None:
                start = x
            gap = 0
        elif start is not None:
            gap += 1
            if gap > COLUMN_GAP:
                end = x - gap + 1
                if end - start >= MIN_FRAME_WIDTH:
                    spans.append((start, end))
                start, gap = None, 0
    spans = split_merged(spans, counts, expected)
    frames = []
    for x0, x1 in spans:
        frame = section.crop((x0, 0, x1, h))
        bbox = frame.getbbox()
        if bbox:
            frames.append(clean(frame.crop(bbox)))
    return frames, spans


def clean(frame):
    """Tira pixels soltos (sujeira de compressão) e suaviza a borda do recorte."""
    alpha = frame.getchannel("A")
    # pixel isolado (vizinhança quase vazia) vira transparente
    neighbours = alpha.filter(ImageFilter.BoxBlur(1))
    alpha = Image.eval(Image.merge("LA", (alpha, neighbours)).getchannel("L"), lambda v: v)
    a = alpha.load()
    n = neighbours.load()
    w, h = frame.size
    for y in range(h):
        for x in range(w):
            if a[x, y] and n[x, y] < 70:
                a[x, y] = 0
    frame.putalpha(alpha)
    bbox = frame.getbbox()
    return frame.crop(bbox) if bbox else frame


def main():
    debug = "--debug" in sys.argv
    sheet = Image.open(SOURCE).convert("RGB")

    animations, all_frames = {}, []
    preview = sheet.convert("RGBA") if debug else None
    draw = ImageDraw.Draw(preview) if debug else None

    for name, box, expected in SECTIONS:
        section = cut_section(sheet, box)
        frames, spans = split_frames(section, expected)
        status = "ok" if len(frames) == expected else f"ATENÇÃO: esperava {expected}"
        print(f"{name:11s} {len(frames)} quadros  {status}")
        animations[name] = list(range(len(all_frames), len(all_frames) + len(frames)))
        all_frames.extend(frames)
        if debug:
            draw.rectangle(box, outline=(255, 0, 0))
            for x0, x1 in spans:
                draw.rectangle((box[0] + x0, box[1], box[0] + x1, box[3]), outline=(0, 255, 0))

    extra = Image.open(EXTRA_SOURCE).convert("RGB")
    for name, boxes in EXTRA_SECTIONS:
        frames = [cut_by_flood_fill(extra, box) for box in boxes]
        # a 2ª imagem é maior: deixa no mesmo tamanho dos quadros da 1ª
        ref = max(all_frames[i].height for i in animations["parado"])
        scale = ref / max(f.height for f in frames) * (0.9 if name == "rugindo" else 0.75)
        frames = [f.resize((max(1, round(f.width * scale)), max(1, round(f.height * scale))), Image.NEAREST) for f in frames]
        print(f"{name:11s} {len(frames)} quadros  (2ª imagem)")
        animations[name] = list(range(len(all_frames), len(all_frames) + len(frames)))
        all_frames.extend(frames)

    cell_w = max(f.width for f in all_frames) + CELL_PADDING * 2
    cell_h = max(f.height for f in all_frames) + CELL_PADDING * 2
    rows = (len(all_frames) + GRID_COLUMNS - 1) // GRID_COLUMNS
    out = Image.new("RGBA", (cell_w * GRID_COLUMNS, cell_h * rows), (0, 0, 0, 0))
    for i, frame in enumerate(all_frames):
        cx = (i % GRID_COLUMNS) * cell_w
        cy = (i // GRID_COLUMNS) * cell_h
        # centro na horizontal, pés na base da célula
        out.paste(frame, (cx + (cell_w - frame.width) // 2, cy + cell_h - CELL_PADDING - frame.height), frame)

    out.save(FOLDER / "urso_animacoes.png")
    meta = {"frameWidth": cell_w, "frameHeight": cell_h, "facesRight": True, "animations": animations}
    (FOLDER / "urso_animacoes.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print(f"folha: {out.size}, quadro {cell_w}x{cell_h}, {len(all_frames)} quadros")
    # Imagem da abertura da fase 4 ("THE BEAR ATTACKS"): só tira o fundo
    intro = Image.open(INTRO_SOURCE).convert("RGB")
    cut = cut_by_flood_fill(intro, (0, 0, intro.width, intro.height))
    cut.save(FOLDER / "urso_intro.png")
    print(f"abertura: {cut.size}")

    if debug:
        preview.save(FOLDER / "_preview_recortes.png")


if __name__ == "__main__":
    main()
