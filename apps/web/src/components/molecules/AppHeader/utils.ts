/** 夜の始まりと終わり（時）。地図のライトが dusk に切り替わる 17 時に合わせる */
const NIGHT_START_HOUR = 17
const NIGHT_END_HOUR = 5

/**
 * 地図が暗くなる時間帯かどうか
 *
 * @param hour 0〜23
 */
export function isNightHour(hour: number): boolean {
   return hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR
}
