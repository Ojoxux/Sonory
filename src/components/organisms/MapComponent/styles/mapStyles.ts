/**
 * Mapboxのカスタムスタイル定義
 *
 * Mapbox Standard Styleを補完するための設定
 */

import type { LightingConfig } from '../utils/sunCalculations'

/**
 * 地形データソースの設定
 */
export const terrainSource = {
  type: 'raster-dem' as const,
  url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
  tileSize: 512,
  maxzoom: 14,
}

/**
 * 3D地形の設定
 */
export function get3DTerrainConfig(): Record<string, unknown> {
  return {
    source: 'mapbox-dem',
    exaggeration: ['interpolate', ['linear'], ['zoom'], 0, 1, 15, 1.5],
  }
}

/**
 * 大気効果の設定
 */
export function getAtmosphereConfig(
  lighting: LightingConfig,
): Record<string, unknown> {
  return {
    color: lighting.fogColor,
    'high-color': lighting.ambientColor,
    'horizon-blend': lighting.fogDensity,
    'space-color': lighting.ambientColor,
    'star-intensity': lighting.sunIntensity < 0.1 ? 0.8 : 0,
  }
}

/**
 * 夜間の照明効果を適用
 * Mapbox Standard Styleの夜間モードを補完
 */
export function applyNightLighting(
  _map: mapboxgl.Map,
  sunAltitude: number,
): void {
  // Standard Styleが自動的に夜間の照明を処理するため、
  // 追加のカスタマイズは最小限に留める
  const isNight = sunAltitude < -6

  // 必要に応じて追加の夜間効果をここに実装
  console.log(`夜間モード: ${isNight ? '有効' : '無効'}`)
}
