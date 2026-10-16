"""
dragon_sheet.py
-----------------------------------------------------------------------------
Separa a SPRITE SHEET do dragão (assets/chefoes/dragao_vermelho/dragao_sheet.png)
em quadros e monta uma folha uniforme que o Phaser entende:

  1. cada uma das 12 seções da sheet (voando p/ cima, ataque, morrendo...)
     é recortada sem o título e sem os números;
  2. os quadros de cada seção são separados pelas colunas vazias entre eles;
  3. o fundo semitransparente (lixo de cor com alfa baixo) é limpo;
  4. todos os quadros vão para células do mesmo tamanho, alinhados pelo
     centro (horizontal) e pela base (vertical);
  5. gera também a versão ROSA (Dragão Rosa Místico) girando a matiz.

Saída (em cada pasta de chefão):
  dragao_animacoes.png  → folha com todos os quadros (grade)
  dragao_animacoes.json → tamanho do quadro e quais quadros cada animação usa

    py tools/dragon_sheet.py            # gera as folhas
    py tools/dragon_sheet.py --debug    # também salva uma prévia com os recortes
-----------------------------------------------------------------------------
"""
import colorsys
import json
import sys
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent / "assets" / "chefoes"
SOURCE = ROOT / "dragao_vermelho" / "dragao_sheet.png"
OUTPUTS = {
    # pasta: rotação de matiz (0 = cores originais)
    "dragao_vermelho": 0,
    "dragao_rosa": 310,
}

ALPHA_SOLID = 110      # alfa mínimo para um pixel ser "desenho" (e não fundo)
COLUMN_GAP = 3         # colunas vazias que separam dois quadros
MIN_FRAME_WIDTH = 18   # ignora sujeirinhas estreitas
CELL_PADDING = 4
GRID_COLUMNS = 8

# Seções da sheet: nome no jogo, retângulo dos desenhos (x0, y0, x1, y1)
# — já sem o título em cima e sem os números embaixo — e quadros esperados.
COLUMNS = [(12, 652), (660, 1312)]
ROWS = [(30, 184), (250, 398), (462, 608), (673, 818), (886, 1002), (1062, 1169)]
SECTIONS = [
    ("subindo",      0, 0, 5),   # 1. voando para cima
    ("descendo",     1, 0, 6),   # 2. voando para baixo
    ("de_costas",    0, 1, 6),   # 3. de costas (voando)
    ("de_frente",    1, 1, 6),   # 4. de frente (voando)
    ("virando",      0, 2, 8),   # 5. virando (perfil -> frente)
    ("girando",      1, 2, 8),   # 6. girando 360 (vista de cima)
    ("aproximando",  0, 3, 6),   # 7. voando para frente (aproximação)
    ("planando",     1, 3, 6),   # 8. planando
    ("ataque",       0, 4, 5),   # 9. ataque (sopro de fogo) — o 6º é só fumaça
    ("impulso",      1, 4, 7),   # 10. pulo / impulso
    ("morrendo",     0, 5, 6),   # 11. morrendo
    ("parado",       1, 5, 6),   # 12. idle (parado)
]


def solid_columns(alpha, x0, y0, x1, y1):
    """Quantos pixels sólidos existem em cada coluna da seção."""
    return [sum(1 for y in range(y0, y1) if alpha[x, y] > ALPHA_SOLID) for x in range(x0, x1)]


def split_frames(alpha, rect):
    """Separa os quadros de uma seção pelas colunas vazias entre eles."""
    x0, y0, x1, y1 = rect
    counts = solid_columns(alpha, x0, y0, x1, y1)
    frames, start, empty = [], None, 0
    for i, count in enumerate(counts + [0] * (COLUMN_GAP + 1)):
        if count > 0:
            if start is None:
                start = i
            empty = 0
            end = i
        elif start is not None:
            empty += 1
            if empty >= COLUMN_GAP:
                if end - start + 1 >= MIN_FRAME_WIDTH:
                    frames.append((x0 + start, x0 + end + 1))
                start, empty = None, 0
    return frames


def split_touching(alpha, rect, ranges, expected):
    """
    Quando dois quadros vizinhos se encostam (asas coladas), eles saem como
    um bloco só. Enquanto faltar quadro, divide o bloco mais largo na coluna
    com menos pixels desenhados, procurando só na parte do meio do bloco.
    """
    _, y0, _, y1 = rect
    ranges = list(ranges)
    while len(ranges) < expected:
        widest = max(ranges, key=lambda r: r[1] - r[0])
        x0, x1 = widest
        margin = (x1 - x0) // 4
        counts = solid_columns(alpha, x0 + margin, y0, x1 - margin, y1)
        cut = x0 + margin + counts.index(min(counts))
        index = ranges.index(widest)
        ranges[index:index + 1] = [(x0, cut), (cut, x1)]
    return ranges


def crop_frame(img, alpha, x_range, rect):
    """Recorta um quadro (só a parte desenhada) e limpa o fundo semitransparente."""
    fx0, fx1 = x_range
    _, y0, _, y1 = rect
    ys = [y for y in range(y0, y1) if any(alpha[x, y] > ALPHA_SOLID for x in range(fx0, fx1))]
    frame = img.crop((fx0, min(ys), fx1, max(ys) + 1))
    px = frame.load()
    for y in range(frame.height):
        for x in range(frame.width):
            r, g, b, a = px[x, y]
            px[x, y] = (r, g, b, 0) if a < 60 else (r, g, b, 255 if a > 200 else a)
    return frame


def extract(img):
    """Lista de (nome da animação, [quadros]) a partir da sheet."""
    alpha = img.split()[3].load()
    animations = []
    for name, col, row, expected in SECTIONS:
        x0, x1 = COLUMNS[col]
        y0, y1 = ROWS[row]
        rect = (x0, y0, x1, y1)

        ranges = split_touching(alpha, rect, split_frames(alpha, rect), expected)
        if len(ranges) != expected:
            print(f"  aviso: '{name}' tem {len(ranges)} quadros (esperado {expected})")
        animations.append((name, rect, ranges, [crop_frame(img, alpha, r, rect) for r in ranges]))
    return animations


def build_atlas(animations):
    """Coloca todos os quadros em células do mesmo tamanho (grade)."""
    frames = [f for _, _, _, fs in animations for f in fs]
    cell_w = max(f.width for f in frames) + CELL_PADDING * 2
    cell_h = max(f.height for f in frames) + CELL_PADDING * 2
    rows = -(-len(frames) // GRID_COLUMNS)
    atlas = Image.new("RGBA", (cell_w * GRID_COLUMNS, cell_h * rows))

    index, info = 0, {}
    for name, _, _, frame_list in animations:
        info[name] = []
        for frame in frame_list:
            cx = (index % GRID_COLUMNS) * cell_w
            cy = (index // GRID_COLUMNS) * cell_h
            # centro na horizontal, apoiado na base da célula
            atlas.paste(frame, (cx + (cell_w - frame.width) // 2, cy + cell_h - CELL_PADDING - frame.height), frame)
            info[name].append(index)
            index += 1
    meta = {"frameWidth": cell_w, "frameHeight": cell_h, "facesRight": True, "animations": info}
    return atlas, meta


def shift_hue(image, degrees, saturation_gain=0.85):
    """Gira a matiz dos pixels coloridos (versão rosa do dragão)."""
    image = image.copy()
    px = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if s < 0.15:
                continue
            nr, ng, nb = colorsys.hsv_to_rgb((h + degrees / 360) % 1, min(s * saturation_gain, 1), v)
            px[x, y] = (int(nr * 255), int(ng * 255), int(nb * 255), a)
    return image


def save_debug(img, animations, path):
    preview = Image.new("RGBA", img.size, (120, 170, 230, 255))
    preview.alpha_composite(img)
    draw = ImageDraw.Draw(preview)
    for name, rect, ranges, _ in animations:
        for fx0, fx1 in ranges:
            draw.rectangle((fx0, rect[1], fx1, rect[3]), outline=(255, 255, 0, 255))
    preview.save(path)


def main():
    img = Image.open(SOURCE).convert("RGBA")
    animations = extract(img)
    atlas, meta = build_atlas(animations)

    for folder, hue in OUTPUTS.items():
        out_dir = ROOT / folder
        out_dir.mkdir(parents=True, exist_ok=True)
        (shift_hue(atlas, hue) if hue else atlas).save(out_dir / "dragao_animacoes.png")
        (out_dir / "dragao_animacoes.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
        print("gerado:", out_dir / "dragao_animacoes.png")

    total = sum(len(v) for v in meta["animations"].values())
    print(f"{total} quadros, célula {meta['frameWidth']}x{meta['frameHeight']}px")
    if "--debug" in sys.argv:
        save_debug(Image.open(SOURCE).convert("RGBA"), animations, ROOT / "dragao_vermelho" / "dragao_sheet_debug.png")


if __name__ == "__main__":
    main()
