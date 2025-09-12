"use client"

import { motion } from "framer-motion"
import type { ReactElement } from "react"
import { SvgIcon } from "./SvgIcon"
import type { SoundPinIconProps } from "./types"
import { useSoundPinIcon } from "./useSoundPinIcon"

/**
 * 音声ピン用のアイコンコンポーネント
 *
 * @description
 * 音声録音地点を表すマップピンアイコン。
 * 音波をモチーフにしたデザインで、美しいアニメーション効果を含みます。
 * 音分類結果に応じてアイコンと色が変化します。
 *
 * @param size - アイコンのサイズ（'small' | 'medium' | 'large'）
 * @param variant - デザインバリエーション（'default' | 'active' | 'analyzing'）
 * @param className - 追加のCSSクラス
 * @param onClick - クリック時のコールバック関数
 * @param animated - アニメーション効果の有効/無効
 * @param primaryLabel - 音分類の主要ラベル
 * @param primaryConfidence - 音分類の信頼度
 *
 * @example
 * ```tsx
 * <SoundPinIcon
 *   size="medium"
 *   variant="default"
 *   primaryLabel="車の音"
 *   primaryConfidence={0.85}
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
   primaryLabel,
   primaryConfidence,
}: SoundPinIconProps): ReactElement {
   // フックから設定と関数を取得
   const { getClassificationStyle, getCurrentSize, getCurrentVariant } =
      useSoundPinIcon()
   const classificationStyle = getClassificationStyle(primaryLabel)

   const currentSize = getCurrentSize(size)
   const currentVariant = getCurrentVariant(variant)

   return (
      <div className="relative">
         {/* メインピンボタン */}
         <motion.button
            type="button"
            onClick={onClick}
            className={`relative z-10 flex items-center justify-center ${currentSize.container}
               ${currentVariant.bg}
               ${currentVariant.shadow} ${currentVariant.border} cursor-pointer touch-manipulation rounded-full transition-all duration-300 hover:scale-110 active:scale-95 ${className}
            `}
            whileHover={animated ? { scale: 1.1 } : {}}
            whileTap={animated ? { scale: 0.95 } : {}}
            aria-label={`音声録音地点: ${primaryLabel || "未分類"}`}
         >
            {/* SVGアイコンを表示 */}
            <SvgIcon
               iconName={classificationStyle.iconName}
               size={size}
               className={currentVariant.icon}
            />

            {/* 分析中のパルス効果 */}
            {variant === "analyzing" && animated && (
               <motion.div
                  className="absolute inset-0 rounded-full bg-orange-200/30"
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
