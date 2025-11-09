"use client"

import { AnimatePresence, motion } from "framer-motion"
import { formatConfidence } from "../PrimaryResult/utils"
import { useAccordionToggle } from "./hooks"
import type { OtherResultsAccordionProps } from "./types"

/**
 * その他の候補アコーディオンコンポーネント
 *
 * @description
 * 主要結果以外のAI分析候補を折りたたみ表示する
 * 2位と3位の候補を表示（最大2件）
 *
 * @param results 分析結果の配列
 * @param isFullHeight フルハイト表示かどうか
 *
 * @example
 * ```tsx
 * <OtherResultsAccordion
 *   results={[
 *     { label: "犬の吠え声", confidence: 0.85 },
 *     { label: "猫の鳴き声", confidence: 0.12 },
 *     { label: "鳥のさえずり", confidence: 0.03 }
 *   ]}
 *   isFullHeight={true}
 * />
 * ```
 */
export function OtherResultsAccordion({
   results,
   isFullHeight,
}: OtherResultsAccordionProps) {
   const { isOpen, toggle } = useAccordionToggle()

   if (results.length <= 1 || !isFullHeight) {
      return null
   }

   return (
      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
         <button
            type="button"
            onClick={toggle}
            aria-expanded={isOpen}
            aria-label="その他の候補を表示"
            className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-white/5"
         >
            <span className="font-medium text-white/60 text-xs">
               その他の候補 ({results.length - 1}件)
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
                     {results.slice(1, 3).map((result, index) => (
                        <div
                           key={`${result.label}-${index + 1}`}
                           className="flex items-center justify-between py-1"
                        >
                           <span className="text-neutral-300 text-sm">
                              {result.label}
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
