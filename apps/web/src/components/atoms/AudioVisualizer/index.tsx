'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { AudioVisualizerProps } from './types'

/**
 * 音響ビジュアライザーコンポーネント
 *
 * @description
 * 周波数スペクトラム風のアニメーションバーを表示
 * AI分析中やローディング時の音響的な演出
 *
 * @param isActive ビジュアライザーがアクティブかどうか
 * @param barCount バーの数
 * @param color バーの色
 * @param className 追加のCSSクラス
 *
 * @example
 * ```tsx
 * <AudioVisualizer isActive={true} barCount={12} color="blue" />
 * ```
 */
export function AudioVisualizer({
   isActive = false,
   barCount = 8,
   color = 'blue',
   className = '',
}: AudioVisualizerProps) {
   const [bars, setBars] = useState<number[]>([])

   // バーの高さをランダムに生成
   useEffect(() => {
      if (!isActive) {
         setBars(new Array(barCount).fill(0.1))
         return
      }

      const interval = setInterval(() => {
         setBars(
            new Array(barCount).fill(0).map(() => Math.random() * 0.8 + 0.2),
         )
      }, 150)

      return () => clearInterval(interval)
   }, [isActive, barCount])

   const getColorClass = (): string => {
      switch (color) {
         case 'blue':
            return 'bg-blue-400'
         case 'green':
            return 'bg-green-400'
         case 'white':
            return 'bg-white'
         case 'red':
            return 'bg-red-400'
         case 'purple':
            return 'bg-purple-400'
         default:
            return 'bg-blue-400'
      }
   }

   return (
      <div className={`flex items-end justify-center gap-1 h-12 ${className}`}>
         {bars.map((height, index) => (
            <motion.div
               key={index}
               className={`w-1 rounded-full ${getColorClass()}`}
               animate={{
                  height: `${height * 100}%`,
                  opacity: isActive ? [0.3, 1, 0.3] : 0.3,
               }}
               transition={{
                  duration: 0.3,
                  ease: 'easeInOut',
                  opacity: {
                     duration: 1,
                     repeat: Infinity,
                     delay: index * 0.1,
                  },
               }}
            />
         ))}
      </div>
   )
}
