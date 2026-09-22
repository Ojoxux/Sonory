"use client"

import { clsx } from "clsx"
import { motion } from "motion/react"
import { EASE_OUT } from "@/utils/motion"
import {
   RIPPLE_BORDER_COLORS,
   RIPPLE_RINGS,
   RIPPLE_SIZE_SCALE,
} from "./constants"
import type { DropRippleEffectProps } from "./types"

/**
 * 雫が落ちるような波紋エフェクトコンポーネント
 *
 * @description
 * スライダーが右端に到達した時に、つまみの位置から波紋が広がるアニメーション。
 * 輪はつまみと同じ大きさから `scale` で広げる（幅と高さは動かさない）
 *
 * @param isActive エフェクトの有効状態
 * @param color 波紋の色（デフォルト: blue）
 * @param size 波紋のサイズ（デフォルト: medium）
 * @param className 追加のCSSクラス
 *
 * @example
 * ```tsx
 * <DropRippleEffect isActive={isSlideCompleted} color="white" />
 * ```
 */
export function DropRippleEffect({
   isActive,
   color = "blue",
   size = "medium",
   className = "",
}: DropRippleEffectProps) {
   if (!isActive) return null

   const multiplier = RIPPLE_SIZE_SCALE[size]

   return (
      <div
         aria-hidden="true"
         className={clsx("pointer-events-none absolute inset-0", className)}
      >
         {RIPPLE_RINGS.map((ring) => (
            <motion.span
               key={ring.scale}
               className={clsx(
                  "-translate-y-1/2 absolute top-1/2 right-1 size-12 rounded-full border-2",
                  RIPPLE_BORDER_COLORS[color],
               )}
               initial={{ scale: 1, opacity: ring.opacity }}
               animate={{ scale: ring.scale * multiplier, opacity: 0 }}
               transition={{
                  duration: ring.duration,
                  delay: ring.delay,
                  ease: EASE_OUT,
               }}
            />
         ))}
      </div>
   )
}
