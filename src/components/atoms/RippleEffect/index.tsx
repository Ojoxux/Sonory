'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { RippleEffectProps } from './type'

/**
 * リップルエフェクトコンポーネント
 *
 * @description
 * 独立したタイミングで実行されるリップルアニメーション
 * 各インスタンスが独自のランダム遅延とタイミングを持つ
 *
 * @param isActive - アニメーションがアクティブかどうか
 * @param className - 追加のCSSクラス名
 * @param borderColor - ボーダーの色クラス
 * @param size - エフェクトのサイズクラス
 */
export function RippleEffect({
  isActive,
  className = '',
  borderColor = 'border-gray-400',
  size = 'inset-0',
}: RippleEffectProps) {
  // 各インスタンス独自のランダムタイミング
  const [delay] = useState(() => 300 + Math.random() * 600) // 300-900msのランダム遅延
  const [duration] = useState(() => 1500 + Math.random() * 800) // 1.5-2.3秒の可変時間
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isActive) {
      // 独立した遅延でアニメーション開始
      const timer = setTimeout(() => {
        setIsAnimating(true)
      }, delay)

      return () => clearTimeout(timer)
    } else {
      // 非アクティブ時は即座に停止
      setIsAnimating(false)
    }
  }, [isActive, delay])

  if (!isAnimating) return null

  return (
    <motion.div
      className={`absolute ${size} rounded-full border-2 ${borderColor} will-change-transform ${className}`}
      initial={{ scale: 1, opacity: 0 }}
      animate={{
        scale: [1, 1.3, 1],
        opacity: [0, 0.4, 0],
      }}
      transition={{
        duration: duration / 1000, // ミリ秒を秒に変換
        repeat: Infinity,
        ease: 'easeOut',
        repeatType: 'loop',
      }}
    />
  )
}
