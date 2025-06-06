'use client'

import { motion } from 'framer-motion'
import { CheckIconProps } from './types'

/**
 * チェックマークアイコンコンポーネント
 *
 * @description
 * 確認完了時に表示される大きなチェックマークアイコン
 * アニメーション付きで視覚的なフィードバックを提供
 *
 * @param size アイコンのサイズ（デフォルト: 'large'）
 * @param color アイコンの色（デフォルト: 'green'）
 * @param className 追加のCSSクラス
 */

export function CheckIcon({
  size = 'large',
  color = 'green',
  className = '',
}: CheckIconProps) {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-16 h-16',
    large: 'w-32 h-32',
  }

  const colorClasses = {
    green: 'text-green-500',
    white: 'text-white',
    black: 'text-black',
  }

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{
        scale: [0, 1.2, 1],
        rotate: [0, 360, 0],
      }}
      transition={{
        duration: 0.8,
        ease: [0.68, -0.55, 0.265, 1.55],
      }}
      className={`${sizeClasses[size]} ${colorClasses[color]} ${className}`}
    >
      <svg fill="currentColor" viewBox="0 0 24 24" className="w-full h-full">
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className="opacity-30"
        />
        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          d="M9 12l2 2 4-4"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </motion.div>
  )
}
