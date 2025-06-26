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
 * Mapbox Standard Style の lightPreset を設定する関数
 */
function setMapboxLightPreset(
  map: mapboxgl.Map,
  lightPreset: 'day' | 'dawn' | 'dusk' | 'night',
): void {
  try {
    // スタイルが完全に読み込まれているかチェック
    if (!map.isStyleLoaded()) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          '⚠️ スタイルがまだ読み込み中です。lightPreset設定をスキップします。',
        )
      }
      return
    }

    // MapboxExtendedMapとして型安全に扱う
    const extendedMap = map as MapboxExtendedMap

    // Method 1: setConfigProperty を使用（最も直接的）
    if (
      'setConfigProperty' in extendedMap &&
      typeof extendedMap.setConfigProperty === 'function'
    ) {
      // スタイルが完全に読み込まれてから設定
      extendedMap.setConfigProperty('basemap', 'lightPreset', lightPreset)

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ lightPreset設定成功:', lightPreset)
      }
      return
    }

    // Method 2: setStyle の config オプションを使用（フォールバック）
    const currentStyle = map.getStyle()
    if (currentStyle) {
      // 録音データを保存
      const recordingData = localStorage.getItem('recording_data')

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

      // 録音データを復元
      if (recordingData) {
        localStorage.setItem('recording_data', recordingData)
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ lightPreset設定成功 (setStyle方式):', lightPreset)
      }
      return
    }

    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ すべてのlightPreset設定方法が失敗しました')
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ lightPreset設定エラー:', error)
    }

    // 最後の手段: スタイル全体をリロード（遅延実行）
    try {
      // 録音データを保存
      const recordingData = localStorage.getItem('recording_data')

      setTimeout(() => {
        if (map.isStyleLoaded()) {
          const extendedMap = map as MapboxExtendedMap
          if (
            'setConfigProperty' in extendedMap &&
            typeof extendedMap.setConfigProperty === 'function'
          ) {
            extendedMap.setConfigProperty('basemap', 'lightPreset', lightPreset)

            // 録音データを復元
            if (recordingData) {
              localStorage.setItem('recording_data', recordingData)
            }
          }
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

      // スタイルが完全に読み込まれているかチェック
      if (!targetMap.isStyleLoaded()) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            '⚠️ スタイルがまだ読み込み中です。ライティング更新をスキップします。',
          )
        }
        return
      }

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

        // 録音データを保存
        const recordingData = localStorage.getItem('recording_data')

        // 1. Mapbox Standard Styleのlightプリセットを設定
        setMapboxLightPreset(targetMap, lightPreset)

        // 位置情報がある場合は太陽位置を計算してライティングを調整
        let lightingConfig: LightingConfig | null = null

        if (position) {
          // 太陽の位置を計算
          const sunPosition = calculateSunPosition(
            now,
            position.latitude,
            position.longitude,
          )

          // 時間ベースでの夜間判定
          const isNightTime = currentHour >= 22 || currentHour < 4

          // 太陽位置に基づくライティング設定を取得
          lightingConfig = getLightingConfig(sunPosition.altitude)

          // ライティング設定を適用
          if (lightingConfig) {
            // 夜間はカスタムライティングを適用
            if (isNightTime) {
              applyNightLighting(targetMap, -20) // 夜間の値
            } else {
              // 昼間はMapbox標準のライティングを使用
              // 特に追加設定は不要
            }

            // 天候効果を適用
            const weatherAdjustedLighting = applyWeatherEffects(
              lightingConfig,
              currentWeather,
            )

            // 霧効果を適用
            mapboxHelpers.setFog(targetMap, {
              color: weatherAdjustedLighting.fogColor,
              'horizon-blend': weatherAdjustedLighting.fogDensity,
            })

            // 3Dテレインを設定
            // テレインソースを追加
            if (!targetMap.getSource('mapbox-dem')) {
              targetMap.addSource('mapbox-dem', terrainSource)
            }

            // テレインを設定
            mapboxHelpers.setTerrain(targetMap, get3DTerrainConfig())

            // 大気効果を設定
            mapboxHelpers.setFog(
              targetMap,
              getAtmosphereConfig(weatherAdjustedLighting),
            )

            // 現在のライティング設定を状態に保存
            setCurrentLighting(weatherAdjustedLighting)
          }
        }

        // 録音データを復元
        if (recordingData) {
          localStorage.setItem('recording_data', recordingData)
        }
      } catch (error) {
        console.error('ライティング更新エラー:', error)
      }
    },
    [
      map,
      mapStyleLoaded,
      position,
      debugTimeOverride,
      mapboxHelpers,
      currentWeather,
    ],
  )

  // 位置情報、時間、マップスタイルが変更されたときにライティングを更新
  useEffect(() => {
    // マップと位置情報が揃ったらライティングを更新
    if (map && mapStyleLoaded) {
      const checkStyleAndUpdate = () => {
        if (map.isStyleLoaded()) {
          updateLightingAndShadows(map)
        } else {
          // スタイルがまだ読み込まれていない場合は少し待ってから再試行
          setTimeout(checkStyleAndUpdate, 200)
        }
      }

      checkStyleAndUpdate()
    }
  }, [
    map,
    mapStyleLoaded,
    position,
    debugTimeOverride,
    updateLightingAndShadows,
  ])

  return {
    currentLighting,
    updateLightingAndShadows,
  }
}
