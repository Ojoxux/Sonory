"use client"

import { motion } from "motion/react"
import type { FallbackWarningProps } from "./types"

/**
 * フォールバック警告コンポーネント
 *
 * @description
 * オフライン分析結果が使用されていることを警告表示する
 * フォールバックが使用されていない場合は何も表示しない
 *
 * @param fallbackUsed フォールバックが使用されたかどうか
 *
 * @example
 * ```tsx
 * <FallbackWarning fallbackUsed={true} />
 * ```
 */
export function FallbackWarning({ fallbackUsed }: FallbackWarningProps) {
   if (!fallbackUsed) {
      return null
   }

   return (
      <motion.div
         className="rounded-xl border border-warn-500/30 bg-warn-500/10 p-4 backdrop-blur-sm"
         initial={{ opacity: 0, scale: 0.9 }}
         animate={{ opacity: 1, scale: 1 }}
      >
         <span className="text-sm text-warn-300 leading-relaxed">
            ⚠️ オフライン分析結果を表示中
         </span>
      </motion.div>
   )
}
