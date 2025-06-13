/**
 * マップ環境効果管理フック
 *
 * @description
 * 時間帯に応じたライティング、天候効果、影の描画など
 * マップの環境表現を統合管理する
 *
 * @param map Mapboxマップインスタンス
 * @param debugTimeOverride デバッグ用時間オーバーライド
 * @returns 環境効果の状態と制御関数
 */

import mapboxgl from 'mapbox-gl'
import { useCallback, useEffect, useState } from 'react'
import {
  applyNightLighting,
  get3DTerrainConfig,
  getAtmosphereConfig,
  terrainSource,
} from '../styles/mapStyles'
import type { LocationData, MapboxNonStandardMethods } from '../type'
import {
  type LightingConfig,
  type WeatherEffects,
  applyWeatherEffects,
  calculateSunPosition,
  defaultWeather,
  getLightingConfig,
} from '../utils/sunCalculations'

export type UseMapLightingProps = {
  /** Mapboxマップインスタンス */
  map: mapboxgl.Map | null
  /** マップスタイルの読み込み状態 */
  mapStyleLoaded: boolean
  /** ユーザーの位置情報 */
  position: LocationData | null
  /** デバッグ時間のオーバーライド値 */
  debugTimeOverride: number | null
  /** Mapboxの非標準メソッドヘルパー */
  mapboxHelpers: MapboxNonStandardMethods
}

export type UseMapLightingReturn = {
  /** 現在のライティング設定 */
  currentLighting: LightingConfig | null
  /** ライティングと影を更新する関数 */
  updateLightingAndShadows: (mapInstance?: mapboxgl.Map) => void
}

/**
 * マップライティング管理フック
 */
export function useMapEnvironment({
  map,
  mapStyleLoaded,
  position,
  debugTimeOverride,
  mapboxHelpers,
}: UseMapLightingProps): UseMapLightingReturn {
  const [currentLighting, setCurrentLighting] = useState<LightingConfig | null>(
    null,
  )
  const [currentWeather] = useState<WeatherEffects>(defaultWeather)

  /**
   * 光と影を更新する関数
   */
  const updateLightingAndShadows = useCallback(
    (mapInstance?: mapboxgl.Map): void => {
      const targetMap = mapInstance || map
      if (!targetMap || !mapStyleLoaded || !position) return

      try {
        // 現在時刻を取得（デバッグモード時はオーバーライド）
        const now = new Date()
        if (debugTimeOverride !== null) {
          now.setHours(debugTimeOverride, 0, 0, 0)
        }

        // 太陽の位置を計算
        const sunPosition = calculateSunPosition(
          now,
          position.latitude,
          position.longitude,
        )

        // ライティング設定を取得
        const lighting = getLightingConfig(sunPosition.altitude)

        // 天候効果を適用
        const weatherAdjustedLighting = applyWeatherEffects(
          lighting,
          currentWeather,
        )
        setCurrentLighting(weatherAdjustedLighting)

        // 3D地形を設定
        const terrainConfig = get3DTerrainConfig()
        if (!targetMap.getSource('mapbox-dem')) {
          targetMap.addSource('mapbox-dem', terrainSource)
        }
        mapboxHelpers.setTerrain(targetMap, terrainConfig)

        // 環境光を設定
        const atmosphereConfig = getAtmosphereConfig(weatherAdjustedLighting)
        const fogConfig = {
          ...atmosphereConfig,
          range: [0.5, 10],
          color: weatherAdjustedLighting.fogColor,
          'horizon-blend': weatherAdjustedLighting.fogDensity * 0.5,
        }
        mapboxHelpers.setFog(targetMap, fogConfig)

        // 夜間の照明効果を適用
        applyNightLighting(targetMap, sunPosition.altitude)
      } catch (error) {
        console.error('光と影の更新エラー:', error)
      }
    },
    [
      map,
      mapStyleLoaded,
      position,
      currentWeather,
      debugTimeOverride,
      mapboxHelpers,
    ],
  )

  // 定期的に光と影を更新
  useEffect(() => {
    if (!map || !mapStyleLoaded || !position) return

    // 初回更新
    updateLightingAndShadows(map)

    // 1分ごとに更新
    const interval = setInterval(() => {
      updateLightingAndShadows(map)
    }, 60000)

    return () => clearInterval(interval)
  }, [map, mapStyleLoaded, position, updateLightingAndShadows])

  return {
    currentLighting,
    updateLightingAndShadows,
  }
}
