/**
 * 日時フォーマット用ユーティリティ関数
 *
 * @description
 * アプリケーション全体で使用する日時・時間のフォーマット関数を提供
 */

/**
 * 録音日時をフォーマット
 *
 * @param date フォーマット対象の日時
 * @returns 日本語ロケールでフォーマットされた日時文字列（例: 2025/01/15 14:30:45）
 *
 * @example
 * ```ts
 * const date = new Date('2025-01-15T14:30:45')
 * formatRecordedAt(date) // "2025/01/15 14:30:45"
 * ```
 */
export function formatRecordedAt(date: Date): string {
   return date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
   })
}

/**
 * 秒数をMM:SS形式にフォーマット
 *
 * @param seconds フォーマット対象の秒数
 * @returns MM:SS形式の時間文字列（例: 03:45）
 *
 * @description
 * NaN、Infinity、負の値を安全に処理し、00:00を返す
 *
 * @example
 * ```ts
 * formatTime(125) // "02:05"
 * formatTime(45)  // "00:45"
 * formatTime(NaN) // "00:00"
 * formatTime(-10) // "00:00"
 * ```
 */
export function formatTime(seconds: number): string {
   // NaN、Infinity、負の値をチェック
   if (!Number.isFinite(seconds) || seconds < 0) {
      return "00:00"
   }

   const mins = Math.floor(seconds / 60)
   const secs = Math.floor(seconds % 60)
   return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}
