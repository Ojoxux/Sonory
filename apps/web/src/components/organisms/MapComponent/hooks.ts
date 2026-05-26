/**
 * MapComponent統合管理フック
 *
 * @description MapComponentの主要なロジックを統合管理するカスタムフック
 */

import mapboxgl from "mapbox-gl"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { useNearbyPins } from "@/hooks/useNearbyPins"
import { useSoundPinStore } from "@/store/useSoundPinStore"
import { useBrowserGeolocation } from "./hooks/useBrowserGeolocation"
import { useLocationIntegration } from "./hooks/useLocationIntegration"
import { useLocationStorage } from "./hooks/useLocationStorage"
import { useMapBoundsManager } from "./hooks/useMapBoundsManager"
import { useMapboxInitialization } from "./hooks/useMapboxInitialization"
import { useMapCentering } from "./hooks/useMapCentering"
import { useMapControls } from "./hooks/useMapControls"
import { useMapDebug } from "./hooks/useMapDebug"
import { useMapEnvironment } from "./hooks/useMapEnvironment"
import { useMapNotifications } from "./hooks/useMapNotifications"
import { useMapState } from "./hooks/useMapState"
import { useNewPinHandler } from "./hooks/useNewPinHandler"
import type { LocationData, MapboxMapOptions } from "./mapbox.types"
import type {
   MapBounds,
   UseMapComponentProps,
   UseMapComponentReturn,
} from "./types"
import { isValidPosition, selectBestPosition } from "./utils/functional"
import { mapboxHelpers } from "./utils/mapboxHelpers"
import { convertApiPinToLocal } from "./utils/pinConverters"

// 型をre-export
export type { MapBounds } from "./types"

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

   // カスタムフック: 状態管理
   const {
      map,
      setMap,
      mapStyleLoaded,
      setMapStyleLoaded,
      mapBounds,
      setMapBounds,
      geolocateInitialized,
      setGeolocateInitialized,
   } = useMapState()

   // カスタムフック: デバッグ機能
   const {
      debugMode,
      toggleDebugMode,
      debugTimeOverride,
      setDebugTimeOverride,
   } = useMapDebug()

   const {
      selectedPinId,
      selectPin,
      lastCreatedPinId,
      pins: localPins,
      persistedPins,
      tempPins,
   } = useSoundPinStore()

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

   // カスタムフック: 通知機能
   const { showNotification } = useMapNotifications()

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

   const position = useMemo((): LocationData | null => {
      const best = selectBestPosition(
         mapboxPosition,
         customPosition,
         savedPosition,
      )
      if (best != null && isValidPosition(best)) {
         return best
      }
      return null
   }, [mapboxPosition, customPosition, savedPosition])

   // 位置情報の状態を管理
   const positionState = useMemo(
      () => ({
         hasMapboxPosition: mapboxPosition != null,
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

   /**
    * 初期ライトプリセットを決定
    */
   const determineInitialLightPreset = useCallback(
      (debugTimeOverride: number | null): "day" | "dawn" | "dusk" | "night" => {
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
         if (
            (currentHour >= 17 && currentHour < 22) ||
            (currentHour >= 4 && currentHour < 8)
         ) {
            return "dusk"
         }
         return "dawn"
      },
      [],
   )

   /**
    * マップ境界を更新する関数
    */
   const updateMapBounds = useCallback(
      (
         mapInstance: mapboxgl.Map,
         setMapBounds: (bounds: MapBounds) => void,
      ): void => {
         setTimeout(() => {
            const bounds = mapInstance.getBounds()
            if (bounds) {
               const newBounds: MapBounds = {
                  north: bounds.getNorth(),
                  south: bounds.getSouth(),
                  east: bounds.getEast(),
                  west: bounds.getWest(),
               }
               setMapBounds(newBounds)
            }
         }, 100)
      },
      [],
   )

   // マップ初期化（一度だけ実行）
   // MEMO: attemptGeolocationはuseCallbackでメモ化されているため、依存配列に含めても再初期化は発生しない
   useEffect(() => {
      if (!mapContainerRef.current || mapInitializedRef.current) return

      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

      if (!mapboxToken) {
         console.error("Mapbox access token is not set")
         return
      }

      mapboxgl.accessToken = mapboxToken

      try {
         const initialLightPreset =
            determineInitialLightPreset(debugTimeOverride)

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

            updateMapBounds(mapInstance, setMapBounds)
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

               updateMapBounds(mapInstance, setMapBounds)
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

               updateMapBounds(mapInstance, setMapBounds)
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

         // mapのインスタンス化にはDOM要素が必要で、useStateの初期値では不可能
         // また、mapは他のuseEffectの依存配列に含まれており、再レンダリングのトリガーとして機能する必要がある
         setMap(mapInstance)
         mapInitializedRef.current = true
         console.log("🔍 MapComponent: マップインスタンス設定完了")

         // コールバック関数を設定
         onGeolocationReady?.(attemptGeolocation)
         onReturnToLocationReady?.(() => {
            const currentPosition =
               customPosition && isValidPosition(customPosition)
                  ? customPosition
                  : savedPosition && isValidPosition(savedPosition)
                    ? savedPosition
                    : null

            if (currentPosition) {
               mapInstance.flyTo({
                  center: [currentPosition.longitude, currentPosition.latitude],
                  zoom: 18,
                  pitch: 50,
                  bearing: -20,
                  essential: true,
                  duration: 1500,
               })
            } else {
               attemptGeolocation()
            }
         })
      } catch (error) {
         console.error("マップの初期化に失敗:", error)
      }

      const cleanupMap = (): void => {
         if (mapInitializedRef.current && map) {
            map.remove()
            setMap(null)
            mapInitializedRef.current = false
         }
      }

      return cleanupMap
   }, [
      attemptGeolocation,
      debugTimeOverride,
      savePosition,
      updateLightingAndShadows,
      customPosition,
      savedPosition,
      onGeolocationReady,
      onReturnToLocationReady,
      onBearingChange,
      map,
      setMap,
      setMapStyleLoaded,
      setGeolocateInitialized,
      setMapBounds,
      determineInitialLightPreset,
      updateMapBounds,
   ]) // 依存関係を追加。mapInitializedRefでガードされているため再初期化は発生しない

   // 位置情報に基づくマップの自動センタリング
   useMapCentering({ map, position, mapStyleLoaded })

   // マップ境界の管理
   useMapBoundsManager({ map, mapStyleLoaded, setMapBounds })

   // 新しいピンが作成されたときの処理
   useNewPinHandler({
      map,
      mapStyleLoaded,
      lastCreatedPinId,
      allPins: [...localPins, ...persistedPins, ...tempPins],
   })

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
