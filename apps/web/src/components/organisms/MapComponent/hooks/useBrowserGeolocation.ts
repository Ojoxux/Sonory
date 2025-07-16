import { useEffect, useRef, useState } from "react"

type Position = {
   latitude: number
   longitude: number
   accuracy: number
   timestamp: number
}

type GeolocationInstance = {
   position: Position | null
   subscribers: Set<(position: Position | null) => void>
   watchId: number | null
   error: GeolocationPositionError | null
}

// シングルトンインスタンス
let geolocationInstance: GeolocationInstance | null = null

// 位置情報の更新条件
const UPDATE_CONDITIONS = {
   DISTANCE_THRESHOLD: 20, // メートル
   TIME_THRESHOLD: 30000, // ミリ秒
} as const

// 位置情報の監視オプション
const _WATCH_OPTIONS: PositionOptions = {
   enableHighAccuracy: false,
   timeout: 30000,
   maximumAge: 60000,
} as const

/**
 * 2点間の距離を計算（メートル単位）
 * ハーバーサイン公式を使用
 */
function getDistanceMeters(
   lat1: number,
   lon1: number,
   lat2: number,
   lon2: number,
): number {
   const R = 6371e3 // 地球半径(m)
   const toRad = (deg: number) => (deg * Math.PI) / 180
   const φ1 = toRad(lat1)
   const φ2 = toRad(lat2)
   const Δφ = toRad(lat2 - lat1)
   const Δλ = toRad(lon2 - lon1)

   const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

   return R * c
}

/**
 * 位置情報の更新が必要かどうかを判定
 */
function shouldUpdatePosition(
   lastPosition: Position | null,
   newPosition: Position,
): boolean {
   if (!lastPosition) return true

   const distance = getDistanceMeters(
      lastPosition.latitude,
      lastPosition.longitude,
      newPosition.latitude,
      newPosition.longitude,
   )

   const timeDiff = Math.abs(newPosition.timestamp - lastPosition.timestamp)

   return (
      distance > UPDATE_CONDITIONS.DISTANCE_THRESHOLD ||
      timeDiff > UPDATE_CONDITIONS.TIME_THRESHOLD
   )
}

/**
 * ブラウザのGeolocation APIを使用して位置情報を取得するフック
 *
 * Geolocation APIを使用して現在の位置情報を取得する
 * 高精度モードを有効にし、位置情報の更新を継続的に監視
 * @returns 現在位置と取得エラー
 */
export function useBrowserGeolocation() {
   const [position, setPosition] = useState<Position | null>(null)
   const [error, setError] = useState<GeolocationPositionError | null>(null)
   const [permissionStatus, setPermissionStatus] = useState<string>("pending")
   const lastPositionRef = useRef<Position | null>(null)
   const subscriberRef = useRef<((pos: Position | null) => void) | null>(null)

   useEffect(() => {
      // シングルトンインスタンスの初期化
      if (!geolocationInstance) {
         geolocationInstance = {
            position: null,
            subscribers: new Set(),
            watchId: null,
            error: null,
         }

         // 位置情報取得成功時のコールバック
         const handleSuccess = (geo: GeolocationPosition) => {
            if (!geolocationInstance) return

            const newPos: Position = {
               latitude: geo.coords.latitude,
               longitude: geo.coords.longitude,
               accuracy: geo.coords.accuracy,
               timestamp: geo.timestamp,
            }

            if (shouldUpdatePosition(lastPositionRef.current, newPos)) {
               lastPositionRef.current = newPos
               geolocationInstance.position = newPos
               geolocationInstance.error = null
               for (const subscriber of geolocationInstance.subscribers) {
                  subscriber(newPos)
               }
            }
         }

         // エラー時のコールバック
         const handleError = (err: GeolocationPositionError) => {
            if (!geolocationInstance) return
            geolocationInstance.error = err
            console.error("位置情報取得エラー:", err.message)
         }

         // 位置情報の監視を開始
         if ("geolocation" in navigator) {
            geolocationInstance.watchId = navigator.geolocation.watchPosition(
               handleSuccess,
               handleError,
               {
                  enableHighAccuracy: true,
                  maximumAge: 30000,
                  timeout: 27000,
               },
            )
         }
      }

      // このコンポーネント用のサブスクライバーを登録
      const subscriber = (pos: Position | null) => {
         setPosition(pos)
         setError(null)
      }
      subscriberRef.current = subscriber
      geolocationInstance.subscribers.add(subscriber)

      // 既存の位置情報があれば設定
      if (geolocationInstance.position) {
         setPosition(geolocationInstance.position)
      }

      if (geolocationInstance.error) {
         setError(geolocationInstance.error)
      }

      // 権限状態を確認
      if ("permissions" in navigator) {
         navigator.permissions
            .query({ name: "geolocation" as PermissionName })
            .then((result) => {
               setPermissionStatus(result.state)
            })
            .catch(() => {
               // 権限APIがサポートされていない場合
               setPermissionStatus("prompt")
            })
      }

      // クリーンアップ関数
      return () => {
         // サブスクライバーを削除
         if (geolocationInstance && subscriberRef.current) {
            geolocationInstance.subscribers.delete(subscriberRef.current)
            subscriberRef.current = null

            // 最後のサブスクライバーの場合は監視を停止
            if (geolocationInstance.subscribers.size === 0) {
               if (
                  geolocationInstance.watchId !== null &&
                  "geolocation" in navigator
               ) {
                  navigator.geolocation.clearWatch(geolocationInstance.watchId)
               }
               geolocationInstance = null
            }
         }
      }
   }, [])

   return {
      position,
      error,
      permissionStatus,
   }
}
