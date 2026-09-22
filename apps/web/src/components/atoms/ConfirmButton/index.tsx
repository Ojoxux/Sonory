"use client"

import { Check } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { DURATION, EASE_OUT } from "@/utils/motion"
import { Button } from "../Button"
import { CONFIRM_BUTTON_LABELS } from "./constants"
import type { ConfirmButtonProps } from "./types"

/**
 * 確認ボタンコンポーネント
 *
 * @description
 * 確認事項に同意するためのボタン。押下後はその場で確認済みに変わる
 *
 * @param onClick クリック時のコールバック
 * @param isConfirmed 確認済みかどうか
 * @param isDisabled 押せない状態かどうか（マイク未許可など）
 * @param className 追加のCSSクラス
 */
export function ConfirmButton({
   onClick,
   isConfirmed,
   isDisabled = false,
   className = "",
}: ConfirmButtonProps) {
   const label = isConfirmed ? "confirmed" : isDisabled ? "disabled" : "ready"

   return (
      <Button
         intent={isConfirmed ? "done" : isDisabled ? "secondary" : "accent"}
         block
         disabled={isDisabled && !isConfirmed}
         // disabled にすると半透明になるため、確認済みは押下だけ無効にする
         aria-disabled={isConfirmed || undefined}
         onClick={isConfirmed ? undefined : onClick}
         className={`relative overflow-hidden ${isConfirmed ? "pointer-events-none" : ""} ${className}`}
      >
         <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
               key={label}
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               transition={{ duration: DURATION.hint, ease: EASE_OUT }}
               className="flex items-center justify-center gap-2"
            >
               {isConfirmed && <Check aria-hidden="true" className="size-5" />}
               {CONFIRM_BUTTON_LABELS[label]}
            </motion.span>
         </AnimatePresence>
      </Button>
   )
}
