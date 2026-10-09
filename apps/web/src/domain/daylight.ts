/**
 * 時刻と地図の明るさ
 *
 * @description
 * 地図は Mapbox Standard Style の lightPreset で明るさが変わる。
 * 地図の上に重ねる UI の文字色もこれに従わせるため、判定はこのファイルに集約する。
 * ピンに付ける時間帯タグ（`generateTimeTag`）は保存データの意味づけなので別物。
 */

/** Mapbox Standard Style の lightPreset */
export type LightPreset = "day" | "dawn" | "dusk" | "night"

const DAY_START_HOUR = 8
const DUSK_START_HOUR = 17
const NIGHT_START_HOUR = 22
const DAWN_START_HOUR = 4

/**
 * 時刻から地図のライトプリセットを求める
 *
 * @param hour 0〜23
 */
export function getLightPreset(hour: number): LightPreset {
   if (hour >= DAY_START_HOUR && hour < DUSK_START_HOUR) return "day"
   if (hour >= DUSK_START_HOUR && hour < NIGHT_START_HOUR) return "dusk"
   if (hour >= NIGHT_START_HOUR || hour < DAWN_START_HOUR) return "night"
   return "dawn"
}

/**
 * 地図が暗く描かれる時刻かどうか
 *
 * @description
 * `day` 以外（dawn / dusk / night）はいずれも暗い。地図の上の文字は白にする
 *
 * @param hour 0〜23
 */
export function isDarkHour(hour: number): boolean {
   return getLightPreset(hour) !== "day"
}
