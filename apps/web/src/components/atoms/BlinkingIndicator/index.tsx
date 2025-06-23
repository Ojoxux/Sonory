'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { BlinkingIndicatorProps } from './type'

/**
 * 点滅インジケーターコンポーネント
 *
 * @description
 * 独立したタイミングで実行される点滅アニメーション
 * 各インスタンスが独自のランダム遅延とタイミングを持つ
 *
 * @param isActive - アニメーションがアクティブかどうか
 * @param className - 追加のCSSクラス名
 * @param size - エフェクトのサイズクラス
 * @param color - エフェクトの色クラス
 */
export function BlinkingIndicator({
   isActive,
   className = '',
   size = 'w-2 h-2',
   color = 'bg-red-500',
}: BlinkingIndicatorProps) {
   // 各インスタンス独自のランダムタイミング
   const [delay] = useState(() => 100 + Math.random() * 400) // 100-500msのランダム遅延
   const [duration] = useState(() => 800 + Math.random() * 400) // 0.8-1.2秒の可変時間
   const [isAnimating, setIsAnimating] = useState(false)

   useEffect(() => {
      if (isActive) {
         // 独立した遅延でアニメーション開始
         const timer = setTimeout(() => {
            setIsAnimating(true)
         }, delay)

         return () => clearTimeout(timer)
      }
   }, [isActive, delay])

   return (
      <motion.div
         className={`${size} ${color} rounded-full ${className}`}
         animate={isAnimating ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
         transition={{
            duration: duration / 1000, // ミリ秒を秒に変換
            repeat: isAnimating ? Number.POSITIVE_INFINITY : 0,
            ease: 'easeInOut',
         }}
      />
   )
}
