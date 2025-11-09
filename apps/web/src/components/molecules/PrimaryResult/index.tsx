"use client"

import { motion } from "framer-motion"
import type { PrimaryResultProps } from "./types"
import { formatConfidence } from "./utils"

/**
 * 最も可能性が高いAI分析結果を表示するコンポーネント
 *
 * @description
 * AI分析の最も可能性が高い結果を表示する
 * アニメーション付きで視覚的に強調表示
 *
 * @param result 最も可能性が高いAI分析結果
 *
 * @example
 * ```tsx
 * <PrimaryResult
 *   result={{ label: "犬の吠え声", confidence: 0.85 }}
 * />
 * ```
 */
export function PrimaryResult({ result }: PrimaryResultProps) {
   return (
      <motion.div
         initial={{ opacity: 0, scale: 0.95 }}
         animate={{ opacity: 1, scale: 1 }}
         transition={{ delay: 0.1 }}
         className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 backdrop-blur-sm"
      >
         <div className="mb-1.5 flex items-center justify-between">
            <span className="font-semibold text-base text-green-300">
               {result.label}
            </span>
            <span className="font-mono font-semibold text-green-400 text-sm">
               {formatConfidence(result.confidence)}
            </span>
         </div>
         <div className="flex items-center gap-1.5 text-green-300/60 text-xs">
            <span className="inline-block h-1 w-1 animate-pulse rounded-full bg-green-400" />
            最も可能性が高い
         </div>
      </motion.div>
   )
}
