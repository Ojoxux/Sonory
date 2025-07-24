/**
 * MapComponent統合管理フック
 *
 * @description MapComponentの主要なロジックを統合管理するカスタムフック
 * fpのエッセンス（Option/Either/TaskEither）を適用
 * @example
 * ```tsx
 * const {
 *   mapContainerRef,
 *   map,
 *   mapStyleLoaded,
 *   position,
 *   currentLighting,
 *   debugMode,
 *   pins,
 *   selectedPinId,
 *   permissionStatus,
 *   geolocateInitialized,
 *   geolocateAttempted,
 *   debugTimeOverride,
 *   selectPin,
 *   setDebugTimeOverride,
 *   updateLightingAndShadows,
 * } = useMapComponent({
 *   onGeolocationReady,
 *   onReturnToLocationReady,
 *   onBearingChange,
 * })
 * ```
 */

import { useNearbyPins } from "@/hooks/useNearbyPins"
import { useDebugStore } from "@/store/useDebugStore"
import { type SoundPin, useSoundPinStore } from "@/store/useSoundPinStore"
import type { SoundPinAPI } from "@sonory/shared-types"
import { useQueryClient } from "@tanstack/react-query"
import * as O from "fp-ts/Option"
import { pipe } from "fp-ts/function"
import mapboxgl from "mapbox-gl"
import {
   type RefObject,
   useCallback,
   useEffect,
   useMemo,
   useRef,
   useState,
} from "react"
import { useBrowserGeolocation } from "./hooks/useBrowserGeolocation"
import { useLocationIntegration } from "./hooks/useLocationIntegration"
import { useLocationStorage } from "./hooks/useLocationStorage"
import { useMapControls } from "./hooks/useMapControls"
import { useMapEnvironment } from "./hooks/useMapEnvironment"
import { useMapboxInitialization } from "./hooks/useMapboxInitialization"
import type {
   GeoJSONLineStringFeature,
   LocationData,
   MapboxExtendedMap,
   MapboxMapOptions,
   MapboxNonStandardMethods,
} from "./type"
import {
   fromNullable,
   isValidPosition,
   selectBestPosition,
} from "./utils/functional"
import type { LightingConfig } from "./utils/sunCalculations"

export interface MapBounds {
   north: number
   south: number
   east: number
   west: number
}

/**
 * APIピンをローカルピン形式に変換
 * @param apiPin - APIピン
 * @returns ローカルピン
 */
const convertApiPinToLocal = (apiPin: SoundPinAPI): SoundPin => {
   // デバッグ: APIピンの変換処理をログ出力
   if (process.env.NODE_ENV === "development") {
      console.log("🔄 Converting API pin to local format:", {
         pinId: apiPin.id,
         title: apiPin.title,
         aiTopic: apiPin.aiAnalysis?.categories?.topic,
         aiConfidence: apiPin.aiAnalysis?.categories?.confidence,
      })
   }

   // 分類結果を構築
   const classificationResults = []

   // 1. titleフィールドから分類結果を取得（最優先）
   if (
      apiPin.title &&
      apiPin.title !== "音声ピン" &&
      apiPin.title.trim() !== ""
   ) {
      classificationResults.push({
         label: apiPin.title,
         confidence: apiPin.aiAnalysis?.categories?.confidence || 0.8, // デフォルトで80%の信頼度
         category: "other" as const,
      })
   }
   // 2. aiAnalysisのtopicから分類結果を取得
   else if (
      apiPin.aiAnalysis?.categories?.topic &&
      apiPin.aiAnalysis.categories.topic !== "unknown"
   ) {
      classificationResults.push({
         label: apiPin.aiAnalysis.categories.topic,
         confidence: apiPin.aiAnalysis.categories.confidence || 0,
         category: "other" as const,
      })
   }
   // 3. どちらもない場合は「未分類」
   else {
      classificationResults.push({
         label: "未分類",
         confidence: 0,
         category: "other" as const,
      })
   }

   // primaryLabelとenvironmentを決定
   const primaryLabel =
      apiPin.title || apiPin.aiAnalysis?.categories?.topic || "音声ピン"
   const environment =
      apiPin.title || apiPin.aiAnalysis?.categories?.topic || "unknown"

   return {
      id: apiPin.id,
      latitude: apiPin.location.lat,
      longitude: apiPin.location.lng,
      audioData: {
         url: apiPin.audio.url,
         recordedAt: new Date(apiPin.createdAt),
         id: apiPin.id,
         blob: new Blob(), // APIピンのblobは空
      },
      classificationResults,
      recordedAt: new Date(apiPin.createdAt),
      primaryLabel,
      primaryConfidence: apiPin.aiAnalysis?.categories?.confidence || 0.8,
      isPersisted: true,
      timeTag: (apiPin.timeTag as "朝" | "昼" | "夕" | "夜") || undefined,
      environment,
      weather: apiPin.weather
         ? {
              temperature: apiPin.weather.temperature,
              condition: apiPin.weather.condition || "unknown",
              windSpeed: apiPin.weather.windSpeed,
              humidity: apiPin.weather.humidity,
           }
         : undefined,
   }
}

/**
 * 周辺ピンを統合するフック
 * @param bounds - マップの境界
 * @returns 統合されたピン
 */
export const useIntegratedPins = (bounds: MapBounds | null) => {
   const { pins: localPins, persistedPins, tempPins } = useSoundPinStore()

   // 周辺ピンを取得するフックを使用
   const nearbyPinsResult = useNearbyPins({
      bounds: bounds || { north: 0, south: 0, east: 0, west: 0 },
      limit: 50,
      categories: undefined,
   })

   // APIピンをローカルピン形式に変換して統合
   const allPins = useMemo(() => {
      if (!bounds) return [...localPins, ...persistedPins, ...tempPins]

      // APIピンをローカルピン形式に変換
      const convertedApiPins = nearbyPinsResult.pins.map(convertApiPinToLocal)

      // すべてのピンを統合
      const combined = [
         ...localPins,
         ...persistedPins,
         ...tempPins,
         ...convertedApiPins,
      ]

      // IDで重複を削除
      const uniquePins = combined.filter(
         (pin, index, array) =>
            array.findIndex((p) => p.id === pin.id) === index,
      )

      return uniquePins
   }, [localPins, persistedPins, tempPins, nearbyPinsResult.pins, bounds])

   return {
      pins: allPins,
      isLoading: nearbyPinsResult.isLoading && !!bounds, // Only show loading if bounds exist
      error: nearbyPinsResult.error,
      refetch: nearbyPinsResult.refetch,
   }
}

export type UseMapComponentProps = {
   /** 位置情報取得準備完了時のコールバック */
   onGeolocationReady?: (attemptGeolocation: () => void) => void
   /** 位置に戻る機能準備完了時のコールバック */
   onReturnToLocationReady?: (returnToLocation: () => void) => void
   /** マップ回転時のコールバック */
   onBearingChange?: (bearing: number) => void
}

export type UseMapComponentReturn = {
   /** マップコンテナのref */
   mapContainerRef: RefObject<HTMLDivElement | null>
   /** Mapboxマップインスタンス */
   map: mapboxgl.Map | null
   /** マップスタイルの読み込み状態 */
   mapStyleLoaded: boolean
   /** 統合された位置情報 */
   position: LocationData | null
   /** 現在のライティング設定 */
   currentLighting: LightingConfig | null
   /** デバッグモードの状態 */
   debugMode: boolean
   /** 音声ピンの配列 */
   pins: SoundPin[]
   /** 選択中のピンID */
   selectedPinId: string | null
   /** 位置情報の権限状態 */
   permissionStatus: string
   /** 位置情報取得の初期化状態 */
   geolocateInitialized: boolean
   /** 位置情報取得の試行状態 */
   geolocateAttempted: boolean
   /** デバッグ時間のオーバーライド値 */
   debugTimeOverride: number | null
   /** Mapboxから取得した位置情報かどうか */
   isMapboxPosition: boolean
   /** ピン選択関数 */
   selectPin: (pinId: string | null) => void
   /** デバッグ時間設定関数 */
   setDebugTimeOverride: (time: number | null) => void
   /** ライティング更新関数 */
   updateLightingAndShadows: () => void
}

/**
 * Mapboxの非標準メソッド用の型安全な検証（純粋関数）
 */
const supportsMethod = <T extends object>(obj: T, method: string): boolean =>
   method in obj &&
   typeof (obj as Record<string, unknown>)[method] === "function"

/**
 * Mapboxの非標準メソッドを安全に呼び出すためのヘルパー関数群（fpで安全に呼び出す）
 */
const createMapboxHelpers = (): MapboxNonStandardMethods => ({
   setConfigProperty: (map, namespace, property, value) =>
      pipe(supportsMethod(map, "setConfigProperty"), (isSupported) => {
         if (isSupported && map.isStyleLoaded()) {
            try {
               const extendedMap = map as MapboxExtendedMap
               if (extendedMap.setConfigProperty) {
                  extendedMap.setConfigProperty(namespace, property, value)
               }
            } catch (error) {
               if (process.env.NODE_ENV === "development") {
                  console.warn("⚠️ setConfigProperty実行エラー:", error)
               }
            }
         } else if (process.env.NODE_ENV === "development") {
            console.warn(
               "⚠️ setConfigProperty: スタイル未読み込みまたは非サポート",
            )
         }
      }),

   setTerrain: (map, config) =>
      pipe(supportsMethod(map, "setTerrain"), (isSupported) => {
         if (isSupported && map.isStyleLoaded()) {
            try {
               const extendedMap = map as MapboxExtendedMap
               if (extendedMap.setTerrain) {
                  extendedMap.setTerrain(config)
               }
            } catch (error) {
               if (process.env.NODE_ENV === "development") {
                  console.warn("⚠️ setTerrain実行エラー:", error)
               }
               // 他のヘルパーメソッドと統一してエラーを再スローしない
            }
         } else if (process.env.NODE_ENV === "development") {
            console.warn("⚠️ setTerrain: スタイル未読み込みまたは非サポート")
         }
      }),

   setLight: (map, config) =>
      pipe(supportsMethod(map, "setLight"), (isSupported) => {
         if (isSupported && map.isStyleLoaded()) {
            try {
               const extendedMap = map as MapboxExtendedMap
               if (extendedMap.setLight) {
                  extendedMap.setLight(config)
               }
            } catch (error) {
               if (process.env.NODE_ENV === "development") {
                  console.warn("⚠️ setLight実行エラー:", error)
               }
            }
         } else if (process.env.NODE_ENV === "development") {
            console.warn("⚠️ setLight: スタイル未読み込みまたは非サポート")
         }
      }),

   setFog: (map, config) =>
      pipe(supportsMethod(map, "setFog"), (isSupported) => {
         if (isSupported && map.isStyleLoaded()) {
            try {
               const extendedMap = map as MapboxExtendedMap
               if (extendedMap.setFog) {
                  extendedMap.setFog(config)
               }
            } catch (error) {
               if (process.env.NODE_ENV === "development") {
                  console.warn("⚠️ setFog実行エラー:", error)
               }
            }
         } else if (process.env.NODE_ENV === "development") {
            console.warn("⚠️ setFog: スタイル未読み込みまたは非サポート")
         }
      }),
})

// Mapboxヘルパーのインスタンス（イミュータブル）
const mapboxHelpers = createMapboxHelpers()

/**
 * MapComponent統合管理フック
 */
export function useMapComponent({
   onGeolocationReady,
   onReturnToLocationReady,
   onBearingChange,
}: UseMapComponentProps): UseMapComponentReturn {
   // Refs
   const mapContainerRef = useRef<HTMLDivElement | null>(null)
   const mapInitializedRef = useRef<boolean>(false)
   const geolocateControlRef = useRef<mapboxgl.GeolocateControl | null>(null)
   const hasInitialPositionSet = useRef<boolean>(false)
   const userInteractionRef = useRef<boolean>(false)
   const lastInteractionTimeRef = useRef<number>(0)
   const userInteractionHandlerRef = useRef<(() => void) | null>(null)

   // 状態管理
   const [map, setMap] = useState<mapboxgl.Map | null>(null)
   const [mapStyleLoaded, setMapStyleLoaded] = useState<boolean>(false)
   const [geolocateInitialized, setGeolocateInitialized] =
      useState<boolean>(false)
   const [mapBounds, setMapBounds] = useState<MapBounds | null>(null)

   // ストア
   const {
      debugMode,
      toggleDebugMode,
      debugTimeOverride,
      setDebugTimeOverride,
      setDebugMode,
   } = useDebugStore()

   // HACK: 初期化時にdebugModeをfalseに強制設定 (デバッグモードがデフォルトで出てしまうため)
   useEffect(() => {
      setDebugMode(false)
      if (process.env.NODE_ENV === "development") {
         console.log("[MapComponent] debugModeをfalseにリセット")
      }
   }, [])

   const { selectedPinId, selectPin, lastCreatedPinId } = useSoundPinStore()

   // TanStack Query
   const queryClient = useQueryClient()

   // カスタムフック
   const { position: customPosition, permissionStatus } =
      useBrowserGeolocation()
   const { savedPosition, savePosition, clearSavedPosition } =
      useLocationStorage()

   // React Queryで周辺ピンを取得
   const {
      pins: nearbyPins,
      isLoading: isLoadingNearbyPins,
      error: nearbyPinsError,
   } = useIntegratedPins(mapBounds)

   console.log("🔍 MapComponent: useNearbyPins呼び出し", {
      mapBounds,
      mapExists: !!map,
      mapStyleLoaded,
      enabled: !!mapBounds,
      nearbyPinsCount: nearbyPins.length,
      isLoadingNearbyPins,
      nearbyPinsError: nearbyPinsError?.message,
      mapBoundsDetail: mapBounds
         ? {
              north: mapBounds.north.toFixed(4),
              south: mapBounds.south.toFixed(4),
              east: mapBounds.east.toFixed(4),
              west: mapBounds.west.toFixed(4),
           }
         : null,
   })

   // mapBoundsの状態を詳しく監視
   console.log("🔍 MapComponent: mapBounds状態監視", {
      mapBounds,
      mapBoundsIsNull: mapBounds === null,
      mapBoundsType: typeof mapBounds,
      mapExists: !!map,
      mapStyleLoaded,
      mapLoaded: map?.loaded(),
      mapIsStyleLoaded: map?.isStyleLoaded(),
   })

   // 通知関数
   const createNotification = useCallback(
      (message: string, type: "success" | "error" | "warning") =>
         ({
            message,
            type,
            timestamp: Date.now(),
         }) as const,
      [],
   )

   // 副作用を実行する関数（分離された副作用）
   const executeNotification = useCallback(
      (_notification: ReturnType<typeof createNotification>) => {
         // HACK: 将来的にはtoast通知などに拡張可能
      },
      [],
   )

   // 通知の実行
   const showNotification = useCallback(
      (message: string, type: "success" | "error" | "warning") => {
         const notification = createNotification(message, type)
         executeNotification(notification)
      },
      [createNotification, executeNotification],
   )

   // 位置情報統合
   const {
      mapboxPosition,
      geolocateAttempted,
      attemptGeolocation,
      resetGeolocation,
   } = useLocationIntegration({
      geolocateControl: geolocateControlRef.current,
      geolocateInitialized,
      debugMode,
      showNotification,
      onPositionUpdate: (position) => {
         savePosition(position)
      },
      map,
   })

   // 実際に使用する位置情報（fpで優先順位付き選択）
   const position = useMemo((): LocationData | null => {
      const mapboxOpt = fromNullable(mapboxPosition)
      const customOpt = fromNullable(customPosition)
      const savedOpt = fromNullable(savedPosition)

      return pipe(
         selectBestPosition(mapboxOpt, customOpt, savedOpt),
         O.filter(isValidPosition),
         O.getOrElse(() => null as LocationData | null),
      )
   }, [mapboxPosition, customPosition, savedPosition])

   // 位置情報の状態を管理
   const positionState = useMemo(
      () => ({
         hasMapboxPosition: O.isSome(fromNullable(mapboxPosition)),
         hasValidPosition: position !== null,
         positionSource: mapboxPosition
            ? ("mapbox" as const)
            : customPosition
              ? ("browser" as const)
              : savedPosition
                ? ("saved" as const)
                : ("none" as const),
      }),
      [mapboxPosition, customPosition, savedPosition, position],
   )

   // Mapbox初期化
   useMapboxInitialization()

   // 環境設定
   const { currentLighting, updateLightingAndShadows } = useMapEnvironment({
      map,
      mapStyleLoaded,
      position,
      debugTimeOverride,
      mapboxHelpers,
   })

   // キーボードショートカット
   useMapControls({
      map,
      debugMode,
      onToggleDebugMode: toggleDebugMode,
      onGeolocationRetry: attemptGeolocation,
      onGeolocationReset: () => {
         clearSavedPosition()
         resetGeolocation()
      },
      onDebugTimeChange: setDebugTimeOverride,
      onUpdateLighting: () => updateLightingAndShadows(),
   })

   // マップ初期化（一度だけ実行、依存関係は意図的に除外）
   // 注意: この useEffect は意図的に依存関係を空にしています
   // 依存関係を追加するとマップが何度も再初期化されて問題を起こすためです
   useEffect(() => {
      if (!mapContainerRef.current || mapInitializedRef.current) return

      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

      if (!mapboxToken) {
         console.error("Mapbox access token is not set")
         return
      }

      mapboxgl.accessToken = mapboxToken

      try {
         // 現在時刻に基づいて初期lightPresetを決定（正常マッピング）
         const currentHour =
            debugTimeOverride !== null
               ? debugTimeOverride
               : new Date().getHours()
         let initialLightPreset: "day" | "dawn" | "dusk" | "night" = "dawn"

         // 昼の時間帯（8時から17時）→ 明るい空が必要 → 'day'を使用
         if (currentHour >= 8 && currentHour < 17) {
            initialLightPreset = "day" // 正常
         }
         // 夜の時間帯（22時から4時）→ 暗い空が必要 → 'night'を使用
         else if (currentHour >= 22 || currentHour < 4) {
            initialLightPreset = "night" // 正常
         }
         // 夕方・早朝の時間帯（17時-22時、4時-8時）
         else if (
            (currentHour >= 17 && currentHour < 22) ||
            (currentHour >= 4 && currentHour < 8)
         ) {
            initialLightPreset = "dusk"
         }

         if (process.env.NODE_ENV === "development") {
            // TODO: 開発環境でのログ出力を実装
         }

         const mapOptions: MapboxMapOptions = {
            container: mapContainerRef.current,
            style: "mapbox://styles/mapbox/standard",
            center: [139.6917, 35.6895], // 東京駅
            zoom: 16,
            pitch: 45,
            bearing: -20,
            antialias: true,
            // Standard Style の初期設定（現在時刻に基づく）
            config: {
               basemap: {
                  lightPreset: initialLightPreset,
                  showPlaceLabels: true,
                  showPointOfInterestLabels: true,
                  showRoadLabels: true,
                  showTransitLabels: true,
               },
            },
         }

         const mapInstance = new mapboxgl.Map(mapOptions)

         // Geolocationコントロールを追加
         const geolocateControl = new mapboxgl.GeolocateControl({
            positionOptions: {
               enableHighAccuracy: true,
               timeout: 10000,
               maximumAge: 60000,
            },
            trackUserLocation: false,
            showAccuracyCircle: false,
            showUserHeading: false,
            showUserLocation: false,
         })

         mapInstance.addControl(geolocateControl, "bottom-right")
         geolocateControlRef.current = geolocateControl

         // HACK: ユーザーの地図操作をリスナーで検知するようにした
         const handleUserInteraction = () => {
            userInteractionRef.current = true
            lastInteractionTimeRef.current = Date.now()
         }

         // refに保存してクリーンアップで使用
         userInteractionHandlerRef.current = handleUserInteraction

         // 各種ユーザー操作イベントを監視
         const eventTypes = [
            "dragstart",
            "zoomstart",
            "rotatestart",
            "pitchstart",
            "touchstart",
         ] as const
         for (const eventType of eventTypes) {
            mapInstance.on(eventType, handleUserInteraction)
         }

         // イベントリスナー設定
         mapInstance.on("load", () => {
            console.log("🔍 MapComponent: マップロード完了")
            setMapStyleLoaded(true)

            // ユーザーパス用のソースとレイヤーを追加
            mapInstance.addSource("user-path", {
               type: "geojson",
               data: {
                  type: "Feature",
                  properties: {},
                  geometry: {
                     type: "LineString",
                     coordinates: [],
                  },
               },
            })

            mapInstance.addLayer({
               id: "user-path",
               type: "line",
               source: "user-path",
               layout: {
                  "line-join": "round",
                  "line-cap": "round",
               },
               paint: {
                  "line-color": "#ff6b6b",
                  "line-width": 3,
                  "line-opacity": 0.8,
               },
            })

            // マップロード完了時に境界を設定
            setTimeout(() => {
               const bounds = mapInstance.getBounds()
               if (bounds) {
                  const newBounds: MapBounds = {
                     north: bounds.getNorth(),
                     south: bounds.getSouth(),
                     east: bounds.getEast(),
                     west: bounds.getWest(),
                  }
                  console.log("🔍 MapComponent: ロード時の境界設定", newBounds)
                  setMapBounds(newBounds)
               }
            }, 100)
         })

         // スタイル読み込み完了時の処理（より確実な検知）
         mapInstance.on("styledata", () => {
            if (mapInstance.isStyleLoaded()) {
               console.log("🔍 MapComponent: スタイルロード完了")
               setMapStyleLoaded(true)

               // スタイル読み込み完了後にライティング設定を適用
               setTimeout(() => {
                  if (mapInstance.isStyleLoaded()) {
                     updateLightingAndShadows(mapInstance)
                  }
               }, 500)

               // スタイルロード完了時にも境界を設定
               setTimeout(() => {
                  const bounds = mapInstance.getBounds()
                  if (bounds) {
                     const newBounds: MapBounds = {
                        north: bounds.getNorth(),
                        south: bounds.getSouth(),
                        east: bounds.getEast(),
                        west: bounds.getWest(),
                     }
                     console.log(
                        "🔍 MapComponent: スタイルロード時の境界設定",
                        newBounds,
                     )
                     setMapBounds(newBounds)
                  }
               }, 100)
            }
         })

         // スタイルが完全に読み込まれた時の追加チェック
         mapInstance.on("idle", () => {
            // スタイルは読み込まれているがマップ全体の初期化が完了していない場合の補完的チェック
            if (mapInstance.isStyleLoaded() && !mapInitializedRef.current) {
               if (process.env.NODE_ENV === "development") {
                  // TODO: スタイル読み込み完了後の初期化ログを実装
               }
               setMapStyleLoaded(true)

               // idle状態でも境界を設定
               setTimeout(() => {
                  const bounds = mapInstance.getBounds()
                  if (bounds) {
                     const newBounds: MapBounds = {
                        north: bounds.getNorth(),
                        south: bounds.getSouth(),
                        east: bounds.getEast(),
                        west: bounds.getWest(),
                     }
                     console.log("🔍 MapComponent: idle時の境界設定", newBounds)
                     setMapBounds(newBounds)
                  }
               }, 100)
            }
         })

         mapInstance.on("rotate", () => {
            const bearing = mapInstance.getBearing()
            onBearingChange?.(bearing)
         })

         // Geolocationコントロールのイベント
         geolocateControl.on("geolocate", (e) => {
            const newPosition = {
               latitude: e.coords.latitude,
               longitude: e.coords.longitude,
               accuracy: e.coords.accuracy,
               timestamp: Date.now(),
            }
            savePosition(newPosition)
         })

         geolocateControl.on("trackuserlocationstart", () => {
            setGeolocateInitialized(true)
         })

         geolocateControl.on("trackuserlocationend", () => {
            // 位置追跡終了
         })

         geolocateControl.on("error", (error) => {
            if (process.env.NODE_ENV === "development") {
               console.error("Geolocation エラー:", error)
            }
         })

         setMap(mapInstance)
         mapInitializedRef.current = true
         console.log("🔍 MapComponent: マップインスタンス設定完了")

         // コールバック関数を設定
         onGeolocationReady?.(attemptGeolocation)
         onReturnToLocationReady?.(() => {
            // ユーザー操作フラグをリセットして自動センタリングを有効化
            userInteractionRef.current = false
            lastInteractionTimeRef.current = 0

            // 現在の位置情報を取得（シンプルなアプローチ）
            const currentPosition =
               customPosition && isValidPosition(customPosition)
                  ? customPosition
                  : savedPosition && isValidPosition(savedPosition)
                    ? savedPosition
                    : null

            if (currentPosition) {
               // 位置情報がある場合は即座に移動
               mapInstance.flyTo({
                  center: [currentPosition.longitude, currentPosition.latitude],
                  zoom: 18,
                  pitch: 50,
                  bearing: -20,
                  essential: true,
                  duration: 1500, // 少し短縮してレスポンシブに
               })
            } else {
               // 位置情報がない場合は取得を試行
               attemptGeolocation()
            }
         })
      } catch (error) {
         console.error("マップの初期化に失敗:", error)
      }

      return () => {
         if (mapInitializedRef.current && map) {
            // イベントリスナーをクリーンアップ
            if (userInteractionHandlerRef.current) {
               const eventTypes = [
                  "dragstart",
                  "zoomstart",
                  "rotatestart",
                  "pitchstart",
                  "touchstart",
               ] as const
               for (const eventType of eventTypes) {
                  if (userInteractionHandlerRef.current) {
                     map.off(eventType, userInteractionHandlerRef.current)
                  }
               }
            }

            map.remove()
            setMap(null)
            mapInitializedRef.current = false
            hasInitialPositionSet.current = false
         }
      }
   }, []) // 依存関係を空にして一度だけ実行

   // 位置情報が取得できたらマップの中心を移動（ユーザー操作を考慮）
   useEffect(() => {
      if (!map || !position || !mapStyleLoaded) return

      const now = Date.now()
      const timeSinceLastInteraction = now - lastInteractionTimeRef.current
      const shouldAutoCenter =
         !userInteractionRef.current || timeSinceLastInteraction > 30000 // 30秒以上操作がない場合

      if (process.env.NODE_ENV === "development") {
         // TODO: 位置設定のデバッグログを実装
      }

      // 初回の位置設定は必ず実行
      if (!hasInitialPositionSet.current) {
         // 初回は即座に移動（アニメーションなし）
         map.jumpTo({
            center: [position.longitude, position.latitude],
            zoom: 18,
            pitch: 50,
         })
         hasInitialPositionSet.current = true
      } else if (shouldAutoCenter) {
         // ユーザーが操作していない、または30秒以上操作がない場合のみ自動センタリング
         map.flyTo({
            center: [position.longitude, position.latitude],
            zoom: 18,
            pitch: 50,
            essential: true,
            duration: 2000,
         })
      }

      // ユーザーパスを更新
      if (map.getSource("user-path")) {
         const source = map.getSource("user-path") as mapboxgl.GeoJSONSource

         const updatePath = (currentCoordinates: [number, number][]): void => {
            const newCoord: [number, number] = [
               position.longitude,
               position.latitude,
            ]

            // 最後の座標と異なる場合のみ追加
            const lastCoord = currentCoordinates[currentCoordinates.length - 1]
            if (
               !lastCoord ||
               lastCoord[0] !== newCoord[0] ||
               lastCoord[1] !== newCoord[1]
            ) {
               const updatedCoordinates = [...currentCoordinates, newCoord]

               // 最大100ポイントまで保持
               if (updatedCoordinates.length > 100) {
                  updatedCoordinates.shift()
               }

               const pathData: GeoJSONLineStringFeature = {
                  type: "Feature",
                  properties: {},
                  geometry: {
                     type: "LineString",
                     coordinates: updatedCoordinates,
                  },
               }

               source.setData(pathData)
            }
         }

         // 現在のパスデータを取得して更新
         updatePath([])
      }
   }, [map, position, mapStyleLoaded])

   // マップ境界の管理とピン取得
   useEffect(() => {
      console.log("🔍 MapComponent: 境界管理useEffect呼び出し", {
         mapExists: !!map,
         mapStyleLoaded,
         mapLoaded: map?.loaded(),
         mapIsStyleLoaded: map?.isStyleLoaded(),
      })

      if (!map || !mapStyleLoaded) {
         console.log("🔍 MapComponent: マップまたはスタイルが未準備", {
            mapExists: !!map,
            mapStyleLoaded,
            mapLoaded: map?.loaded(),
            mapIsStyleLoaded: map?.isStyleLoaded(),
         })
         return
      }

      console.log("🔍 MapComponent: 境界管理useEffect開始", {
         mapExists: !!map,
         mapStyleLoaded,
         mapLoaded: map?.loaded(),
         mapIsStyleLoaded: map?.isStyleLoaded(),
      })

      let lastBounds: MapBounds | null = null

      const isSignificantChange = (
         oldBounds: MapBounds | null,
         newBounds: MapBounds,
      ): boolean => {
         if (!oldBounds) return true

         const threshold = 0.001 // 約100mの変化
         return (
            Math.abs(oldBounds.north - newBounds.north) > threshold ||
            Math.abs(oldBounds.south - newBounds.south) > threshold ||
            Math.abs(oldBounds.east - newBounds.east) > threshold ||
            Math.abs(oldBounds.west - newBounds.west) > threshold
         )
      }

      const handleMapMove = () => {
         console.log("🔍 MapComponent: handleMapMove実行開始", {
            mapExists: !!map,
            mapLoaded: map?.loaded(),
            mapIsStyleLoaded: map?.isStyleLoaded(),
         })

         const bounds = map.getBounds()
         if (!bounds) {
            console.log("🔍 MapComponent: マップ境界が取得できません", {
               mapExists: !!map,
               mapLoaded: map?.loaded(),
               mapIsStyleLoaded: map?.isStyleLoaded(),
               boundsValue: bounds,
            })
            return
         }

         const newBounds: MapBounds = {
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest(),
         }

         console.log("🔍 MapComponent: handleMapMove", {
            newBounds: {
               north: newBounds.north.toFixed(4),
               south: newBounds.south.toFixed(4),
               east: newBounds.east.toFixed(4),
               west: newBounds.west.toFixed(4),
            },
            lastBounds: lastBounds
               ? {
                    north: lastBounds.north.toFixed(4),
                    south: lastBounds.south.toFixed(4),
                    east: lastBounds.east.toFixed(4),
                    west: lastBounds.west.toFixed(4),
                 }
               : null,
         })

         // 変化が小さい場合はスキップ
         if (!isSignificantChange(lastBounds, newBounds)) {
            console.log("🔍 MapComponent: 境界変更が小さいためスキップ")
            return
         }

         console.log("🔍 MapComponent: 境界を更新", {
            newBounds: {
               north: newBounds.north.toFixed(4),
               south: newBounds.south.toFixed(4),
               east: newBounds.east.toFixed(4),
               west: newBounds.west.toFixed(4),
            },
         })

         lastBounds = newBounds
         console.log("🔍 MapComponent: setMapBounds実行", { newBounds })
         setMapBounds(newBounds)
      }

      // 地図移動イベントをリスナーに追加
      map.on("moveend", handleMapMove)
      map.on("zoomend", handleMapMove)

      // マップとスタイルが準備できたらすぐに初回境界を設定
      console.log("🔍 MapComponent: マップとスタイルが準備完了、境界を設定")

      // 少し遅延を入れてから境界を設定（Mapboxの完全な初期化を待つ）
      setTimeout(() => {
         console.log("🔍 MapComponent: 遅延後のhandleMapMove実行")
         handleMapMove()
      }, 100)

      return () => {
         map.off("moveend", handleMapMove)
         map.off("zoomend", handleMapMove)
      }
   }, [map, mapStyleLoaded]) // mapStyleLoadedの依存を追加

   // 新しいピンが作成されたときの処理を最適化
   useEffect(() => {
      if (!lastCreatedPinId || !map || !mapStyleLoaded) return

      console.log(
         "🔄 新しいピンが作成されました。楽観的更新を実行:",
         lastCreatedPinId,
      )

      // 新しいピンの位置にマップを移動（即座に実行）
      const newPin = nearbyPins.find((p) => p.id === lastCreatedPinId)
      if (newPin && map) {
         console.log("🎯 新しいピンの位置にマップを移動:", {
            pinId: newPin.id,
            location: { lat: newPin.latitude, lng: newPin.longitude },
         })

         map.flyTo({
            center: [newPin.longitude, newPin.latitude],
            zoom: 18,
            pitch: 50,
            bearing: -20,
            essential: true,
            duration: 1000,
         })
      }

      // TanStack Queryのキャッシュを即座に無効化（遅延なし）
      // 楽観的更新により、ピンは既に表示されているため、
      // バックグラウンドでデータを同期するだけ
      queryClient.invalidateQueries({
         queryKey: ["nearby-pins"],
         refetchType: "active", // アクティブなクエリのみ再取得
      })
   }, [lastCreatedPinId, map, mapStyleLoaded, nearbyPins, queryClient])

   // ピンの統合表示（nearbyPinsを使用）
   const _allPins = useMemo(() => {
      return nearbyPins || []
   }, [nearbyPins])

   return {
      mapContainerRef,
      map,
      mapStyleLoaded,
      position,
      currentLighting,
      debugMode,
      pins: nearbyPins, // React Queryから取得したピンを返す
      selectedPinId,
      permissionStatus,
      geolocateInitialized,
      geolocateAttempted,
      debugTimeOverride,
      isMapboxPosition: positionState.hasMapboxPosition,
      selectPin,
      setDebugTimeOverride,
      updateLightingAndShadows,
   }
}
