# Sky Serpents Supremo

Jogo de plataforma 2D em pixel art, feito com [Phaser 3](https://phaser.io) (JavaScript puro, sem build).
Escolha o **Guerreiro** (espada) ou a **Arqueira** (arco), atravesse cada fase e derrote o chefão no final.

No menu principal:
- **1 jogador**: escolha o personagem e a fase.
- **2 jogadores**: Guerreiro e Arqueira na mesma tela, cada um com as suas teclas. Um não avança sem o outro: ninguém sai da tela. Cuidado com o parceiro: espada, flechas e especiais acertam ele também (o escudinho segura). Quem fica sem corações cai deitado e fica fora — mas o parceiro pode **agachar em cima dele** (com pelo menos 2 corações) para doar um coração e ele volta. O game over só vem com os dois fora.
- **Opções**: troque as teclas do jogador 1 e do jogador 2.

![Luta contra a Abelha Rainha](docs/screenshots/fase5_rainha.jpg)

## Como rodar

O jogo precisa de um servidor local (abrindo o `index.html` direto, o navegador bloqueia o carregamento das imagens e dos arquivos `.json`).

Na pasta do jogo:

```bash
python -m http.server 8000
```

(no Windows também funciona `py -m http.server 8000`; ou use a extensão **Live Server** do VS Code)

Depois abra <http://localhost:8000> no navegador.

## Controles

| Ação | Teclado | Celular / mouse |
| --- | --- | --- |
| Andar | ← → ou A D | analógico (encoste na parte esquerda da tela) |
| Pular | ↑ ou W | analógico para cima |
| Agachar (escudinho: segura 1 golpe, recarrega em 8 s) | ↓ ou S | analógico para baixo |
| Atacar | Espaço ou K | botão **ESPAÇO** |
| Especial | G ou L | botão **G** |
| Pausar | P | botão **II** |
| Reiniciar a fase | R (pede confirmação) | pela pausa |
| Voltar ao menu | ESC (pede confirmação) | pela pausa |

Essas são as teclas padrão: jogando sozinho valem as do jogador 1 (WASD, Espaço, G) e as do
jogador 2 (setas, K, L); com 2 jogadores cada um usa só as suas. Dá para trocar em **Opções**, no menu
principal (a escolha fica guardada no navegador; os padrões estão em `src/config/controls.js`).

O jogo também pausa sozinho quando a janela perde o foco (trocar de aba, minimizar).

## Fases

| Fase | Nome | Chefão |
| --- | --- | --- |
| 1 | Tutorial | — (as teclas aparecem na tela e cada bicho novo é apresentado; termina na bandeira) |
| 2 | Campos de Fogo | Dragão Vermelho |
| 3 | Pico Congelado | Serpente Glacial |
| 4 | Santuário Místico | Dragão Rosa Místico |
| 5 | Selva Gelada | Urso Polar |
| 6 | Floresta do Mel | Colmeia → Abelha Rainha |
| 7 | Montanha da Selva | Filhote de Águia (chama a mamãe) |
| 8 | Caverna Profunda | — (pedras caindo do teto; termina na bandeira) |
| 9 | Pântano dos Jacarés | — (lagoas para nadar, lama e vitórias-régias; termina na bandeira) |
| 10 | Costa da Tempestade | — (de noite: chuva, relâmpagos que iluminam o tornado, raios no chão e vento; termina na bandeira) |

O número da fase no jogo é a posição dela em `src/levels/levels.js` (o arquivo `level_01.js` aparece como Fase 2). O `NUMBER` de cada fase só identifica o progresso guardado.

**Moedas:** cada bicho derrotado tem 30% de chance de deixar uma moeda. O total fica guardado no navegador e aparece no canto superior direito (no jogo e no menu).

**Estrelas:** o relógio no topo da tela conta o tempo da fase (a pausa não conta). Terminando rápido você ganha até 3 estrelas — os tempos de cada fase ficam em `STAR_TIMES`, no arquivo dela. Na escolha de fase, as fases concluídas ganham um check verde e mostram as estrelas e o recorde.

## Estrutura do projeto

```
index.html          carrega o Phaser e os scripts (a ordem importa)
src/
  config/           configurações: personagens, bichos, chefões, terrenos, dificuldade
  levels/           as FASES, uma por arquivo (level_01.js ... level_05.js) + a lista da campanha
  core/             base do jogo: entidades, combate, eventos, controles
  player/           jogador (knight/ = guerreiro, archer/ = arqueira)
  enemies/          bichos pequenos
  bosses/           chefões, cada um na sua pasta (dragon/, serpent/, bear/, hive/, bee/)
  items/            poções e moedas
  projectiles/      projéteis dos chefões
  ui/               interface (HUD, menus, telas, controles de toque)
  world/            cenário (mapa, fundo, clima, música)
  scenes/           carregamento, menu principal, opções, personagem, escolha de fase, fase e pausa
assets/             tudo o que o jogo carrega (imagens, sons, folhas de animação)
source_art/         artes ORIGINAIS usadas pelas ferramentas (o jogo não carrega daqui)
tools/              scripts Python que geram as imagens de assets/ a partir de source_art/
docs/screenshots/   capturas de tela
```

As fases são **dados**: o código das regras (física, combate, chefões) é o mesmo para todas, e cada fase só descreve o terreno, os bichos e o chefão. É o mesmo jeito que os jogos profissionais separam conteúdo de código.

### Criar uma fase nova

1. Copie um arquivo de `src/levels/` (ex.: `level_05.js` → `level_06.js`) e troque o nome da constante (`LEVEL_06`), o `NUMBER` e o conteúdo.
2. Adicione `LEVEL_06` na lista de `src/levels/levels.js`.
3. Adicione `<script src="src/levels/level_06.js"></script>` no `index.html`, antes de `levels.js`.

O formato de cada campo está explicado em `src/levels/level_helpers.js`.

### Ajustar os chefões

A vida de cada chefão é o `MAX_HP` em `src/config/boss_types.js` (é a vida real, sem multiplicador).
Referência: cada golpe de espada tira 15 e cada flecha tira 12.

## Ferramentas (`tools/`)

Precisam de Python 3 e da biblioteca Pillow (`pip install pillow`). Exemplos:

```bash
python tools/boss_intros.py
```

| Script | O que gera |
| --- | --- |
| `favicon.py` | ícones da aba do navegador e do atalho no celular |
| `boss_intros.py` | imagens de abertura dos dragões e da serpente |
| `bee_boss_sprites.py` | colmeia (cenário + recorte), animação da Abelha Rainha, mel |
| `coin_sprite.py` | a moeda |
| `honey_background.py` / `honey_terrain.py` | fundo infinito, terreno e árvores amarelas da Floresta do Mel |
| `tall_jungle_background.py` / `moss_terrain.py` | árvores altíssimas do fundo e chão de musgo com neve da Montanha da Selva |
| `eaglet_boss_sprites.py` | filhote de águia (3 poses), ninho vazio da arena, minhoca e graveto |
| `eagle_variants.py` | as 5 águias diferentes (bico de lança, dourada, rabo de leque, asa larga, negra) |
| `cave_background.py` / `cave_terrain.py` / `cave_creatures.py` | fundo infinito da caverna (arte espelhada), chão de pedra e os bichos da caverna |
| `castle_background.py` | fundos dos castelos (espelhados): o vale padrão e as versões com o céu dourado e de entardecer da luta com os dragões, o pôr do sol com neve (Serpente), os castelos congelados (Urso) e a costa na tempestade, com a versão iluminada pelo relâmpago |
| `walk_frames.py` | caminhada (um passo de cada vez) e as poses de pulo e queda dos personagens |
| `meadow_trees.py` | árvores do campo (sem neve) do tutorial |
| `swamp_background.py` / `swamp_terrain.py` / `swamp_creatures.py` | fundo infinito do pântano, chão de musgo e lama, os bichos do pântano (sapos, jacarés, tartaruga, piranha, poraquê, garça, sanguessuga...), vitórias-régias e lama |
| `jungle_background.py` | antigo fundo da Selva Gelada (não é mais usado: agora ela usa os castelos na neve) |
| `dragon_sheet.py`, `bear_sheet.py`, `bear_retouch.py` | folhas de animação dos chefões |
| `storm_terrain.py` | chão verde bem escuro (quase preto) da Costa da Tempestade |
| `snow_terrain.py` | chão, terra e ilhas todos brancos (neve) da fase do Urso |
| `bear_polish.py` | acerto final do Urso Polar: todos os quadros do mesmo tamanho, com os pés na mesma linha e o corpo centralizado |
| `creature_sprites.py`, `dragon_variants.py`, `terrain_variants.py`, `archer_from_image.py` | bichos, cores e personagens |

## Licença

Todos os direitos reservados. Veja [LICENSE](LICENSE).
