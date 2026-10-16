/**
 * difficulties.js
 * -----------------------------------------------------------------------------
 * Dificuldade da partida: define quantas VIDAS (corações) o jogador tem e de
 * quanto em quanto tempo (sorteado) surgem poções na arena do chefão.
 *
 * Por enquanto não há escolha no menu: todo mundo joga no PADRÃO
 * (DEFAULT_DIFFICULTY = 5 corações). As outras ficam prontas para o futuro.
 *
 * A força dos bichos e dos chefões NÃO depende daqui: cada fase tem a sua
 * própria dificuldade (CHALLENGE no arquivo da fase). Assim a fase 1 é sempre a
 * mais fácil e a 3 a mais difícil, seja qual for a quantidade de vidas.
 * -----------------------------------------------------------------------------
 */
const DifficultyId = Object.freeze({
  EASY: 'EASY',
  NORMAL: 'NORMAL',
  HARD: 'HARD'
});

const DIFFICULTIES = deepFreeze({
  [DifficultyId.EASY]: {
    ID: DifficultyId.EASY,
    NAME: 'Padrão',
    PLAYER_HEARTS: 5,
    POTION_DELAY_MS: { MIN: 12000, MAX: 20000 } // poção na arena: tempo sorteado
  },
  [DifficultyId.NORMAL]: {
    ID: DifficultyId.NORMAL,
    NAME: 'Normal',
    PLAYER_HEARTS: 3,
    POTION_DELAY_MS: { MIN: 18000, MAX: 30000 }
  },
  [DifficultyId.HARD]: {
    ID: DifficultyId.HARD,
    NAME: 'Difícil',
    PLAYER_HEARTS: 2,
    POTION_DELAY_MS: { MIN: 25000, MAX: 40000 }
  }
});

/** Dificuldade usada por padrão (5 corações). */
const DEFAULT_DIFFICULTY = DifficultyId.EASY;
