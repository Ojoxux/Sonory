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
import type {
  LocationData,
  MapboxExtendedMap,
  MapboxNonStandardMethods,
  MapboxSetStyleOptions,
} from '../type'
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
 * 現在時刻から適切な lightPreset を決定
 * LocationDisplayコンポーネントの時間帯判定ロジックを参考
 *
 * 正常なマッピング: 昼間='day', 夜間='night'
 * 夕方の時間帯をより細かく制御
 * 朝の時間帯も細分化して自然な色合いに調整
 */
function getLightPresetFromTime(
  debugTimeOverride: number | null,
): 'day' | 'dawn' | 'dusk' | 'night' {
  // デバッグ時間オーバーライドがある場合はそれを使用、なければ現在時刻
  const hour =
    debugTimeOverride !== null ? debugTimeOverride : new Date().getHours()

  // 昼の時間帯（8時から17時）→ 明るい空が必要
  if (hour >= 8 && hour < 17) {
    return 'day' // 正常: 昼間に明るい空を表示
  }

  // 夕方の時間帯（17時から22時）→ 夕方らしい色合い
  if (hour >= 17 && hour < 19) {
    return 'dusk' // 夕方初期: オレンジ系の空
  }

  if (hour >= 19 && hour < 22) {
    return 'dusk' // 夕方後期: より暗めの夕焼け空
  }

  // 夜の時間帯（22時から4時）→ 暗い空が必要
  if (hour >= 22 || hour < 4) {
    return 'night' // 正常: 夜間に暗い空を表示
  }

  // 早朝の時間帯（4時から6時）→ 暗めの朝焼け（夜に近い）
  if (hour >= 4 && hour < 6) {
    return 'night' // 早朝は夜に近い暗さを維持
  }

  // 朝の時間帯（6時から8時）→ 自然な朝の光（オレンジ過ぎない）
  if (hour >= 6 && hour < 8) {
    return 'dawn' // より自然な明るい空（オレンジ系を避ける）
  }

  // デフォルト（念のため）
  return 'dawn'
}

/**
 * Mapbox Standard Style の lightPreset を直接設定する関数
 * 複数の方法を試して、最も確実な方法を使用
 */
function setMapboxLightPreset(
  map: mapboxgl.Map,
  lightPreset: 'day' | 'dawn' | 'dusk' | 'night',
): void {
  try {
    // MapboxExtendedMapとして型安全に扱う
    const extendedMap = map as MapboxExtendedMap

    // Method 1: setConfigProperty を使用（最も直接的）
    if (
      'setConfigProperty' in extendedMap &&
      typeof extendedMap.setConfigProperty === 'function'
    ) {
      extendedMap.setConfigProperty('basemap', 'lightPreset', lightPreset)
      return
    }

    // Method 2: setStyle の config オプションを使用（フォールバック）
    const currentStyle = map.getStyle()
    if (currentStyle) {
      const setStyleOptions: MapboxSetStyleOptions = {
        config: {
          basemap: {
            lightPreset: lightPreset,
            showPlaceLabels: true,
            showPointOfInterestLabels: true,
            showRoadLabels: true,
            showTransitLabels: true,
          },
        },
      }

      // setStyleの型定義を拡張して呼び出し
      const mapWithSetStyle = map as mapboxgl.Map & {
        setStyle(style: string, options?: MapboxSetStyleOptions): mapboxgl.Map
      }
      mapWithSetStyle.setStyle(
        'mapbox://styles/mapbox/standard',
        setStyleOptions,
      )
      return
    }

    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ すべてのlightPreset設定方法が失敗しました')
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ lightPreset設定エラー:', error)
    }

    // 最後の手段: スタイル全体をリロード
    try {
      map.setStyle('mapbox://styles/mapbox/standard')
      setTimeout(() => {
        const extendedMap = map as MapboxExtendedMap
        if (
          'setConfigProperty' in extendedMap &&
          typeof extendedMap.setConfigProperty === 'function'
        ) {
          extendedMap.setConfigProperty('basemap', 'lightPreset', lightPreset)
        }
      }, 1000)
    } catch (reloadError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ スタイルリロードも失敗:', reloadError)
      }
    }
  }
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
      if (!targetMap || !mapStyleLoaded) return

      try {
        // 現在時刻を取得（デバッグモード時はオーバーライド）
        const now = new Date()
        if (debugTimeOverride !== null) {
          now.setHours(debugTimeOverride, 0, 0, 0)
        }

        const currentHour =
          debugTimeOverride !== null ? debugTimeOverride : now.getHours()

        // 時間ベースでlightPresetを決定
        const lightPreset = getLightPresetFromTime(debugTimeOverride)

        if (process.env.NODE_ENV === 'development') {
          console.log('🌅 時間ベースのライティング設定:', {
            currentHour,
            lightPreset,
            isDebugMode: debugTimeOverride !== null,
          })
        }

        // Mapbox Standard Style の lightPreset を設定
        setMapboxLightPreset(targetMap, lightPreset)

        // 時間ベースでの夜間判定（太陽高度ではなく時間で判定）
        const isNightTime = currentHour >= 22 || currentHour < 4
        const isDayTime = currentHour >= 8 && currentHour < 17
        const isEveningTime = currentHour >= 17 && currentHour < 22 // 夕方
        const isEarlyMorningTime = currentHour >= 4 && currentHour < 6 // 早朝（暗め）
        const isMorningTime = currentHour >= 6 && currentHour < 8 // 朝（明るめ）

        // 太陽の位置を計算（ライティング設定用のみ）
        let sunAltitude: number
        if (isDayTime) {
          sunAltitude = 45 // 昼間: 高い太陽
        } else if (isNightTime) {
          sunAltitude = -20 // 夜間: 地平線下
        } else if (isEveningTime) {
          // 夕方: 時間に応じて太陽高度を調整（17時=5度、22時=-5度）
          const eveningProgress = (currentHour - 17) / 5 // 0-1の範囲
          sunAltitude = 5 - eveningProgress * 10 // 5度から-5度へ
        } else if (isEarlyMorningTime) {
          // 早朝: 時間に応じて太陽高度を調整（4時=-10度、6時=-5度）
          const earlyMorningProgress = (currentHour - 4) / 2 // 0-1の範囲
          sunAltitude = -10 + earlyMorningProgress * 5 // -10度から-5度へ（暗め維持）
        } else if (isMorningTime) {
          // 朝: 時間に応じて太陽高度を調整（6時=-5度、8時=10度）
          const morningProgress = (currentHour - 6) / 2 // 0-1の範囲
          sunAltitude = -5 + morningProgress * 15 // -5度から10度へ（柔らかい朝の光）
        } else {
          sunAltitude = 0 // デフォルト
        }

        if (position && process.env.NODE_ENV === 'development') {
          const sunPosition = calculateSunPosition(
            now,
            position.latitude,
            position.longitude,
          )
          // 実際の太陽高度は参考程度に使用
          console.log(
            '📍 実際の太陽高度 (参考):',
            sunPosition.altitude,
            '使用値:',
            sunAltitude,
          )
        }

        // 時間帯に応じたライティング設定を取得
        const lighting = getLightingConfig(sunAltitude)

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

        // 環境光を設定（Standard Style と併用）
        const atmosphereConfig = getAtmosphereConfig(weatherAdjustedLighting)
        const fogConfig = {
          ...atmosphereConfig,
          range: [0.5, 10],
          color: weatherAdjustedLighting.fogColor,
          'horizon-blend': weatherAdjustedLighting.fogDensity * 0.5,
        }
        mapboxHelpers.setFog(targetMap, fogConfig)

        // 時間ベースで夜間の照明効果を適用
        applyNightLighting(targetMap, isNightTime ? -20 : 45) // 時間ベースの値を渡す

        if (process.env.NODE_ENV === 'development') {
          console.log('ライティング更新完了:', {
            lightPreset,
            hour: currentHour,
            isNightTime,
            isDayTime,
          })
        }
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
    if (!map || !mapStyleLoaded) return

    // 初回更新
    updateLightingAndShadows(map)

    // 1分ごとに更新
    const interval = setInterval(() => {
      updateLightingAndShadows(map)
    }, 60000)

    return () => clearInterval(interval)
  }, [map, mapStyleLoaded, updateLightingAndShadows])

  // デバッグ時間が変更された時に即座に更新
  useEffect(() => {
    if (!map || !mapStyleLoaded) return

    if (process.env.NODE_ENV === 'development') {
      console.log('デバッグ時間が変更されました:', debugTimeOverride)
    }
    // 少し遅延を入れてスタイル更新の競合を避ける
    setTimeout(() => {
      updateLightingAndShadows(map)
    }, 200)
  }, [debugTimeOverride, map, mapStyleLoaded, updateLightingAndShadows])

  return {
    currentLighting,
    updateLightingAndShadows,
  }
}
