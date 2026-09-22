import { DURATION, EASE_OUT } from "@/utils/motion"

/** 収納時に見せる高さ（px）。ハンドル 28px + 行 64px + 下余白 24px */
export const COLLAPSED_VISIBLE_HEIGHT = 116

/** 離したときにこれより速ければ（px/ms）、位置に関係なくその向きへスナップする */
export const SNAP_VELOCITY = 0.11

/** スナップ。途中で離しても指の速度を引き継いで戻る */
export const SNAP_SPRING = {
   type: "spring",
   visualDuration: DURATION.sheet,
   bounce: 0.1,
} as const

export const SHEET_EXIT_TRANSITION = {
   duration: DURATION.menu,
   ease: EASE_OUT,
} as const
