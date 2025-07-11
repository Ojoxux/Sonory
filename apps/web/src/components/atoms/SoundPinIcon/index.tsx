"use client"

import { motion } from "framer-motion"
import type { ReactElement } from "react"
import { HiSpeakerWave } from "react-icons/hi2"
import type { SoundPinIconProps } from "./types"

/**
 * 音声ピン用のアイコンコンポーネント
 *
 * @description
 * 音声録音地点を表すマップピンアイコン。
 * 音波をモチーフにしたデザインで、美しいアニメーション効果を含みます。
 *
 * @param size - アイコンのサイズ（'small' | 'medium' | 'large'）
 * @param variant - デザインバリエーション（'default' | 'active' | 'analyzing'）
 * @param className - 追加のCSSクラス
 * @param onClick - クリック時のコールバック関数
 * @param animated - アニメーション効果の有効/無効
 *
 * @example
 * ```tsx
 * <SoundPinIcon
 *   size="medium"
 *   variant="default"
 *   onClick={() => console.log('ピンがクリックされました')}
 *   animated={true}
 * />
 * ```
 */
export function SoundPinIcon({
   size = "medium",
   variant = "default",
   className = "",
   onClick,
   animated = true,
}: SoundPinIconProps): ReactElement {
   const sizeConfig = {
      small: {
         container: "w-8 h-8",
         icon: "w-3 h-3",
         ripple: "w-12 h-12",
      },
      medium: {
         container: "w-10 h-10",
         icon: "w-4 h-4",
         ripple: "w-16 h-16",
      },
      large: {
         container: "w-12 h-12",
         icon: "w-5 h-5",
         ripple: "w-20 h-20",
      },
   } as const

   const variantConfig = {
      default: {
         bg: "bg-gradient-to-br from-blue-500 to-blue-600",
         border: "border-blue-300",
         shadow: "shadow-lg shadow-blue-500/25",
         icon: "text-white",
      },
      active: {
         bg: "bg-gradient-to-br from-green-500 to-green-600",
         border: "border-green-300",
         shadow: "shadow-lg shadow-green-500/25",
         icon: "text-white",
      },
      analyzing: {
         bg: "bg-gradient-to-br from-orange-500 to-orange-600",
         border: "border-orange-300",
         shadow: "shadow-lg shadow-orange-500/25",
         icon: "text-white",
      },
   } as const

   const currentSize = sizeConfig[size as keyof typeof sizeConfig]
   const currentVariant = variantConfig[variant as keyof typeof variantConfig]

   return (
      <div className="relative">
         {/* メインピンボタン */}
         <motion.button
            type="button"
            onClick={onClick}
            className={`relative z-10 flex items-center justify-center ${currentSize.container}
               ${currentVariant.bg}
               ${currentVariant.shadow} border-2 ${currentVariant.border} rounded-full cursor-pointer touch-manipulation transition-all duration-300 hover:scale-110 hover:shadow-xl active:scale-95 ${className}
            `}
            whileHover={animated ? { scale: 1.1 } : {}}
            whileTap={animated ? { scale: 0.95 } : {}}
            aria-label="音声録音地点"
         >
            {/* 音波アイコン */}
            <HiSpeakerWave
               className={`${currentSize.icon} ${currentVariant.icon}`}
               aria-hidden="true"
            />

            {/* 分析中のパルス効果 */}
            {variant === "analyzing" && animated && (
               <motion.div
                  className="absolute inset-0 rounded-full bg-white/20"
                  animate={{
                     scale: [1, 1.2, 1],
                     opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                     duration: 1,
                     repeat: Number.POSITIVE_INFINITY,
                     ease: "easeInOut",
                  }}
               />
            )}
         </motion.button>

         {/* 選択状態のリング */}
         {variant === "active" && (
            <motion.div
               className="absolute inset-0 rounded-full border-2 border-green-400"
               style={{
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
               }}
               animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.8, 0.3, 0.8],
               }}
               transition={{
                  duration: 1.5,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
               }}
            />
         )}
      </div>
   )
}
