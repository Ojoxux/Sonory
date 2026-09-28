import type { Variants } from "motion/react"
import { DURATION, EASE_OUT } from "@/utils/motion"

/**
 * 子要素を順に出す間隔（秒）
 *
 * @description
 * 確認カードの子は6段（見出し・確認事項4つ・操作部）。最後の段が出揃うまで 150ms + 200ms
 */
export const REVEAL_STAGGER = 0.03

/** 確認済みを見せてから確認完了に切り替えるまで（ms） */
export const CONFIRM_HOLD_MS = 350

/**
 * 確認カード本体。閉じるときは開くより速くする
 */
export const CARD_VARIANTS: Variants = {
   hidden: { opacity: 0, scale: 0.96, y: 8 },
   shown: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
         duration: DURATION.menu,
         ease: EASE_OUT,
         staggerChildren: REVEAL_STAGGER,
      },
   },
   exit: {
      opacity: 0,
      scale: 0.97,
      transition: { duration: DURATION.press, ease: EASE_OUT },
   },
}

/**
 * 確認完了に切り替えたあとの中身。スライダーまで 80ms + 200ms で出揃う
 */
export const COMPLETE_VARIANTS: Variants = {
   shown: { transition: { staggerChildren: 0.04 } },
}

/**
 * カード内で順に出す子要素
 */
export const REVEAL_VARIANTS: Variants = {
   hidden: { opacity: 0, y: 8 },
   shown: {
      opacity: 1,
      y: 0,
      transition: { duration: DURATION.menu, ease: EASE_OUT },
   },
}
