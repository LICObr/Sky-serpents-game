/**
 * levels.js
 * -----------------------------------------------------------------------------
 * Lista da CAMPANHA, na ordem em que as fases são jogadas. Cada fase fica no
 * seu próprio arquivo (level_01.js, level_02.js...) e entra aqui.
 * Fases que estão na lista aparecem liberadas na tela de escolha de fase.
 *
 * O número que aparece no jogo ("FASE 1", "FASE 2"...) é a POSIÇÃO na lista:
 * o tutorial é a Fase 1, level_01.js aparece como Fase 2, e assim por diante.
 * O NUMBER de cada fase é só o identificador do progresso guardado (estrelas
 * e recorde) — ele não muda, para ninguém perder o que já conquistou.
 * -----------------------------------------------------------------------------
 */
const LEVELS = deepFreeze([
  LEVEL_TUTORIAL,
  LEVEL_01,
  LEVEL_02,
  LEVEL_03,
  LEVEL_04,
  LEVEL_05,
  LEVEL_06,
  LEVEL_07,
  LEVEL_08,
  LEVEL_09
]);
