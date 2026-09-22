"use client"

import type { ErrorDisplayProps } from "./types"

/**
 * エラー表示コンポーネント
 *
 * @description
 * エラーメッセージを視覚的に表示する
 * エラーが存在しない場合は何も表示しない
 *
 * @param error エラーオブジェクト
 * @param uploadError アップロードエラーメッセージ
 * @param pinCreationError ピン作成エラーメッセージ
 *
 * @example
 * ```tsx
 * <ErrorDisplay error={new Error("エラーが発生しました")} />
 * ```
 */
export function ErrorDisplay({
   error,
   uploadError,
   pinCreationError,
}: ErrorDisplayProps) {
   if (!error && !uploadError && !pinCreationError) {
      return null
   }

   return (
      <div
         role="alert"
         className="rounded-xl border border-danger-500/30 bg-danger-500/10 p-4"
      >
         <span className="text-danger-300 text-sm leading-relaxed">
            {pinCreationError || uploadError || error?.message}
         </span>
      </div>
   )
}
