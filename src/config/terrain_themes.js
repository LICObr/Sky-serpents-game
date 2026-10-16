/**
 * terrain_themes.js
 * -----------------------------------------------------------------------------
 * Aparência do terreno de cada fase:
 *   - TOP_TEXTURE      bloco de grama/neve (topo do chão e das rampas)
 *   - FILL_TEXTURE     bloco de terra (interior dos morros)
 *   - PLATFORM_TEXTURE ilha flutuante na cor do tema
 *   - WEATHER          lista de efeitos de clima (veja weather_effect.js)
 * -----------------------------------------------------------------------------
 */
const TerrainThemeId = Object.freeze({
  MEADOW: 'MEADOW',
  ICE: 'ICE',
  MYSTIC: 'MYSTIC',
  JUNGLE_ICE: 'JUNGLE_ICE'
});

/** Tipos de clima. */
const WeatherType = Object.freeze({
  EMBERS: 'EMBERS',     // brasas/vaga-lumes subindo
  SNOW: 'SNOW',         // flocos de neve caindo
  SPARKLES: 'SPARKLES', // brilhos mágicos piscando
  LIGHT_SNOW: 'LIGHT_SNOW', // poucos flocos de neve
  FOG: 'FOG'            // bancos de neblina passando devagar
});

const TERRAIN_THEMES = deepFreeze({
  [TerrainThemeId.MEADOW]: {
    TOP_TEXTURE: 'chao', FILL_TEXTURE: 'terra', PLATFORM_TEXTURE: 'platform',
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
  }
});
