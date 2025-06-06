'use client'

import { motion } from 'framer-motion'
import { InstructionItem } from '../../atoms/InstructionItem'
import { InstructionsListProps } from './types'

/**
 * 確認事項リストコンポーネント
 *
 * @description
 * 録音前の確認事項を一覧表示するコンポーネント
 * 各アイテムを順次アニメーション表示する
 *
 * @param items 確認事項の配列
 * @param isClosing 閉じるアニメーション中かどうか
 * @param className 追加のCSSクラス
 */

export function InstructionsList({
  items,
  isClosing,
  className = '',
}: InstructionsListProps) {
  return (
    <motion.div
      className={`space-y-3 mb-6 relative z-10 ${className}`}
      animate={
        isClosing ? { opacity: 0, scale: 0.9 } : { opacity: 1, scale: 1 }
      }
      transition={isClosing ? { duration: 0.2 } : { duration: 0.3, delay: 1.2 }}
    >
      {items.map((item, index) => (
        <InstructionItem
          key={index}
          text={item}
          index={index}
          isClosing={isClosing}
        />
      ))}
    </motion.div>
  )
}
