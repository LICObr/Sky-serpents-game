"""
eagle_variants.py
-----------------------------------------------------------------------------
Gera as VARIAÇÕES da águia (fase 6) a partir do desenho da águia original
(creature_sprites.py): outras cores, bico mais pontudo, rabo em leque.
Cada variação tem os mesmos quadros da original: voo (2), mergulho e chão (2).

  aguia_lanca_*    bico comprido e pontudo, azul-acinzentada
  aguia_dourada_*  dourada
  aguia_leque_*    rabo grande em leque, avermelhada
  aguia_larga_*    escura (no jogo ela é maior e mergulha de asas abertas)
  aguia_negra_*    preta com brilho roxo

    py tools/eagle_variants.py
-----------------------------------------------------------------------------
"""
from creature_sprites import EAGLE_DIVE, EAGLE_FLY, EAGLE_GROUND, OUT_DIR, parse, render

FOLDER = OUT_DIR / "inimigos" / "aguia"

# Cores de cada variação: O = corpo, C = asa clara, c = contorno/rabo, W = cabeça, Z = bico e pés
COLORS = {
    "lanca":   {"O": (96, 112, 138, 255), "C": (140, 160, 186, 255), "c": (52, 60, 78, 255), "Z": (236, 150, 40, 255)},
    "dourada": {"O": (200, 150, 40, 255), "C": (244, 204, 92, 255), "c": (122, 82, 20, 255)},
    "leque":   {"O": (156, 64, 44, 255), "C": (214, 112, 70, 255), "c": (90, 30, 24, 255)},
    "larga":   {"O": (70, 72, 84, 255), "C": (120, 122, 138, 255), "c": (36, 36, 46, 255)},
    "negra":   {"O": (40, 34, 56, 255), "C": (92, 70, 132, 255), "c": (20, 16, 30, 255),
                "W": (206, 196, 232, 255), "Z": (255, 204, 60, 255)},
}


def pointy_beak(art):
    """Bico comprido: a linha do bico (começa com Z colado na cabeça) ganha mais 2 'pixels'."""
    rows = parse(art)
    out = []
    for row in rows:
        stripped = row.lstrip(".")
        is_beak = stripped.startswith("Z") and "W" in stripped[:5]
        out.append("ZZ" + row.replace(".", "Z", len(row) - len(stripped)) if is_beak else ".." + row)
    return "\n".join(out)


def fan_tail(art):
    """Rabo em leque: as linhas do rabo (terminam em 'c' na ponta direita) ganham penas claras."""
    rows = parse(art)
    width = len(rows[0])
    tail_rows = [i for i, row in enumerate(rows) if row.rstrip(".") and len(row.rstrip(".")) >= width - 2
                 and row.rstrip(".")[-1] == "c" and "O" in row]
    out = []
    for i, row in enumerate(rows):
        if i in tail_rows:
            out.append(row.rstrip(".").ljust(width, "c") + "CCc")
        elif tail_rows and (i == tail_rows[0] - 1 or i == tail_rows[-1] + 1):
            out.append(row + ".Cc")  # pontas do leque, em cima e embaixo
        else:
            out.append(row + "...")
    return "\n".join(out)


def frames(name, shape=lambda art: art):
    """Todos os quadros de uma variação."""
    colors = COLORS[name]
    sprites = {f"aguia_{name}_{i}.png": render(shape(frame), palette_overrides=colors) for i, frame in enumerate(EAGLE_FLY)}
    sprites[f"aguia_{name}_mergulho.png"] = render(shape(EAGLE_DIVE), palette_overrides=colors)
    for i, frame in enumerate(EAGLE_GROUND):
        sprites[f"aguia_{name}_chao_{i}.png"] = render(shape(frame), palette_overrides=colors)
    return sprites


if __name__ == "__main__":
    FOLDER.mkdir(parents=True, exist_ok=True)
    sprites = {
        **frames("lanca", pointy_beak),
        **frames("dourada"),
        **frames("leque", fan_tail),
        **frames("larga"),
        **frames("negra"),
    }
    for filename, image in sprites.items():
        image.save(FOLDER / filename)
    print("gerado:", len(sprites), "imagens em", FOLDER)
