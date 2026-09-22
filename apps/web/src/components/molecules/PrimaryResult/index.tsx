"use client"

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
      <div className="rounded-xl border border-done-500/30 bg-done-500/10 p-4">
         <div className="mb-1.5 flex items-center justify-between">
            <span className="font-semibold text-base text-done-300">
               {result.label}
            </span>
            <span className="font-mono font-semibold text-done-400 text-sm">
               {formatConfidence(result.confidence)}
            </span>
         </div>
         <div className="flex items-center gap-1.5 text-done-300/60 text-xs">
            <span className="inline-block h-1 w-1 animate-pulse rounded-full bg-done-400" />
            最も可能性が高い
         </div>
      </div>
   )
}
