'use client'

import { motion } from 'framer-motion'
import type { SelectAllButtonProps } from './type'

/**
 * 全選択/全解除ボタンコンポーネント
 * 
 * @description
 * RecordingInterfaceで使用される全選択/全解除ボタン
 * 既存のUIデザインと統一されたスタイルと部分アニメーション
 * 
 * @param isAllSelected 全てが選択されているかどうか
 * @param onToggle 選択状態を切り替える関数
 */
export function SelectAllButton({ isAllSelected, onToggle }: SelectAllButtonProps) {
  return (
    <motion.div
      className="flex justify-center w-full py-2"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 2.2, duration: 0.6 }}
    >
      <motion.button
        onClick={onToggle}
        className="px-4 py-2 rounded-lg bg-neutral-600 hover:bg-neutral-500 text-white font-medium text-sm transition-all duration-300 shadow-[0_4px_16px_rgba(0,0,0,0.4)] relative overflow-hidden border border-neutral-500"
        whileTap={{ scale: 0.95, rotateX: 5 }}
        whileHover={{
          scale: 1.05,
          boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
        }}
        animate={{
          backgroundColor: isAllSelected ? '#525252' : '#525252', // neutral-600
        }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-neutral-400/20 to-transparent"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.6 }}
        />
        <motion.span
          key={isAllSelected ? 'deselect' : 'select'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {isAllSelected ? '全て解除' : '全て選択'}
        </motion.span>
      </motion.button>
    </motion.div>
  )
}