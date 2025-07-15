/**
 * マップ環境効果管理フック
 *
 * @description
 * 時間帯に応じたライティング、天候効果、影の描画など
 * マップの環境表現を統合管理する（パフォーマンス最適化版）
 *
 * @param map Mapboxマップインスタンス
 * @param debugTimeOverride デバッグ用時間オーバーライド
 * @returns 環境効果の状態と制御関数
 */

import type mapboxgl from "mapbox-gl"
import { useCallback, useEffect, useState, useRef } from "react"
import {
   applyNightLighting,
   get3DTerrainConfig,
   getAtmosphereConfig,
   terrainSource,
} from "../styles/mapStyles"
import type {
   LocationData,
   MapboxExtendedMap,
   MapboxNonStandardMethods,
   MapboxSetStyleOptions,
} from "../type"
import {
   type LightingConfig,
   type WeatherEffects,
   applyWeatherEffects,
   calculateSunPosition,
   defaultWeather,
   getLightingConfig,
} from "../utils/sunCalculations"

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
   currentLighting: LightingConfig
   /** ライティングと影を手動更新する関数 */
   updateLightingAndShadows: (mapInstance?: mapboxgl.Map) => void
}

/**
 * 現在の天候データ（デフォルト）
 */
const currentWeather: WeatherEffects = defaultWeather

/**
 * 時間からlightPresetを決定する関数
 */
function getLightPresetFromTime(
   debugTimeOverride: number | null,
): "day" | "dawn" | "dusk" | "night" {
   const currentHour =
      debugTimeOverride !== null
         ? debugTimeOverride
         : new Date().getHours()

   if (currentHour >= 8 && currentHour < 17) {
      return "day"
   }
   if (currentHour >= 22 || currentHour < 4) {
      return "night"
   }
   if (currentHour >= 17 && currentHour < 22) {
      return "dusk"
   }
   return "dawn"
}

/**
 * Mapbox Standard Style の lightPreset を設定する関数（簡略化版）
 */
function setMapboxLightPreset(
   map: mapboxgl.Map,
   lightPreset: "day" | "dawn" | "dusk" | "night",
): void {
   try {
      // スタイルが完全に読み込まれているかチェック
      if (!map.isStyleLoaded()) {
         return
      }

      // MapboxExtendedMapとして型安全に扱う
      const extendedMap = map as MapboxExtendedMap

      // Method 1: setConfigProperty を使用（最も直接的）
      if (
         "setConfigProperty" in extendedMap &&
         typeof extendedMap.setConfigProperty === "function"
      ) {
         extendedMap.setConfigProperty("basemap", "lightPreset", lightPreset)
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

         const mapWithSetStyle = map as mapboxgl.Map & {
            setStyle(
               style: string,
               options?: MapboxSetStyleOptions,
            ): mapboxgl.Map
         }
         mapWithSetStyle.setStyle(
            "mapbox://styles/mapbox/standard",
            setStyleOptions,
         )
      }
   } catch (error) {
      // エラーを無視して続行
                  }
               }

export function useMapEnvironment({
   map,
   mapStyleLoaded,
   position,
   debugTimeOverride,
   mapboxHelpers,
}: UseMapLightingProps): UseMapLightingReturn {
   const [currentLighting, setCurrentLighting] = useState<LightingConfig>({
      sunIntensity: 1.0,
      ambientIntensity: 0.6,
      sunColor: "#ffffff",
      ambientColor: "#87ceeb",
      fogColor: "#f0f8ff",
      fogDensity: 0.1,
      shadowIntensity: 0.4,
   })

   // 3D地形の初期化状態を追跡
   const terrainInitializedRef = useRef(false)
   // 前回の更新時刻を追跡（頻繁な更新を避ける）
   const lastUpdateRef = useRef(0)

   const updateLightingAndShadows = useCallback(
      (mapInstance?: mapboxgl.Map): void => {
         const targetMap = mapInstance || map
         if (!targetMap || !mapStyleLoaded) return

         // 頻繁な更新を避ける（最低5秒間隔）
         const now = Date.now()
         if (now - lastUpdateRef.current < 5000) {
            return
         }
         lastUpdateRef.current = now

         try {
            // 現在時刻を取得（デバッグモード時はオーバーライド）
            const currentTime = new Date()
            if (debugTimeOverride !== null) {
               currentTime.setHours(debugTimeOverride, 0, 0, 0)
            }

            const currentHour =
               debugTimeOverride !== null ? debugTimeOverride : currentTime.getHours()

            // 時間ベースでlightPresetを決定
            const lightPreset = getLightPresetFromTime(debugTimeOverride)

            // Mapbox Standard Style の lightPreset を設定
            setMapboxLightPreset(targetMap, lightPreset)

            // 太陽の位置を計算（ライティング設定用のみ）
            let sunAltitude: number
             if (position) {
                const sunPosition = calculateSunPosition(
                   currentTime,
                  position.latitude,
                  position.longitude,
               )
                sunAltitude = sunPosition.altitude
             } else {
                // デフォルトの太陽高度（時間ベース）
                sunAltitude = currentHour >= 6 && currentHour < 18 ? 45 : -20
            }

             // ライティング設定を取得
            const lighting = getLightingConfig(sunAltitude)

            // 天候効果を適用
            const weatherAdjustedLighting = applyWeatherEffects(
               lighting,
               currentWeather,
            )

            // 状態を更新
            setCurrentLighting(weatherAdjustedLighting)

            // 3D地形を設定（初回のみ）
            if (!terrainInitializedRef.current) {
            try {
               if (!targetMap.getSource("mapbox-dem")) {
                     targetMap.addSource("mapbox-dem", {
                        type: "raster-dem",
                        url: "mapbox://mapbox.mapbox-terrain-dem-v1",
                        tileSize: 512,
                        maxzoom: 12, // 詳細度を下げて高速化
                     })
                  }
                  
                  // 簡略化された地形設定
                  const terrainConfig = {
                     source: "mapbox-dem",
                     exaggeration: 1.2, // 固定値で高速化
               }
               mapboxHelpers.setTerrain(targetMap, terrainConfig)
                  terrainInitializedRef.current = true
            } catch (terrainError) {
                  // 地形設定エラーを無視
               }
            }

            // 環境光を設定（簡略化）
            try {
               const fogConfig = {
                  range: [0.8, 12],
                  color: weatherAdjustedLighting.fogColor,
                  "horizon-blend": 0.1,
               }
               mapboxHelpers.setFog(targetMap, fogConfig)
            } catch (fogError) {
               // フォグ設定エラーを無視
            }

            // 時間ベースで夜間の照明効果を適用
            try {
               const isNightTime = currentHour >= 22 || currentHour < 4
               applyNightLighting(targetMap, isNightTime ? -20 : 45)
            } catch (lightingError) {
               // 照明設定エラーを無視
            }
         } catch (error) {
            console.error("光と影の更新エラー:", error)
         }
      },
      [
         map,
         mapStyleLoaded,
         position,
         debugTimeOverride,
         mapboxHelpers,
      ],
   )

   // 定期的に光と影を更新（頻度を下げる）
   useEffect(() => {
      if (!map || !mapStyleLoaded) return

      // スタイルが完全に読み込まれるまで待機
      const checkStyleAndUpdate = () => {
         if (map.isStyleLoaded()) {
            updateLightingAndShadows(map)
         } else {
            setTimeout(checkStyleAndUpdate, 200)
         }
      }

      // 初回更新（遅延実行）
      setTimeout(checkStyleAndUpdate, 500)

      // 5分ごとに更新（頻度を下げる）
      const interval = setInterval(() => {
         if (map.isStyleLoaded()) {
            updateLightingAndShadows(map)
         }
      }, 5 * 60 * 1000)

      return () => clearInterval(interval)
   }, [map, mapStyleLoaded, updateLightingAndShadows])

   // デバッグ時間が変更された時に即座に更新
   useEffect(() => {
      if (!map || !mapStyleLoaded) return

      const updateWithStyleCheck = () => {
         if (map.isStyleLoaded()) {
            updateLightingAndShadows(map)
         } else {
            setTimeout(updateWithStyleCheck, 200)
         }
      }

      setTimeout(updateWithStyleCheck, 1000)
   }, [map, mapStyleLoaded, updateLightingAndShadows])

   return {
      currentLighting,
      updateLightingAndShadows,
   }
}
