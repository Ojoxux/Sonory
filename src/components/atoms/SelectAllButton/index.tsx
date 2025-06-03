'use client'

import { motion } from 'framer-motion'
import type { SelectAllButtonProps } from './type'

/**
 * 全選択ボタンコンポーネント
 *
 * @description
 * 全てのチェックボックスを一括で選択/解除するボタン
 * 既存のUIデザインに合わせたアニメーション付きボタン
 *
 * @param isAllChecked 全てのアイテムがチェックされているかどうか
 * @param onSelectAll 全選択/全解除のコールバック関数
 */
export function SelectAllButton({
  isAllChecked,
  onSelectAll,
}: SelectAllButtonProps) {
  return (
    <motion.button
      onClick={onSelectAll}
      className={`
        w-full p-2.5 rounded-lg font-semibold text-sm transition-all duration-300 relative overflow-hidden border mb-3
        ${
          isAllChecked
            ? 'bg-neutral-200 hover:bg-neutral-300 text-black border-neutral-300'
            : 'bg-white hover:bg-neutral-50 text-black shadow-[0_4px_16px_rgba(255,255,255,0.3)] hover:shadow-[0_8px_24px_rgba(255,255,255,0.4)] border-white'
        }
      `}
      whileTap={{ scale: 0.95, rotateX: 5 }}
      whileHover={{
        scale: 1.02,
        boxShadow: isAllChecked
          ? '0 6px 20px rgba(0,0,0,0.1)'
          : '0 12px 32px rgba(255,255,255,0.5)',
      }}
      animate={
        !isAllChecked
          ? {
              boxShadow: [
                '0 4px 16px rgba(255,255,255,0.3)',
                '0 8px 24px rgba(255,255,255,0.4)',
                '0 4px 16px rgba(255,255,255,0.3)',
              ],
            }
          : {}
      }
      transition={{
        boxShadow: {
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      }}
    >
      {/* ホバー時の光エフェクト */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-neutral-400/20 to-transparent"
        initial={{ x: '-100%' }}
        whileHover={{ x: '100%' }}
        transition={{ duration: 0.6 }}
      />
      
      <div className="flex items-center justify-center gap-2 relative z-10">
        {/* チェックアイコン */}
        <motion.div
          className={`
            w-4 h-4 rounded border-2 flex items-center justify-center
            ${
              isAllChecked
                ? 'bg-black border-black'
                : 'bg-transparent border-neutral-400'
            }
          `}
          animate={
            isAllChecked
              ? {
                  scale: [1, 1.2, 1],
                  rotate: [0, 360, 0],
                }
              : {}
          }
          transition={{
            duration: 0.5,
            ease: [0.68, -0.55, 0.265, 1.55],
          }}
        >
          {isAllChecked && (
            <motion.svg
              initial={{ scale: 0, rotate: -180 }}
              animate={{
                scale: [0, 1.3, 1],
                rotate: [-180, 0],
              }}
              transition={{
                duration: 0.4,
                ease: [0.68, -0.55, 0.265, 1.55],
              }}
              className="w-2.5 h-2.5 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </motion.svg>
          )}
        </motion.div>
        
        <span>
          {isAllChecked ? 'すべて解除' : 'すべて選択'}
        </span>
      </div>
    </motion.button>
  )
}