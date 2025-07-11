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

import { motion } from "framer-motion"
import { memo } from "react"
import { HiMiniSpeakerWave } from "react-icons/hi2"
import type { ClusterBadgeProps, ClusterBadgeSize } from "./types"

export const ClusterBadge = memo<ClusterBadgeProps>(function ClusterBadge({
   count,
   size: sizeOverride,
   onClick,
   className = "",
}) {
   // 動的サイズ計算
   const getSize = (count: number): ClusterBadgeSize => {
      if (count <= 4) return "small"
      if (count <= 9) return "medium"
      return "large"
   }

   // 動的色計算
   const getVariant = (count: number) => {
      if (count <= 4) return "blue"
      if (count <= 9) return "green"
      if (count <= 19) return "orange"
      return "red"
   }

   const size = sizeOverride || getSize(count)
   const variant = getVariant(count)

   // サイズ設定
   const sizeConfig = {
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

   // バリエーション設定
   // 青: 4個以下
   // 緑: 5-9個
   // オレンジ: 10-19個
   // 赤: 20個以上
   const variantConfig = {
      blue: {
         bg: "bg-gradient-to-br from-blue-500 to-blue-600",
         border: "border-blue-300",
         shadow: "shadow-lg shadow-blue-500/30",
         ring: "ring-blue-400/50",
      },
      green: {
         bg: "bg-gradient-to-br from-green-500 to-green-600",
         border: "border-green-300",
         shadow: "shadow-lg shadow-green-500/30",
         ring: "ring-green-400/50",
      },
      orange: {
         bg: "bg-gradient-to-br from-orange-500 to-orange-600",
         border: "border-orange-300",
         shadow: "shadow-lg shadow-orange-500/30",
         ring: "ring-orange-400/50",
      },
      red: {
         bg: "bg-gradient-to-br from-red-500 to-red-600",
         border: "border-red-300",
         shadow: "shadow-lg shadow-red-500/30",
         ring: "ring-red-400/50",
      },
   } as const

   const currentSize = sizeConfig[size]
   const currentVariant = variantConfig[variant as keyof typeof variantConfig]

   const displayText = count > 99 ? "99+" : count.toString()

   const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation()
      onClick?.()
   }

   const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
         e.preventDefault()
         onClick?.()
      }
   }

   return (
      <div className="relative">
         {/* メインクラスタバッジ */}
         <motion.div
            className={`
               ${currentSize.container}
               ${currentVariant.bg}
               ${currentVariant.shadow}flex cursor-pointer items-center justify-center rounded-full border-2 border-white font-bold text-white backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:shadow-xl active:scale-95 ${className}
            `}
            onClick={handleClick}
            role="button"
            tabIndex={0}
            aria-label={`${count}個のピンが集まったクラスタ`}
            onKeyDown={handleKeyDown}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
               type: "spring",
               stiffness: 300,
               damping: 20,
            }}
         >
            {/* アイコンと数字のレイアウト */}
            <div className="flex items-center justify-center gap-1 pt-2">
               <HiMiniSpeakerWave
                  className={`${currentSize.icon} flex-shrink-0`}
                  aria-hidden="true"
               />
               <span className={`${currentSize.text} font-bold leading-tight`}>
                  {displayText}
               </span>
            </div>
         </motion.div>

         {/* パルス効果 */}
         <motion.div
            className={`absolute inset-0 rounded-full ${currentVariant.border}border-2 opacity-50 `}
            animate={{
               scale: [1, 1.4, 1],
               opacity: [0.5, 0, 0.5],
            }}
            transition={{
               duration: 2,
               repeat: Number.POSITIVE_INFINITY,
               ease: "easeInOut",
            }}
         />

         {/* ホバー時のリング効果 */}
         <motion.div
            className={`absolute inset-0 rounded-full ring-2 ${currentVariant.ring}opacity-0`}
            whileHover={{ opacity: 1, scale: 1.2 }}
            transition={{ duration: 0.2 }}
         />
      </div>
   )
})

export default ClusterBadge
