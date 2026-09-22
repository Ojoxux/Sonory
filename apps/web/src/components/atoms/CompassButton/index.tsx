"use client"

import { motion } from "motion/react"
import { CompassIcon } from "@/components/atoms/CompassIcon"
import type { CompassButtonProps } from "./types"

/**
 * コンパスボタンコンポーネント
 *
 * @description
 * 現在地に戻るためのコンパスボタンのAtomコンポーネント
 * コンパスらしいデザインで、マップの回転に合わせてコンパスの方向も変化する
 *
 * @param onClick クリックハンドラー
 * @param mapBearing マップのbearing（回転角度）
 * @param className 追加のCSSクラス
 * @param isDarkMode ダークモードかどうか
 *
 * @example
 * ```tsx
 * <CompassButton
 *   onClick={() => console.log('コンパスボタンがクリックされました')}
 *   mapBearing={45}
 * />
 * ```
 */
export function CompassButton({
   onClick,
   mapBearing = 0,
   className = "",
   isDarkMode = false,
}: CompassButtonProps) {
   const hasRotation = mapBearing !== 0

   const surfaceClass = isDarkMode
      ? "border-white/20 bg-white/10 text-white shadow-md shadow-black/30 hover:bg-white/15"
      : "border-black/5 bg-white/70 text-neutral-800 shadow-md hover:bg-white/80"
   const rotationIndicator = isDarkMode ? "border-white/30" : "border-black/20"

   const pulseVariants = {
      pulse: {
         scale: [1.12, 1.18, 1.12],
         opacity: [0.5, 0.7, 0.5],
         transition: {
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut" as const,
         },
      },
   }

   return (
      <div className="relative">
         {/* 地図が北を向いていないときだけ出す */}
         {hasRotation && (
            <>
               <motion.span
                  className={`pointer-events-none absolute inset-0 rounded-full ${
                     isDarkMode ? "bg-white/20" : "bg-black/10"
                  }`}
                  style={{ filter: "blur(1px)" }}
                  initial="pulse"
                  animate="pulse"
                  variants={pulseVariants}
               />

               <motion.span
                  className={`pointer-events-none absolute inset-0 rounded-full border-2 ${rotationIndicator}`}
                  style={{ scale: 1.25 }}
                  animate={{
                     rotate: [0, 360],
                  }}
                  transition={{
                     duration: 8,
                     repeat: Number.POSITIVE_INFINITY,
                     ease: "linear",
                  }}
               />
            </>
         )}

         <button
            type="button"
            aria-label="現在位置に戻る"
            onClick={onClick}
            className={`relative flex h-14 w-14 touch-manipulation items-center justify-center rounded-full border backdrop-blur-md transition duration-press ease-out active:scale-97 ${surfaceClass} ${className}`}
         >
            <CompassIcon
               className={`h-10 w-10 ${hasRotation ? "opacity-90" : "opacity-80"}`}
               mapBearing={mapBearing}
            />
         </button>
      </div>
   )
}
