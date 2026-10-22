/**
 * level_helpers.js
 * -----------------------------------------------------------------------------
 * FORMATO de uma fase (cada fase fica no seu arquivo: level_01.js, level_02.js...)
 * e os atalhos usados para listar os bichos. Cada fase é um percurso com
 * rolagem lateral:
 *   - GROUND:      trechos de chão [inícioX, largura, elevação]
 *                  elevação 0 = chão normal; > 0 = morro (sobe em px)
 *                  Os espaços sem chão nem rampa são BURACOS (cair = perder
 *                  um coração e voltar ao checkpoint).
 *   - RAMPS:       subidas/descidas [inícioX, largura, elevaçãoInicial, elevaçãoFinal]
 *                  (máximo 4px de altura a cada 8px de largura)
 *   - PLATFORMS:   ilhas flutuantes [x, y] (atravessáveis por baixo)
 *   - ENEMIES:     bichos pequenos { TYPE, X, Y? } (quem anda nasce no chão)
 *   - RANDOM_ENEMIES: bichos EXTRAS sorteados a cada partida:
 *       WALKERS/FLYERS → tipos e quantidade espalhados pelo percurso
 *       SPECIALS       → bichos raros com quantidade própria (ex.: águia)
 *       WAVES          → de tempos em tempos surge um bicho à frente do
 *                        jogador (até um limite de bichos perto da câmera)
 *   - POTIONS:     poções de vida [x, y]
 *   - CHECKPOINTS: pontos de renascimento (x)
 *   - FALLING_ROCKS: (opcional) pedras caindo do teto durante a fase inteira
 *                  (veja world/falling_rocks.js e a fase 7)
 *   - WATER:       (opcional) LAGOAS [inícioX, largura, elevaçãoDaSuperfície?]
 *                  no lugar de um buraco (entre dois trechos de chão): quem cai
 *                  NADA (veja world/swamp_zones.js e a fase 8). Superfície
 *                  padrão na elevação 40 — deixe as margens um pouco acima
 *                  (ex.: 64) para dar para sair pulando.
 *   - LILY_PADS:   (opcional) vitórias-régias [x, x, ...] sobre as lagoas:
 *                  plataformas que afundam se alguém ficar em cima
 *   - MUD:         (opcional) faixas de LAMA [inícioX, largura]: andar lento
 *                  e pulo mais baixo
 *   - bichos de água (jacarés, cobra-d'água): o X precisa estar sobre uma lagoa
 *   - STORM:       (opcional) tempestade: chuva, escuridão, relâmpagos e vento
 *                  (veja world/thunderstorm.js e a fase 10, level_09.js)
 *   - TUTORIAL:    (opcional) dicas com as teclas e cartões dos bichos (veja
 *                  ui/tutorial_guide.js e level_tutorial.js)
 *   - STAR_TIMES:  tempo máximo (segundos) para ganhar 3, 2 e 1 estrela
 *                  { THREE, TWO, ONE }; mais lento que ONE → nenhuma
 *   - ARENA:       tela final com o CHEFÃO (plataformas em coordenadas
 *                  relativas ao início da arena)
 *   - CHALLENGE:   progressão da fase (multiplicadores sobre a velocidade e os
 *                  tiros do CHEFÃO e a velocidade dos bichos), subindo aos poucos
 *                  de uma fase para a outra. A VIDA não muda: a dos bichos fica
 *                  em enemy_types.js e a dos chefões em boss_types.js.
 *
 * Medidas úteis para criar fases (com a física atual):
 *   - montanha mais alta que a tela? Pode: o mundo e a câmera sobem junto
 *     (veja a fase 6; ilhas e bichos acima da tela usam y negativo)
 *   - o pulo alcança ~100px de altura e ~85px de distância
 *   - paredões de até ~64px dão para subir pulando
 *   - chão nível 0 fica em y = 540; uma ilha em y = (topo do chão - 70)
 *     dá para alcançar pulando
 *
 * Para criar uma fase nova:
 *   1. copie um level_XX.js, troque o nome da constante (LEVEL_08...) e o NUMBER
 *      (NUMBER só identifica o progresso guardado; o número que aparece no
 *      jogo é a posição na lista de levels.js)
 *   2. adicione a constante na lista de levels.js
 *   3. adicione o <script> do arquivo no index.html (antes de levels.js)
 * -----------------------------------------------------------------------------
 */

/** Atalhos para deixar as listas de inimigos mais legíveis. */
const walker = (type, x) => ({ TYPE: type, X: x });
const flyer = (type, x, y) => ({ TYPE: type, X: x, Y: y });
const walkers = (type, xs) => xs.map(x => walker(type, x));
const flyers = (type, points) => points.map(([x, y]) => flyer(type, x, y));
