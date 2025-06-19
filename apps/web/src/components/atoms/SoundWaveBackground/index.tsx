'use client'

import { motion } from 'framer-motion'
import type { SoundWaveBackgroundProps } from './types'

/**
 * 音波背景パターンコンポーネント
 *
 * @description
 * 背景に微細な音波パターンを表示
 * Sonoryアプリの音響的な雰囲気を演出
 *
 * @param opacity 背景の透明度
 * @param animated アニメーションするかどうか
 * @param className 追加のCSSクラス
 *
 * @example
 * ```tsx
 * <SoundWaveBackground opacity={0.1} animated={true} />
 * ```
 */
export function SoundWaveBackground({
   opacity = 0.05,
   animated = true,
   className = '',
}: SoundWaveBackgroundProps) {
   const waveCount = 6

   return (
      <div
         className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      >
         {Array.from({ length: waveCount }).map((_, index) => {
            const topPosition = 15 + index * 12
            return (
               <motion.div
                  key={`wave-top-${topPosition}`}
                  className="absolute w-full h-px bg-gradient-to-r from-transparent via-white to-transparent"
                  style={{
                     opacity,
                     top: `${topPosition}%`,
                     left: '-50%',
                     width: '200%',
                  }}
                  animate={
                     animated
                        ? {
                             x: ['-50%', '0%', '-50%'],
                             scaleX: [0.5, 1.2, 0.5],
                          }
                        : {}
                  }
                  transition={{
                     duration: 8 + index * 2,
                     repeat: Number.POSITIVE_INFINITY,
                     ease: 'easeInOut',
                     delay: index * 0.5,
                  }}
               />
            )
         })}

         {/* 縦の音波ライン */}
         {Array.from({ length: 4 }).map((_, index) => {
            const leftPosition = 20 + index * 20
            return (
               <motion.div
                  key={`wave-left-${leftPosition}`}
                  className="absolute h-full w-px bg-gradient-to-b from-transparent via-white to-transparent"
                  style={{
                     opacity: opacity * 0.5,
                     left: `${leftPosition}%`,
                     top: '-50%',
                     height: '200%',
                  }}
                  animate={
                     animated
                        ? {
                             y: ['-50%', '0%', '-50%'],
                             scaleY: [0.3, 1, 0.3],
                          }
                        : {}
                  }
                  transition={{
                     duration: 12 + index * 3,
                     repeat: Number.POSITIVE_INFINITY,
                     ease: 'easeInOut',
                     delay: index * 1.2,
                  }}
               />
            )
         })}
      </div>
   )
}
