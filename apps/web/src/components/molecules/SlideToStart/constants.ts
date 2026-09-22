/** トラックの幅からつまみの可動域を引くための値（左右の p-1 と w-16 のつまみ） */
export const KNOB_TRAVEL_INSET = 8 + 64

/** これより奥まで引いたら完了（可動域に対する割合） */
export const COMPLETE_DISTANCE_RATIO = 0.9

/**
 * 弾いたとみなす平均速度（px/ms）
 *
 * @description
 * 端まで届かなくても、素早く弾けば完了させる
 */
export const FLICK_VELOCITY = 0.11

/** 弾いた場合でも、誤操作を避けるためにこれだけは引かせる（可動域に対する割合） */
export const FLICK_MIN_DISTANCE_RATIO = 0.3
