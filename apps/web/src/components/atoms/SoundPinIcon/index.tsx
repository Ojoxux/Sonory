"use client"

import { motion } from "framer-motion"
import type { ReactElement } from "react"
import { SvgIcon } from "./SvgIcon"
import type { SoundPinIconProps } from "./types"

/**
 * 音分類結果に応じたアイコンを決定する
 */
function getClassificationStyle(primaryLabel?: string) {
   const label = primaryLabel?.toLowerCase() || ""

   // 車両・交通関連
   if (
      label.includes("車の音") ||
      label.includes("car") ||
      label.includes("vehicle") ||
      label.includes("バイクの音") ||
      label.includes("motorcycle") ||
      label.includes("bike") ||
      label.includes("トラックの音") ||
      label.includes("truck") ||
      label.includes("バスの音") ||
      label.includes("bus")
   ) {
      return {
         iconName: "MapPin_VehicleRelated",
      }
   }

   // 鉄道関連
   if (
      label.includes("電車の音") ||
      label.includes("train") ||
      label.includes("Rail transport") ||
      label.includes("Train horn") ||
      label.includes("Railroad car, train wagon")
   ) {
      return {
         iconName: "MapPin_RailwayRelated",
      }
   }

   // 音楽関連
   if (
      label.includes("音楽") ||
      label.includes("music") ||
      label.includes("song") ||
      label.includes("楽器") ||
      label.includes("instrument")
   ) {
      return {
         iconName: "MapPin_MusicRelated",
      }
   }

   // 生活音・人の声
   if (
      label.includes("人の声") ||
      label.includes("speech") ||
      label.includes("voice") ||
      label.includes("話し声") ||
      label.includes("会話") ||
      label.includes("生活") ||
      label.includes("life")
   ) {
      return {
         iconName: "MapPin_SoundsOfLife",
      }
   }

   // 自然音
   if (
      label.includes("鳥の鳴き声") ||
      label.includes("bird") ||
      label.includes("Chirp, tweet") ||
      label.includes("雨音") ||
      label.includes("rain") ||
      label.includes("風の音") ||
      label.includes("wind") ||
      label.includes("Wind noise (microphone)") ||
      label.includes("水の音") ||
      label.includes("Water") ||
      label.includes("Stream") ||
      label.includes("雷の音") ||
      label.includes("Thunder") ||
      label.includes("Thunderstorm")
   ) {
      return {
         iconName: "MapPin_NatureSounds",
      }
   }

   // 室内・建物音
   if (
      label.includes("建物") ||
      label.includes("building") ||
      label.includes("室内") ||
      label.includes("indoor") ||
      label.includes("オフィス") ||
      label.includes("office") ||
      label.includes("家") ||
      label.includes("home")
   ) {
      return {
         iconName: "MapPin_IndoorSound",
      }
   }

   // 工事・作業音
   if (
      label.includes("工事") ||
      label.includes("construction") ||
      label.includes("建設") ||
      label.includes("作業") ||
      label.includes("work") ||
      label.includes("機械") ||
      label.includes("machine")
   ) {
      return {
         iconName: "MapPin_ConstructionNoise",
      }
   }

   // デフォルト
   return {
      iconName: "MapPin_default",
   }
}

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
   const sizeConfig = {
      small: {
         container: "w-10 h-10", // 8x8 → 10x10
         icon: "w-4 h-4", // 3x3 → 4x4
         ripple: "w-16 h-16", // 12x12 → 16x16
      },
      medium: {
         container: "w-14 h-14", // 10x10 → 14x14
         icon: "w-6 h-6", // 4x4 → 6x6
         ripple: "w-20 h-20", // 16x16 → 20x20
      },
      large: {
         container: "w-16 h-16", // 12x12 → 16x16
         icon: "w-7 h-7", // 5x5 → 7x7
         ripple: "w-24 h-24", // 20x20 → 24x24
      },
   } as const

   // 分類結果に応じたスタイルを取得
   const classificationStyle = getClassificationStyle(primaryLabel)

   const variantConfig = {
      default: {
         bg: "",
         border: "",
         shadow: "",
         icon: "text-gray-800",
      },
      active: {
         bg: "",
         border: "border-2 border-green-400",
         shadow: "",
         icon: "text-green-600",
      },
      analyzing: {
         bg: "",
         border: "",
         shadow: "",
         icon: "text-orange-600",
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
