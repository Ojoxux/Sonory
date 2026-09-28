/**
 * motion（JS アニメーション）用のイージングと時間
 *
 * @description
 * 値は `app/globals.css` の `@theme` と同じ。CSS で書けるものは CSS のユーティリティを使い、
 * これは motion の `transition` に渡すときだけ使う。ずれは `motion.test.ts` が検出する
 */
export const EASE_OUT = [0.23, 1, 0.32, 1] as const
export const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const
export const EASE_DRAWER = [0.32, 0.72, 0, 1] as const

/** 秒 */
export const DURATION = {
   press: 0.14,
   hint: 0.16,
   menu: 0.2,
   sheet: 0.32,
} as const
