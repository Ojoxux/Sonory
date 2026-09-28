"use client"

import { Check } from "lucide-react"
import { motion } from "motion/react"
import { REVEAL_VARIANTS } from "../RecordingInstructions/constants"
import type { ConfirmationCompleteProps } from "./types"

/**
 * 確認完了画面コンポーネント
 *
 * @description
 * 確認事項の確認完了後に表示される画面。
 * 子は親の `staggerChildren` に乗って順に出る
 *
 * @param className 追加のCSSクラス
 */
export function ConfirmationComplete({
   className = "",
}: ConfirmationCompleteProps) {
   return (
      <div
         className={`flex flex-col items-center justify-center p-4 ${className}`}
      >
         <motion.div
            variants={REVEAL_VARIANTS}
            className="mb-4 grid size-20 place-items-center rounded-full bg-done-500/10"
         >
            <Check
               aria-label="確認完了"
               className="size-10 text-done-400"
               strokeWidth={2}
            />
         </motion.div>

         <motion.div
            variants={REVEAL_VARIANTS}
            className="max-w-sm text-center"
         >
            <h2 className="mb-2 font-semibold text-white text-xl leading-tight tracking-tight">
               さあ、録音を始めましょう！
            </h2>
            <p className="text-neutral-300 text-sm leading-relaxed">
               下のスライダーを右にドラッグして録音を開始してください
            </p>
         </motion.div>
      </div>
   )
}
