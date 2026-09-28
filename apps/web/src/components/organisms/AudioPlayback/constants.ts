import { DURATION, EASE_OUT } from "@/utils/motion"

/** 画面の差し替え。重なる2枚をぼかしで1つの変化に見せる */
export const VIEW_HIDDEN = { opacity: 0, filter: "blur(2px)" } as const
export const VIEW_SHOWN = { opacity: 1, filter: "blur(0px)" } as const

/** 差し替えと、それに伴う高さの補間の両方に使う */
export const VIEW_SWAP_TRANSITION = {
   duration: DURATION.menu,
   ease: EASE_OUT,
} as const
