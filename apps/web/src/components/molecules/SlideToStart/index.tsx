"use client"

import { clsx } from "clsx"
import { ArrowRight } from "lucide-react"
import {
   animate,
   motion,
   type PanInfo,
   useMotionValue,
   useTransform,
} from "motion/react"
import { useEffect, useRef, useState } from "react"
import { DURATION, EASE_OUT } from "@/utils/motion"
import { DropRippleEffect } from "../../atoms/DropRippleEffect"
import {
   COMPLETE_DISTANCE_RATIO,
   FLICK_MIN_DISTANCE_RATIO,
   FLICK_VELOCITY,
   KNOB_TRAVEL_INSET,
} from "./constants"
import type { SlideToStartProps } from "./types"

/**
 * スライドして開始するコンポーネント
 *
 * @description
 * ドラッグ操作で特定のアクションを実行するスライドバー。
 * 端まで引くか、素早く弾けば完了する。波紋は `onComplete` と同時に出す
 *
 * @param onComplete スライド完了時のコールバック
 * @param disabled 無効状態
 * @param text 表示テキスト
 * @param className 追加のCSSクラス
 */
export function SlideToStart({
   onComplete,
   disabled = false,
   text = "スライドして開始",
   className = "",
}: SlideToStartProps) {
   const containerRef = useRef<HTMLDivElement>(null)
   const dragStartedAt = useRef(0)
   const isCompleted = useRef(false)
   const [slideDistance, setSlideDistance] = useState(160)
   const [showDropEffect, setShowDropEffect] = useState(false)
   const x = useMotionValue(0)
   const opacity = useTransform(x, [0, slideDistance], [1, 0])

   useEffect(() => {
      const updateSlideDistance = () => {
         if (containerRef.current) {
            const travel = containerRef.current.offsetWidth - KNOB_TRAVEL_INSET
            setSlideDistance(Math.max(travel, 50))
         }
      }

      updateSlideDistance()
      window.addEventListener("resize", updateSlideDistance)
      return () => window.removeEventListener("resize", updateSlideDistance)
   }, [])

   const handleDragEnd = (
      _event: MouseEvent | TouchEvent | PointerEvent,
      info: PanInfo,
   ) => {
      if (disabled || isCompleted.current) return

      const offset = Math.max(info.offset.x, 0)
      const elapsed = Math.max(performance.now() - dragStartedAt.current, 1)
      const isFlick =
         offset / elapsed > FLICK_VELOCITY &&
         offset >= slideDistance * FLICK_MIN_DISTANCE_RATIO

      if (offset >= slideDistance * COMPLETE_DISTANCE_RATIO || isFlick) {
         isCompleted.current = true
         animate(x, slideDistance, { duration: DURATION.press, ease: EASE_OUT })
         setShowDropEffect(true)
         onComplete()
         return
      }

      animate(x, 0, { duration: DURATION.menu, ease: EASE_OUT })
   }

   return (
      <div
         ref={containerRef}
         className={clsx(
            "relative isolate h-14 w-full rounded-full p-1",
            disabled ? "cursor-not-allowed bg-neutral-700" : "bg-white",
            className,
         )}
      >
         <DropRippleEffect isActive={showDropEffect} color="white" />

         <motion.div
            drag={disabled ? false : "x"}
            dragConstraints={{ left: 0, right: slideDistance }}
            dragElastic={0}
            dragMomentum={false}
            onDragStart={() => {
               dragStartedAt.current = performance.now()
            }}
            onDragEnd={handleDragEnd}
            whileTap={disabled ? {} : { scale: 0.97 }}
            style={{ x }}
            className={clsx(
               "relative z-10 grid h-full w-16 place-items-center rounded-full",
               disabled
                  ? "cursor-not-allowed bg-neutral-600 text-neutral-400"
                  : "cursor-grab bg-black text-white active:cursor-grabbing",
            )}
         >
            <ArrowRight aria-hidden="true" className="size-5" />
         </motion.div>
         <motion.p
            style={{ opacity }}
            className={clsx(
               "-translate-y-1/2 absolute top-1/2 right-5 font-semibold text-sm tracking-tight",
               disabled ? "text-neutral-400" : "text-black",
            )}
         >
            {text}
         </motion.p>
      </div>
   )
}
