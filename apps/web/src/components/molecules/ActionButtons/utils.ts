import type { PinCreationStatus } from "./types"

/**
 * ボタンを無効化すべきかどうかを判定
 *
 * @param pinCreationStatus ピン作成ステータス
 * @param hasPosition 現在位置が存在するか
 * @returns ボタンを無効化すべき場合は true
 *
 * @example
 * ```ts
 * shouldDisableButton("creating", true)  // true（作成中）
 * shouldDisableButton("idle", false)     // true（位置情報なし）
 * shouldDisableButton("idle", true)      // false（実行可能）
 * ```
 */
export function shouldDisableButton(
   pinCreationStatus: PinCreationStatus,
   hasPosition: boolean,
): boolean {
   return pinCreationStatus === "creating" || !hasPosition
}

/**
 * ボタンに表示するテキストを取得
 *
 * @param pinCreationStatus ピン作成ステータス
 * @param hasPosition 現在位置が存在するか
 * @returns ボタンに表示するテキスト
 *
 * @example
 * ```ts
 * getButtonText("creating", true)   // "ピン作成中..."
 * getButtonText("idle", false)      // "位置情報が必要です"
 * getButtonText("idle", true)       // "マップにピンを配置"
 * ```
 */
export function getButtonText(
   pinCreationStatus: PinCreationStatus,
   hasPosition: boolean,
): string {
   if (pinCreationStatus === "creating") {
      return "ピン作成中..."
   }
   if (!hasPosition) {
      return "位置情報が必要です"
   }
   return "マップにピンを配置"
}
