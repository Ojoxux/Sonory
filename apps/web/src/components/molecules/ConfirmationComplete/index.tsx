"use client"

import { Check } from "lucide-react"
import { revealDelay } from "../RecordingInstructions/constants"
import type { ConfirmationCompleteProps } from "./types"

/**
 * 確認完了画面コンポーネント
 *
 * @description
 * 確認事項の確認完了後に表示される画面。
 * 子は `reveal` で順に出る
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
         <div
            className="reveal mb-4 grid size-20 place-items-center rounded-full bg-done-500/10"
            style={revealDelay(0)}
         >
            <Check
               aria-label="確認完了"
               className="size-10 text-done-400"
               strokeWidth={2}
            />
         </div>

         <div className="reveal max-w-sm text-center" style={revealDelay(1)}>
            <h2 className="mb-2 font-semibold text-white text-xl leading-tight tracking-tight">
               さあ、録音を始めましょう！
            </h2>
            <p className="text-neutral-300 text-sm leading-relaxed">
               下のスライダーを右にドラッグして録音を開始してください
            </p>
         </div>
      </div>
   )
}
