/**
 * 2点間の距離を計算（ハーバーサイン公式）
 */
export function calculateDistance(
   lat1: number,
   lng1: number,
   lat2: number,
   lng2: number,
): number {
   const R = 6371 // 地球の半径（km）
   const dLat = toRadians(lat2 - lat1)
   const dLng = toRadians(lng2 - lng1)

   const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
         Math.cos(toRadians(lat2)) *
         Math.sin(dLng / 2) *
         Math.sin(dLng / 2)

   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
   return R * c
}

/**
 * 度をラジアンに変換
 */
function toRadians(degrees: number): number {
   return degrees * (Math.PI / 180)
}

/**
 * 境界内の点かどうかをチェック
 */
export function isPointInBounds(
   lat: number,
   lng: number,
   bounds: {
      north: number
      south: number
      east: number
      west: number
   },
): boolean {
   return (
      lat <= bounds.north &&
      lat >= bounds.south &&
      lng <= bounds.east &&
      lng >= bounds.west
   )
}

/**
 * 中心点と半径から境界を計算
 */
export function calculateBounds(
   centerLat: number,
   centerLng: number,
   radiusKm: number,
): {
   north: number
   south: number
   east: number
   west: number
} {
   const latDelta = radiusKm / 111.32 // 1度 ≈ 111.32km
   const lngDelta = radiusKm / (111.32 * Math.cos(toRadians(centerLat)))

   return {
      north: centerLat + latDelta,
      south: centerLat - latDelta,
      east: centerLng + lngDelta,
      west: centerLng - lngDelta,
   }
}

/**
 * 位置の精度レベルを判定
 */
export function getAccuracyLevel(accuracy: number): 'high' | 'medium' | 'low' {
   if (accuracy <= 10) return 'high'
   if (accuracy <= 50) return 'medium'
   return 'low'
}

/**
 * 座標の正規化
 */
export function normalizeCoordinates(
   lat: number,
   lng: number,
): {
   lat: number
   lng: number
} {
   // 緯度を-90から90の範囲に正規化
   let normalizedLat = lat
   while (normalizedLat > 90) normalizedLat -= 180
   while (normalizedLat < -90) normalizedLat += 180

   // 経度を-180から180の範囲に正規化
   let normalizedLng = lng
   while (normalizedLng > 180) normalizedLng -= 360
   while (normalizedLng < -180) normalizedLng += 360

   return {
      lat: normalizedLat,
      lng: normalizedLng,
   }
}
