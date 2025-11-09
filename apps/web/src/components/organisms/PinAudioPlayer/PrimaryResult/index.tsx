import { motion } from "framer-motion"
import type { PrimaryResultProps } from "./types"

/**
 * 主要結果コンポーネント
 *
 * @description
 * 音声分類の最も可能性が高い結果を強調表示します。
 * 緑色のスタイリングとアニメーションで視覚的に目立たせます。
 *
 * @param result - 表示する分類結果（ラベルと信頼度）
 * @param formatConfidence - 信頼度を表示形式にフォーマットする関数
 *
 * @example
 * ```tsx
 * <PrimaryResult
 *   result={{ label: "Music", confidence: 0.89 }}
 *   formatConfidence={(conf) => `${Math.round(conf * 100)}%`}
 * />
 * ```
 */
export function PrimaryResult({
   result,
   formatConfidence,
}: PrimaryResultProps) {
   const displayLabel = result.label === "unknown" ? "未分類" : result.label

   return (
      <motion.div
         initial={{ opacity: 0, scale: 0.95 }}
         animate={{ opacity: 1, scale: 1 }}
         transition={{ delay: 0.1 }}
         className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 backdrop-blur-sm"
      >
         <div className="mb-1.5 flex items-center justify-between">
            <span className="font-semibold text-base text-green-300">
               {displayLabel}
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
