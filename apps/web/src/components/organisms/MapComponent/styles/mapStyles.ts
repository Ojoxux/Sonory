/**
 * Mapboxのカスタムスタイル定義
 *
 * Mapbox Standard Styleを補完するための設定
 */

import type { LightingConfig } from "../utils/sunCalculations"

/**
 * 地形データソースの設定
 */
export const terrainSource = {
   type: "raster-dem" as const,
   url: "mapbox://mapbox.mapbox-terrain-dem-v1",
   tileSize: 512,
   maxzoom: 10, // 最大ズームレベルを下げて高速化
   minzoom: 0,
}

/**
 * 3D地形の設定
 */
export function get3DTerrainConfig(): Record<string, unknown> {
   return {
      source: "mapbox-dem",
      exaggeration: 1.0, // 地形の誇張を控えめ
   }
}

/**
 * 環境光の設定を取得
 */
export function getAtmosphereConfig(
   lighting: LightingConfig,
): Record<string, unknown> {
   return {
      "star-intensity": 0.0, // 星を無効化して軽量化
      "space-color": lighting.ambientColor,
      "horizon-color": lighting.fogColor,
      "fog-color": lighting.fogColor,
      "fog-ground-blend": 0.5,
   }
}

/**
 * 夜間の照明効果を適用
 */
export function applyNightLighting(
   _map: mapboxgl.Map,
   sunAltitudeOrTimeBasedValue: number,
): void {
   // 最小限の処理のみ実行
   const _IS_NIGHT = sunAltitudeOrTimeBasedValue < 0
   // Standard Styleが自動的に夜間の照明を処理するため、
   // 追加のカスタマイズは実装しない
}
