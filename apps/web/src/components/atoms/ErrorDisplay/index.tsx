"use client"

import { motion } from "framer-motion"
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
      <motion.div
         className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 backdrop-blur-sm"
         initial={{ opacity: 0, scale: 0.9 }}
         animate={{ opacity: 1, scale: 1 }}
      >
         <span className="text-red-300 text-sm leading-relaxed">
            {pinCreationError || uploadError || error?.message}
         </span>
      </motion.div>
   )
}
