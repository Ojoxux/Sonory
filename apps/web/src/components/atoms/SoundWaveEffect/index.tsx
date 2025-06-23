'use client'

import { motion } from 'framer-motion'
import type { SoundWaveEffectProps } from './types'

/**
 * 音波エフェクトコンポーネント
 *
 * @description
 * 音波のような波紋エフェクトを表示するAtomコンポーネント
 * Sonoryアプリの音響的な雰囲気を演出
 *
 * @param isActive エフェクトがアクティブかどうか
 * @param color 波の色
 * @param size 波のサイズ
 * @param className 追加のCSSクラス
 *
 * @example
 * ```tsx
 * <SoundWaveEffect isActive={true} color="blue" size="large" />
 * ```
 */
export function SoundWaveEffect({
   isActive = false,
   color = 'blue',
   size = 'medium',
   className = '',
}: SoundWaveEffectProps) {
   const getColorClass = (): string => {
      switch (color) {
         case 'blue':
            return 'border-blue-400/30'
         case 'green':
            return 'border-green-400/30'
         case 'white':
            return 'border-white/20'
         case 'red':
            return 'border-red-400/30'
         default:
            return 'border-blue-400/30'
      }
   }

   const getSizeClass = (): string => {
      switch (size) {
         case 'small':
            return 'w-8 h-8'
         case 'medium':
            return 'w-16 h-16'
         case 'large':
            return 'w-24 h-24'
         case 'xlarge':
            return 'w-32 h-32'
         default:
            return 'w-16 h-16'
      }
   }

   if (!isActive) return null

   return (
      <div className={`absolute inset-0 pointer-events-none ${className}`}>
         {/* 第1波 */}
         <motion.div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${getColorClass()} ${getSizeClass()}`}
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: [0, 1.5, 2.5], opacity: [0.8, 0.4, 0] }}
            transition={{
               duration: 2,
               repeat: Number.POSITIVE_INFINITY,
               ease: 'easeOut',
            }}
         />

         {/* 第2波 */}
         <motion.div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${getColorClass()} ${getSizeClass()}`}
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: [0, 1.5, 2.5], opacity: [0.8, 0.4, 0] }}
            transition={{
               duration: 2,
               repeat: Number.POSITIVE_INFINITY,
               ease: 'easeOut',
               delay: 0.5,
            }}
         />

         {/* 第3波 */}
         <motion.div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${getColorClass()} ${getSizeClass()}`}
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: [0, 1.5, 2.5], opacity: [0.8, 0.4, 0] }}
            transition={{
               duration: 2,
               repeat: Number.POSITIVE_INFINITY,
               ease: 'easeOut',
               delay: 1,
            }}
         />
      </div>
   )
}
