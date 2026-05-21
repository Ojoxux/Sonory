/**
 * 地理・時間関連の純粋関数
 */

import type { TimeTag } from "@sonory/shared-types"

/**
 * 2点間の距離を計算（ハーバーサイン公式）
 *
 * @param lat1 - 地点1の緯度
 * @param lon1 - 地点1の経度
 * @param lat2 - 地点2の緯度
 * @param lon2 - 地点2の経度
 * @returns 距離（キロメートル）
 */
export function calculateDistanceKm(
   lat1: number,
   lon1: number,
   lat2: number,
   lon2: number,
): number {
   const R = 6371
   const dLat = ((lat2 - lat1) * Math.PI) / 180
   const dLon = ((lon2 - lon1) * Math.PI) / 180
   const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
         Math.cos((lat2 * Math.PI) / 180) *
         Math.sin(dLon / 2) *
         Math.sin(dLon / 2)
   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
   return R * c
}

/**
 * 2点間の距離を計算（メートル単位）
 *
 * @returns 距離（メートル）
 */
export function calculateDistanceMeters(
   lat1: number,
   lon1: number,
   lat2: number,
   lon2: number,
): number {
   return calculateDistanceKm(lat1, lon1, lat2, lon2) * 1000
}

/**
 * 時間帯タグを生成
 *
 * @param date - 対象日時
 * @returns 時間タグ（"朝" | "昼" | "夕" | "夜"）
 */
export function generateTimeTag(date: Date): TimeTag {
   const hour = date.getHours()

   if (hour >= 6 && hour < 12) return "朝"
   if (hour >= 12 && hour < 18) return "昼"
   if (hour >= 18 && hour < 21) return "夕"
   return "夜"
}
