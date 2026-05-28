/**
 * ユーティリティ関数
 *
 * @description
 * 位置情報の選択・バリデーション・距離計算などの純粋関数群
 */

// =============================================================================
// エラー型
// =============================================================================

/**
 * アプリケーションエラー型
 */
export type AppError = {
   readonly type: "ValidationError" | "NetworkError" | "UnknownError"
   readonly message: string
   readonly details?: unknown
}

/**
 * エラーを作成
 */
export const createError = (
   type: AppError["type"],
   message: string,
   details?: unknown,
): AppError => ({
   type,
   message,
   details,
})

// =============================================================================
// 位置情報ユーティリティ
// =============================================================================

/**
 * 位置情報の優先順位付き選択
 *
 * mapbox → browser → saved の順で最初の非null値を返す。
 * 精度が1km以内のもののみ有効。
 */
export const selectBestPosition = (
   mapboxPos: LocationData | null | undefined,
   browserPos: LocationData | null | undefined,
   savedPos: LocationData | null | undefined,
): LocationData | null => {
   const candidates = [mapboxPos, browserPos, savedPos]
   for (const pos of candidates) {
      if (pos != null && pos.accuracy < 1000) {
         return pos
      }
   }
   return null
}

/**
 * 位置情報の有効性チェック
 */
export const isValidPosition = (position: LocationData): boolean =>
   position.latitude >= -90 &&
   position.latitude <= 90 &&
   position.longitude >= -180 &&
   position.longitude <= 180 &&
   position.accuracy > 0 &&
   Date.now() - position.timestamp < 24 * 60 * 60 * 1000 // 24時間以内

/**
 * 座標の距離計算（メートル）
 */
export const calculateDistance = (
   pos1: LocationData,
   pos2: LocationData,
): number => {
   const R = 6371e3 // 地球の半径（メートル）
   const φ1 = (pos1.latitude * Math.PI) / 180
   const φ2 = (pos2.latitude * Math.PI) / 180
   const Δφ = ((pos2.latitude - pos1.latitude) * Math.PI) / 180
   const Δλ = ((pos2.longitude - pos1.longitude) * Math.PI) / 180

   const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

   return R * c
}

// =============================================================================
// 非同期ユーティリティ
// =============================================================================

/**
 * 位置情報取得をPromiseで包装
 */
export const getGeolocation = (
   options?: PositionOptions,
): Promise<GeolocationPosition> =>
   new Promise<GeolocationPosition>((resolve, reject) => {
      if (!("geolocation" in navigator)) {
         reject(new Error("Geolocation is not supported"))
         return
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, options)
   })

// =============================================================================
// 型定義
// =============================================================================

export type LocationData = {
   readonly latitude: number
   readonly longitude: number
   readonly accuracy: number
   readonly timestamp: number
}
