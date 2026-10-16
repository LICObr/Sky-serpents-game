"""
bear_retouch.py
-----------------------------------------------------------------------------
RETOQUE da folha do Urso Polar (urso_animacoes.png), no estilo da imagem de
abertura (urso_intro.png), mantendo TODOS os quadros:

  1. paleta: as cores de cada quadro são trocadas pelas cores da imagem de
     abertura (brancos frios, azuis claros, azul de sombra, azul-marinho);
  2. traços no corpo: realce das dobras do pelo (nitidez), que viram
     pequenos traços azuis depois da troca de paleta;
  3. contorno: 1 pixel azul-marinho em volta de todo o urso;
  4. focinho e olho: o ponto mais à frente da cabeça ganha nariz escuro e
     o olho um brilho, para o rosto ficar mais "lido".

    py tools/bear_retouch.py            # retoca a folha (guarda o original)
    py tools/bear_retouch.py --preview  # só gera a prévia antes/depois
-----------------------------------------------------------------------------
"""
import json
import sys
from pathlib import Path
from PIL import Image, ImageFilter

FOLDER = Path(__file__).resolve().parent.parent / "assets" / "chefoes" / "urso_polar"
SHEET = FOLDER / "urso_animacoes.png"
ORIGINAL = Path(__file__).resolve().parent.parent / "source_art" / "chefoes" / "urso_polar" / "urso_animacoes_sem_retoque.png"
META = FOLDER / "urso_animacoes.json"
INTRO = FOLDER / "urso_intro.png"

PALETTE_SIZE = 10
OUTLINE = (24, 32, 72, 255)
NOSE = (22, 26, 52, 255)
SHARPEN = ImageFilter.UnsharpMask(radius=1.2, percent=140, threshold=2)
# Animações em que o urso está de lado (onde dá para achar o focinho)
SIDE_VIEW = ["parado", "andando", "correndo", "batendo", "pulando", "impacto", "derrapando",
             "agachado", "levantando", "atacando", "rugindo"]


def intro_palette():
    """As cores principais da imagem de abertura."""
    intro = Image.open(INTRO).convert("RGBA")
    solid = Image.new("RGB", intro.size, (255, 255, 255))
    solid.paste(intro, mask=intro.getchannel("A"))
    pixels = [p for p, a in zip(solid.getdata(), intro.getchannel("A").getdata()) if a > 200]
    sample = Image.new("RGB", (len(pixels), 1))
    sample.putdata(pixels)
    quant = sample.quantize(PALETTE_SIZE, method=Image.Quantize.MEDIANCUT)
    return quant


def retouch(frame, palette, side_view):
    alpha = frame.getchannel("A").point(lambda a: 255 if a > 100 else 0)
    rgb = Image.new("RGB", frame.size, (255, 255, 255))
    rgb.paste(frame.convert("RGB"), mask=alpha)
    rgb = rgb.filter(SHARPEN)
    rgb = rgb.quantize(palette=palette, dither=Image.Dither.NONE).convert("RGB")

    out = rgb.convert("RGBA")
    out.putalpha(alpha)
    px = out.load()
    a = alpha.load()
    w, h = out.size

    # contorno: pixel do urso que encosta no transparente
    edge = [(x, y) for y in range(h) for x in range(w)
            if a[x, y] and any(not (0 <= x + dx < w and 0 <= y + dy < h) or not a[x + dx, y + dy]
                               for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))]
    for x, y in edge:
        px[x, y] = OUTLINE

    if side_view:
        add_face(px, a, w, h)
    return out


def add_face(px, a, w, h):
    """Nariz escuro na ponta do focinho (pixel mais à direita da metade de cima)."""
    best = None
    for y in range(h // 2):
        for x in range(w - 1, -1, -1):
            if a[x, y]:
                if best is None or x > best[0]:
                    best = (x, y)
                break
    if not best:
        return
    nx, ny = best
    for dx, dy in ((0, 0), (-1, 0), (0, 1), (-1, 1)):
        x, y = nx + dx, ny + dy
        if 0 <= x < w and 0 <= y < h and a[x, y]:
            px[x, y] = NOSE


def main():
    preview_only = "--preview" in sys.argv
    meta = json.loads(META.read_text(encoding="utf-8"))
    fw, fh = meta["frameWidth"], meta["frameHeight"]
    source = Image.open(ORIGINAL if ORIGINAL.exists() else SHEET).convert("RGBA")
    if not ORIGINAL.exists() and not preview_only:
        source.save(ORIGINAL)

    palette = intro_palette()
    side = {i for name in SIDE_VIEW for i in meta["animations"].get(name, [])}
    columns = source.width // fw
    count = sum(len(v) for v in meta["animations"].values())

    out = Image.new("RGBA", source.size, (0, 0, 0, 0))
    for i in range(count):
        box = ((i % columns) * fw, (i // columns) * fh, (i % columns) * fw + fw, (i // columns) * fh + fh)
        out.paste(retouch(source.crop(box), palette, i in side), box[:2])

    if preview_only:
        pick = [0, 9, 17, 25, 33, 41, 57, 75, 107]
        prev = Image.new("RGBA", (fw * len(pick), fh * 2), (40, 70, 50, 255))
        for j, i in enumerate(pick):
            box = ((i % columns) * fw, (i // columns) * fh, (i % columns) * fw + fw, (i // columns) * fh + fh)
            a, b = source.crop(box), out.crop(box)
            prev.paste(a, (j * fw, 0), a)
            prev.paste(b, (j * fw, fh), b)
        prev = prev.resize((prev.width * 2, prev.height * 2), Image.NEAREST)
        prev.save(sys.argv[sys.argv.index("--preview") + 1] if len(sys.argv) > sys.argv.index("--preview") + 1 else ORIGINAL.parent / "_preview_retoque.png")
        return
    out.save(SHEET)
    print("folha retocada:", SHEET.name, "(original em", ORIGINAL.name + ")")


if __name__ == "__main__":
    main()
