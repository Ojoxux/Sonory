/**
 * 位置情報統合管理フック
 *
 * @description
 * 複数の位置情報ソース（Mapbox、ブラウザ、保存済み）を統合管理し、
 * 段階的フォールバック戦略で最適な位置情報を提供する
 *
 * @param map Mapboxマップインスタンス
 * @param onGeolocationReady 位置情報準備完了時のコールバック
 * @param onReturnToLocationReady 位置復帰準備完了時のコールバック
 * @returns 統合された位置情報と制御関数
 */

import type mapboxgl from "mapbox-gl"
import { useCallback, useState } from "react"
import type { LocationData } from "../mapbox.types"

export type UseMapGeolocationProps = {
   /** Mapboxのgeolocationコントロール */
   geolocateControl: mapboxgl.GeolocateControl | null
   /** 位置情報取得の初期化状態 */
   geolocateInitialized: boolean
   /** デバッグモードの状態 */
   debugMode: boolean
   /** 通知表示関数 */
   showNotification: (
      message: string,
      type: "success" | "error" | "warning",
   ) => void
   /** 位置情報更新時のコールバック */
   onPositionUpdate: (position: LocationData) => void
   /** マップインスタンス */
   map: mapboxgl.Map | null
}

export type UseMapGeolocationReturn = {
   /** Mapboxから取得した位置情報 */
   mapboxPosition: LocationData | null
   /** 位置情報取得の試行状態 */
   geolocateAttempted: boolean
   /** 位置情報取得を試行する関数 */
   attemptGeolocation: () => void
   /** 位置情報をリセットする関数 */
   resetGeolocation: () => void
}

/**
 * マップ位置情報取得管理フック
 */
export function useLocationIntegration({
   geolocateControl,
   geolocateInitialized,
   debugMode,
   showNotification,
   onPositionUpdate,
   map,
}: UseMapGeolocationProps): UseMapGeolocationReturn {
   const [mapboxPosition, setMapboxPosition] = useState<LocationData | null>(
      null,
   )
   const [geolocateAttempted, setGeolocateAttempted] = useState<boolean>(false)

   /**
    * 録音データを保存・復元するヘルパー関数
    */
   const preserveRecordingData = useCallback((): void => {
      const recordingData = localStorage.getItem("recording_data")
      if (recordingData) {
         localStorage.setItem("recording_data", recordingData)
      }
   }, [])

   /**
    * 位置情報を更新し、マップの視点を調整する
    */
   const updatePositionAndMap = useCallback(
      (newPosition: LocationData): void => {
         setMapboxPosition(newPosition)
         preserveRecordingData()
         onPositionUpdate(newPosition)

         if (debugMode) {
            showNotification("位置情報を更新しました", "success")
         }

         if (map) {
            map.flyTo({
               center: [newPosition.longitude, newPosition.latitude],
               zoom: 18,
               pitch: 50,
               bearing: -20,
               essential: true,
               duration: 2000,
            })
         }
      },
      [
         debugMode,
         map,
         onPositionUpdate,
         preserveRecordingData,
         showNotification,
      ],
   )

   /**
    * 保存された位置情報を使用する
    */
   const loadSavedPosition = useCallback((): boolean => {
      const savedPosition = localStorage.getItem("sonory_last_position")
      if (!savedPosition) {
         return false
      }

      try {
         const parsed = JSON.parse(savedPosition) as LocationData
         setMapboxPosition(parsed)
         preserveRecordingData()
         onPositionUpdate(parsed)

         if (debugMode) {
            showNotification("保存された位置情報を使用しました", "warning")
         }
         return true
      } catch (parseError) {
         console.error("保存された位置情報の解析エラー:", parseError)
         return false
      }
   }, [debugMode, onPositionUpdate, preserveRecordingData, showNotification])

   /**
    * Mapboxのgeolocationコントロールを試行する
    */
   const tryMapboxGeolocation = useCallback((): void => {
      if (!geolocateControl || !geolocateInitialized) {
         return
      }

      try {
         geolocateControl.trigger()
      } catch (triggerError) {
         console.error("Mapbox trigger失敗:", triggerError)
      }
   }, [geolocateControl, geolocateInitialized])

   /**
    * フォールバックレベル2の処理
    */
   const handleFallbackLevel2 = useCallback((): void => {
      if (loadSavedPosition()) {
         return
      }
      tryMapboxGeolocation()
   }, [tryMapboxGeolocation, loadSavedPosition])

   /**
    * 段階的フォールバック戦略による位置情報取得
    */
   const attemptGeolocation = useCallback((): void => {
      setGeolocateAttempted(true)

      if (!("geolocation" in navigator)) {
         console.warn("Geolocation APIがサポートされていません")
         loadSavedPosition()
         return
      }

      // 段階的フォールバック戦略
      const tryGeolocation = (
         options: PositionOptions,
         fallbackLevel: number,
      ): void => {
         navigator.geolocation.getCurrentPosition(
            (position) => {
               const newPosition: LocationData = {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  accuracy: position.coords.accuracy,
                  timestamp: Date.now(),
               }
               updatePositionAndMap(newPosition)
            },
            (error) => {
               // 段階的フォールバック
               if (fallbackLevel === 1 && error.code === 3) {
                  tryGeolocation(
                     {
                        enableHighAccuracy: false,
                        timeout: 15000,
                        maximumAge: 300000, // 5分以内のキャッシュを許可
                     },
                     2,
                  )
               } else if (fallbackLevel === 2) {
                  handleFallbackLevel2()
               }
            },
            options,
         )
      }

      // レベル1: 高精度モード、短いタイムアウト
      tryGeolocation(
         {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000, // 1分以内のキャッシュを許可
         },
         1,
      )
   }, [handleFallbackLevel2, updatePositionAndMap, loadSavedPosition])

   /**
    * 位置情報をリセットする関数
    */
   const resetGeolocation = useCallback((): void => {
      // 録音データを保存
      const recordingData = localStorage.getItem("recording_data")

      // 位置情報のみクリア
      localStorage.removeItem("sonory_last_position")

      // 録音データを復元
      if (recordingData) {
         localStorage.setItem("recording_data", recordingData)
      }

      setMapboxPosition(null)
      setGeolocateAttempted(false)

      // 現在の視点を保存
      const currentCenter = map?.getCenter()
      const currentZoom = map?.getZoom()
      const currentBearing = map?.getBearing()

      // 少し遅延させてから再取得
      setTimeout(() => {
         // 視点をリセット（斜めから見下ろす視点に戻す）
         if (map && currentCenter) {
            map.flyTo({
               center: [currentCenter.lng, currentCenter.lat],
               zoom: currentZoom || 18,
               pitch: 50, // 斜めから見下ろす視点
               bearing: currentBearing || -20,
               essential: true,
               duration: 1000,
            })
         }
         attemptGeolocation()
      }, 500)
   }, [map, attemptGeolocation])

   return {
      mapboxPosition,
      geolocateAttempted,
      attemptGeolocation,
      resetGeolocation,
   }
}
