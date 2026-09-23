import { BAR_GAP, BAR_WIDTH, MAX_DB, MIN_DB, SLOT_MS } from "./constants"

/**
 * 時間領域のサンプルから音量（0〜1）を求める
 *
 * @description
 * 振幅をそのまま使うと小さい音がほとんど見えないため、デシベルに直してから
 * `MIN_DB`〜`MAX_DB` を 0〜1 に写す
 */
export function sampleLevel(samples: Float32Array): number {
   if (samples.length === 0) return 0

   let sumOfSquares = 0
   for (const sample of samples) {
      sumOfSquares += sample * sample
   }
   const rms = Math.sqrt(sumOfSquares / samples.length)
   if (rms <= 0) return 0

   const db = 20 * Math.log10(rms)
   return Math.min(1, Math.max(0, (db - MIN_DB) / (MAX_DB - MIN_DB)))
}

/** 録音時間を区間の数に直す */
export function slotCount(maxDuration: number): number {
   return Math.max(1, Math.round((maxDuration * 1000) / SLOT_MS))
}

/** 幅に収まるバーの数 */
export function barCount(width: number): number {
   return Math.max(1, Math.floor(width / (BAR_WIDTH + BAR_GAP)))
}

/**
 * 区間ごとの音量を、バーごとの音量に畳む
 *
 * @description
 * バー1本が受け持つ区間のうち、いちばん大きい音量を採る。
 * まだ録音していないバーは `undefined` になる
 */
export function barValues(
   levels: readonly number[],
   bars: number,
   slots: number,
): (number | undefined)[] {
   return Array.from({ length: bars }, (_, index) => {
      const start = Math.floor((index * slots) / bars)
      const end = Math.max(start + 1, Math.floor(((index + 1) * slots) / bars))

      let value: number | undefined
      for (let slot = start; slot < end && slot < levels.length; slot++) {
         const level = levels[slot]
         if (level !== undefined && (value === undefined || level > value)) {
            value = level
         }
      }
      return value
   })
}
