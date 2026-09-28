import type { Variants } from "motion/react"
import { DURATION, EASE_OUT } from "@/utils/motion"

/** 子要素を順に出す間隔（ms） */
export const REVEAL_STAGGER_MS = 30

/** 確認済みを見せてから確認完了に切り替えるまで（ms） */
export const CONFIRM_HOLD_MS = 350

/**
 * `reveal` の開始をずらす
 *
 * @param step 何番目に出すか。確認カードは6段（見出し・確認事項4つ・操作部）
 */
export function revealDelay(step: number): { animationDelay: string } {
   return { animationDelay: `${step * REVEAL_STAGGER_MS}ms` }
}

/**
 * 確認カード本体。閉じるときは開くより速くする
 *
 * @description
 * 中身の段階表示は CSS の `reveal` が受け持つ。`staggerChildren` で子を止めると、
 * 何らかの理由で親の遷移が走らなかったときに中身が見えなくなる
 */
export const CARD_VARIANTS: Variants = {
   hidden: { opacity: 0, scale: 0.96, y: 8 },
   shown: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: DURATION.menu, ease: EASE_OUT },
   },
   exit: {
      opacity: 0,
      scale: 0.97,
      transition: { duration: DURATION.press, ease: EASE_OUT },
   },
}
