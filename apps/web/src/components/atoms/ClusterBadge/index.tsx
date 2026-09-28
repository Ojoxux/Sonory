/**
 * クラスタバッジコンポーネント
 *
 * @description 複数のピンがクラスタリングされた時に表示するバッジ
 * ピン数に応じてサイズと色が変化する
 * @example
 * ```tsx
 * <ClusterBadge
 *   count={5}
 *   size="medium"
 *   onClick={() => handleClusterClick()}
 * />
 * ```
 */

"use client"

import { motion } from "motion/react"
import { memo } from "react"
import { HiMiniSpeakerWave } from "react-icons/hi2"
import { DURATION, EASE_OUT } from "@/utils/motion"
import type { ClusterBadgeProps, ClusterBadgeSize } from "./types"

const SIZE_CONFIG = {
   small: {
      container: "w-10 h-10",
      text: "text-sm",
      icon: "w-4 h-4",
   },
   medium: {
      container: "w-12 h-12",
      text: "text-base",
      icon: "w-5 h-5",
   },
   large: {
      container: "w-14 h-14",
      text: "text-lg",
      icon: "w-6 h-6",
   },
} as const

// 色はピンの密度を表すデータなので、役割色ではなく色相で指定する
// 青: 4個以下 / 緑: 5-9個 / オレンジ: 10-19個 / 赤: 20個以上
const VARIANT_CONFIG = {
   blue: "bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30",
   green: "bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/30",
   orange:
      "bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30",
   red: "bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/30",
} as const

function getSize(count: number): ClusterBadgeSize {
   if (count <= 4) return "small"
   if (count <= 9) return "medium"
   return "large"
}

function getVariant(count: number): keyof typeof VARIANT_CONFIG {
   if (count <= 4) return "blue"
   if (count <= 9) return "green"
   if (count <= 19) return "orange"
   return "red"
}

export const ClusterBadge = memo<ClusterBadgeProps>(function ClusterBadge({
   count,
   size: sizeOverride,
   onClick,
   className = "",
}) {
   const currentSize = SIZE_CONFIG[sizeOverride ?? getSize(count)]
   const variantClass = VARIANT_CONFIG[getVariant(count)]

   const displayText = count > 99 ? "99+" : count.toString()

   const handleClick = (e: React.MouseEvent): void => {
      e.stopPropagation()
      onClick?.()
   }

   // ズームのたびに作り直されるので、入りは短く小さく
   return (
      <motion.div
         initial={{ opacity: 0, scale: 0.9 }}
         animate={{ opacity: 1, scale: 1 }}
         transition={{ duration: DURATION.hint, ease: EASE_OUT }}
      >
         <button
            type="button"
            className={`${currentSize.container} ${variantClass} flex cursor-pointer touch-manipulation items-center justify-center gap-1 rounded-full border-2 border-white font-bold text-white transition-transform duration-press ease-out hover:scale-105 active:scale-97 ${className}`}
            onClick={handleClick}
            aria-label={`${count}個のピンが集まったクラスタ`}
         >
            <HiMiniSpeakerWave
               className={`${currentSize.icon} flex-shrink-0`}
               aria-hidden="true"
            />
            <span className={`${currentSize.text} font-bold leading-none`}>
               {displayText}
            </span>
         </button>
      </motion.div>
   )
})

export default ClusterBadge
