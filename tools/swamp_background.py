"""
swamp_background.py
-----------------------------------------------------------------------------
Gera o fundo da fase PÂNTANO (assets/cenario/fundo_pantano.png) a partir da
arte original (source_art/cenario/pantano_original.jpg), espelhada ao lado
para o fundo ficar INFINITO (igual ao da caverna).

    py tools/swamp_background.py
-----------------------------------------------------------------------------
"""
from cave_background import ROOT, mirror_background

if __name__ == "__main__":
    mirror_background(ROOT / "source_art" / "cenario" / "pantano_original.jpg",
                      ROOT / "assets" / "cenario" / "fundo_pantano.png")
