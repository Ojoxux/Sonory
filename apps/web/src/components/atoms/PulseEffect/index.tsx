'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { PulseEffectProps } from './type'

/**
 * パルスエフェクトコンポーネント
 *
 * @description
 * 独立したタイミングで実行されるパルスアニメーション
 * 各インスタンスが独自のランダム遅延とタイミングを持つ
 *
 * @param isActive - アニメーションがアクティブかどうか
 * @param className - 追加のCSSクラス名
 * @param borderColor - ボーダーの色クラス
 * @param size - エフェクトのサイズクラス
 */
export function PulseEffect({
   isActive,
   className = '',
   borderColor = 'border-red-500',
   size = 'inset-0',
}: PulseEffectProps) {
   // 各インスタンス独自のランダムタイミング
   const [delay] = useState(() => Math.random() * 800) // 0-800msのランダム遅延
   const [duration] = useState(() => 1200 + Math.random() * 600) // 1.2-1.8秒の可変時間
   const [isAnimating, setIsAnimating] = useState(false)

   useEffect(() => {
      if (isActive) {
         // 独立した遅延でアニメーション開始
         const timer = setTimeout(() => {
            setIsAnimating(true)
         }, delay)

         return () => clearTimeout(timer)
      }
      // 非アクティブ時は即座に停止
      setIsAnimating(false)
   }, [isActive, delay])

   if (!isAnimating) return null

   return (
      <motion.div
         className={`absolute ${size} rounded-full border-2 ${borderColor} will-change-transform ${className}`}
         initial={{ scale: 1, opacity: 0 }}
         animate={{
            scale: [1, 1.4, 1],
            opacity: [0, 0.7, 0],
         }}
         transition={{
            duration: duration / 1000, // ミリ秒を秒に変換
            repeat: Number.POSITIVE_INFINITY,
            ease: 'easeOut',
            repeatType: 'loop',
         }}
      />
   )
}
