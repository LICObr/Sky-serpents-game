/**
 * match_config.js
 * -----------------------------------------------------------------------------
 * Configuração de UMA partida: junta personagem + fase + dificuldade e
 * entrega os valores finais já calculados:
 *   - dificuldade do MENU  → vidas e frequência de poções
 *   - progressão da FASE   → velocidade/tiros do chefão e velocidade dos bichos
 *     (a VIDA do chefão é a de boss_types.js, sem multiplicador)
 *
 * As classes do jogo recebem um MatchConfig e não precisam saber como os
 * multiplicadores funcionam.
 * -----------------------------------------------------------------------------
 */
class MatchConfig {
  #characterId;
  #levelIndex;
  #difficultyId;
  #boss; // estatísticas do chefão já ajustadas (calculadas uma vez)

  /**
   * @param {{characterId?: string, levelIndex?: number, difficultyId?: string}} options
   */
  constructor({ characterId = CharacterId.KNIGHT, levelIndex = 0, difficultyId = DEFAULT_DIFFICULTY } = {}) {
    if (!CHARACTERS[characterId]) throw new RangeError(`Personagem inválido: ${characterId}`);
    if (!LEVELS[levelIndex]) throw new RangeError(`Fase inválida: ${levelIndex}`);
    if (!DIFFICULTIES[difficultyId]) throw new RangeError(`Dificuldade inválida: ${difficultyId}`);

    this.#characterId = characterId;
    this.#levelIndex = levelIndex;
    this.#difficultyId = difficultyId;
    this.#boss = this.level.ARENA
      ? MatchConfig.#scaleBoss(BOSS_TYPES[this.level.ARENA.BOSS], this.level.CHALLENGE)
      : null; // fase ainda sem chefão (termina na bandeira de chegada)
  }

  get character()        { return CHARACTERS[this.#characterId]; }
  get level()            { return LEVELS[this.#levelIndex]; }
  get levelIndex()       { return this.#levelIndex; }
  get difficulty()       { return DIFFICULTIES[this.#difficultyId]; }
  get boss()             { return this.#boss; } // o (primeiro) chefão da arena
  get hasBoss()          { return this.#boss !== null; }
  get playerHearts()     { return this.difficulty.PLAYER_HEARTS; }
  get potionDelayMs()    { return this.difficulty.POTION_DELAY_MS; }

  get hasNextLevel() {
    return this.#levelIndex + 1 < LEVELS.length;
  }

  /** Dificuldade própria da fase (força dos bichos e do chefão). */
  get challenge() { return this.level.CHALLENGE; }

  /** Vida de um bicho: sempre a mesma em qualquer fase (só muda de bicho para bicho). */
  enemyHp(baseHp) {
    return baseHp;
  }

  /** Estatísticas de QUALQUER chefão ajustadas à fase (ex.: o próximo de uma luta em etapas). */
  bossStats(typeId) {
    return MatchConfig.#scaleBoss(BOSS_TYPES[typeId], this.challenge);
  }

  /** Velocidade de um inimigo comum ajustada à dificuldade da fase. */
  enemySpeed(baseSpeed) {
    return baseSpeed * this.challenge.ENEMY_SPEED;
  }

  /** Dados para iniciar a cena (ex.: scene.start('GameScene', data)). */
  toSceneData() {
    return {
      characterId: this.#characterId,
      levelIndex: this.#levelIndex,
      difficultyId: this.#difficultyId
    };
  }

  /** Mesma personagem e dificuldade, próxima fase. */
  nextLevel() {
    return new MatchConfig({ ...this.toSceneData(), levelIndex: this.#levelIndex + 1 });
  }

  /** Aplica os multiplicadores da dificuldade DA FASE sobre o chefão base (a vida não muda). */
  static #scaleBoss(base, challenge) {
    const stats = { ...base, SPEED: base.SPEED * challenge.BOSS_SPEED };
    // (a colmeia não atira: não tem SHOT nem SPECIAL)
    if (base.SHOT) {
      stats.SHOT = {
        ...base.SHOT,
        CHANCE_PERCENT: base.SHOT.CHANCE_PERCENT * challenge.SHOT_CHANCE,
        SPEED: base.SHOT.SPEED * challenge.PROJECTILE_SPEED
      };
    }
    if (base.SPECIAL) {
      stats.SPECIAL = {
        ...base.SPECIAL,
        SPEED: base.SPECIAL.SPEED * challenge.PROJECTILE_SPEED,
        INTERVAL_MS: base.SPECIAL.INTERVAL_MS * challenge.SPECIAL_INTERVAL
      };
    }
    return deepFreeze(stats);
  }
}
