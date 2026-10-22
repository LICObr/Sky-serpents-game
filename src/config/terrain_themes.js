/**
 * terrain_themes.js
 * -----------------------------------------------------------------------------
 * Aparência do terreno de cada fase:
 *   - TOP_TEXTURE      bloco de grama/neve (topo do chão e das rampas)
 *   - FILL_TEXTURE     bloco de terra (interior dos morros)
 *   - PLATFORM_TEXTURE ilha flutuante na cor do tema
 *   - TREE_TEXTURES    (opcional) árvores quebráveis [inteira, rachada];
 *                      sem ele, usa as de GameSettings.TREE
 *   - SNOW             (opcional) { TOP_TEXTURE, FROM_ELEVATION }: do alto
 *                      dessa elevação para cima o topo do chão é de neve
 *   - WEATHER          lista de efeitos de clima (veja weather_effect.js)
 * -----------------------------------------------------------------------------
 */
const TerrainThemeId = Object.freeze({
  MEADOW: 'MEADOW',
  ICE: 'ICE',
  MYSTIC: 'MYSTIC',
  JUNGLE_ICE: 'JUNGLE_ICE',
  HONEY: 'HONEY',
  MOSS: 'MOSS',
  CAVE: 'CAVE',
  SWAMP: 'SWAMP',
  SNOW: 'SNOW'
});

/** Tipos de clima. */
const WeatherType = Object.freeze({
  EMBERS: 'EMBERS',     // brasas/vaga-lumes subindo
  SNOW: 'SNOW',         // flocos de neve caindo
  SPARKLES: 'SPARKLES', // brilhos mágicos piscando
  LIGHT_SNOW: 'LIGHT_SNOW', // poucos flocos de neve
  FOG: 'FOG',           // bancos de neblina passando devagar
  POLLEN: 'POLLEN',     // pólen dourado flutuando
  FIREFLIES: 'FIREFLIES' // vaga-lumes verde-água (como os cogumelos do pântano)
});

const TERRAIN_THEMES = deepFreeze({
  [TerrainThemeId.MEADOW]: {
    TOP_TEXTURE: 'chao', FILL_TEXTURE: 'terra', PLATFORM_TEXTURE: 'platform',
    TREE_TEXTURES: ['arvore_campo_0', 'arvore_campo_1'], // sem neve (tools/meadow_trees.py)
    WEATHER: [WeatherType.EMBERS]
  },
  [TerrainThemeId.ICE]: {
    TOP_TEXTURE: 'chao_gelo', FILL_TEXTURE: 'terra_gelo', PLATFORM_TEXTURE: 'platform_gelo',
    WEATHER: [WeatherType.SNOW]
  },
  [TerrainThemeId.MYSTIC]: {
    TOP_TEXTURE: 'chao_rosa', FILL_TEXTURE: 'terra_rosa', PLATFORM_TEXTURE: 'platform_rosa',
    WEATHER: [WeatherType.SPARKLES]
  },
  // Selva gelada: musgo com neve, neve fraca e neblina
  [TerrainThemeId.JUNGLE_ICE]: {
    TOP_TEXTURE: 'chao_selva', FILL_TEXTURE: 'terra_selva', PLATFORM_TEXTURE: 'platform_selva',
    WEATHER: [WeatherType.LIGHT_SNOW, WeatherType.FOG]
  },
  // Floresta do mel: grama verde-amarelada com mel no lugar da neve
  [TerrainThemeId.HONEY]: {
    TOP_TEXTURE: 'chao_mel', FILL_TEXTURE: 'terra_mel', PLATFORM_TEXTURE: 'platform_mel',
    TREE_TEXTURES: ['arvore_mel_0', 'arvore_mel_1'],   // árvores amarelas
    WEATHER: [WeatherType.POLLEN]
  },
  // Montanha da selva: grama cor de musgo bem falhada e neve no alto da montanha
  [TerrainThemeId.MOSS]: {
    TOP_TEXTURE: 'chao_musgo', FILL_TEXTURE: 'terra', PLATFORM_TEXTURE: 'platform_musgo',
    SNOW: { TOP_TEXTURE: 'chao_neve', FROM_ELEVATION: 640 },
    WEATHER: [WeatherType.FOG, WeatherType.LIGHT_SNOW]
  },
  // Caverna: chão de pedra com musgo, brilhos de cristal e névoa
  [TerrainThemeId.CAVE]: {
    TOP_TEXTURE: 'chao_caverna', FILL_TEXTURE: 'terra_caverna', PLATFORM_TEXTURE: 'platform_caverna',
    WEATHER: [WeatherType.SPARKLES, WeatherType.FOG]
  },
  // Neve por todo lado (fase do Urso): chão, terra e ilhas brancos, nevando forte
  [TerrainThemeId.SNOW]: {
    TOP_TEXTURE: 'chao_branco', FILL_TEXTURE: 'terra_branca', PLATFORM_TEXTURE: 'platform_branca',
    WEATHER: [WeatherType.SNOW, WeatherType.FOG]
  },
  // Pântano: musgo encharcado sobre lama, neblina e vaga-lumes verde-água
  [TerrainThemeId.SWAMP]: {
    TOP_TEXTURE: 'chao_pantano', FILL_TEXTURE: 'terra_pantano', PLATFORM_TEXTURE: 'platform_pantano',
    WEATHER: [WeatherType.FOG, WeatherType.FIREFLIES]
  }
});
