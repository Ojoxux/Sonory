import { DURATION, EASE_OUT } from "@/utils/motion"

/** 録音ボタン。確認カードと入れ替わるので、消えるときは出るより速く */
export const RECORD_BUTTON_MOTION = {
   initial: { opacity: 0, scale: 0.95 },
   animate: {
      opacity: 1,
      scale: 1,
      transition: { duration: DURATION.menu, ease: EASE_OUT },
   },
   exit: {
      opacity: 0,
      scale: 0.95,
      transition: { duration: DURATION.press, ease: EASE_OUT },
   },
} as const

/** 録音シート上端の、収納時の1行と展開時のヘッダーの入れ替え */
export const CROSSFADE = {
   initial: { opacity: 0 },
   animate: { opacity: 1 },
   exit: { opacity: 0 },
   transition: { duration: DURATION.hint, ease: EASE_OUT },
} as const
