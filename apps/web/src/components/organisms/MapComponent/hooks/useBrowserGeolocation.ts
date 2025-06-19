import { useEffect, useRef, useState } from 'react'

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
const WATCH_OPTIONS: PositionOptions = {
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
   const [permissionStatus, setPermissionStatus] = useState<string>('pending')
   const lastPositionRef = useRef<Position | null>(null)

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
               console.log('位置情報を更新:', {
                  ...newPos,
                  distance: lastPositionRef.current
                     ? `${Math.round(
                          getDistanceMeters(
                             lastPositionRef.current.latitude,
                             lastPositionRef.current.longitude,
                             newPos.latitude,
                             newPos.longitude,
                          ),
                       )}m`
                     : '初回',
               })
            }
         }

         // 位置情報取得失敗時のコールバック
         const handleError = (error: GeolocationPositionError) => {
            if (!geolocationInstance) return

            // タイムアウトエラーは無視
            if (error.code === error.TIMEOUT) return

            geolocationInstance.error = error
            console.error('位置情報の取得エラー:', error.message)

            if (error.code === error.PERMISSION_DENIED) {
               setPermissionStatus('denied')
               console.warn(
                  '位置情報へのアクセスが拒否されました。ブラウザの設定で許可してください。',
               )
            } else if (error.code === error.POSITION_UNAVAILABLE) {
               console.warn(
                  '現在位置を取得できませんでした。GPS信号が弱い可能性があります。',
               )
            }
         }

         // 位置情報を継続的に監視
         geolocationInstance.watchId = navigator.geolocation.watchPosition(
            handleSuccess,
            handleError,
            WATCH_OPTIONS,
         )
      }

      // サブスクライバーの追加
      const subscriber = (newPosition: Position | null) => {
         setPosition(newPosition)
         setError(geolocationInstance?.error || null)
      }
      geolocationInstance.subscribers.add(subscriber)

      // 初期位置の設定
      if (geolocationInstance.position) {
         setPosition(geolocationInstance.position)
      }

      // クリーンアップ
      return () => {
         if (geolocationInstance) {
            geolocationInstance.subscribers.delete(subscriber)

            // 最後のサブスクライバーが削除された場合、監視を停止
            if (
               geolocationInstance.subscribers.size === 0 &&
               geolocationInstance.watchId
            ) {
               navigator.geolocation.clearWatch(geolocationInstance.watchId)
               geolocationInstance = null
            }
         }
      }
   }, [])

   return { position, error, permissionStatus }
}
