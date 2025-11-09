import { AnimatePresence, motion } from "framer-motion"
import type { OtherResultsProps } from "./types"

/**
 * その他の候補コンポーネント
 *
 * @description
 * 主要結果以外の音声分類候補を折りたたみ可能なリストで表示します。
 * アニメーション付きで展開・収納できます。
 *
 * @param results - 表示する分類結果の配列
 * @param isOpen - 開閉状態（true: 開く、false: 閉じる）
 * @param toggle - 開閉を切り替える関数
 * @param formatConfidence - 信頼度を表示形式にフォーマットする関数
 *
 * @example
 * ```tsx
 * <OtherResults
 *   results={[
 *     { label: "Speech", confidence: 0.45 },
 *     { label: "Nature", confidence: 0.23 }
 *   ]}
 *   isOpen={isOpen}
 *   toggle={() => setIsOpen(!isOpen)}
 *   formatConfidence={(conf) => `${Math.round(conf * 100)}%`}
 * />
 * ```
 */
export function OtherResults({
   results,
   isOpen,
   toggle,
   formatConfidence,
}: OtherResultsProps) {
   if (results.length === 0) return null

   return (
      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
         <button
            type="button"
            onClick={toggle}
            className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-white/5"
         >
            <span className="font-medium text-white/60 text-xs">
               その他の候補 ({results.length}件)
            </span>
            <motion.span
               animate={{ rotate: isOpen ? 180 : 0 }}
               transition={{ duration: 0.2 }}
               className="text-sm text-white/60"
            >
               ▼
            </motion.span>
         </button>

         <AnimatePresence initial={false}>
            {isOpen && (
               <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden"
               >
                  <div className="space-y-2 px-3 pb-3">
                     {results.map((result, index) => (
                        <div
                           key={`${result.label}-${index + 1}`}
                           className="flex items-center justify-between py-1"
                        >
                           <span className="text-neutral-300 text-sm">
                              {result.label === "unknown"
                                 ? "未分類"
                                 : result.label}
                           </span>
                           <span className="font-mono text-neutral-400 text-xs">
                              {formatConfidence(result.confidence)}
                           </span>
                        </div>
                     ))}
                  </div>
               </motion.div>
            )}
         </AnimatePresence>
      </div>
   )
}
