'use client'

import { motion } from 'framer-motion'
import type { SelectAllButtonProps } from './type'

/**
 * 全選択/全解除ボタンコンポーネント
 *
 * @description
 * チェックボックスリストの全選択・全解除を行うボタンコンポーネント
 * 既存のUIデザインと統一感のあるスタイルとアニメーション
 *
 * @param isAllSelected 全選択状態かどうか
 * @param onToggleAll 全選択/全解除のハンドラー
 * @param disabled ボタンの無効状態
 * @param className クラス名
 *
 * @example
 * ```tsx
 * <SelectAllButton
 *   isAllSelected={allItemsChecked}
 *   onToggleAll={handleSelectAll}
 *   disabled={false}
 * />
 * ```
 */
export function SelectAllButton({
  isAllSelected,
  onToggleAll,
  disabled = false,
  className = '',
}: SelectAllButtonProps) {
  return (
    <motion.button
      onClick={onToggleAll}
      disabled={disabled}
      className={`
        flex items-center gap-3 p-3 rounded-lg transition-all duration-300 relative overflow-hidden border
        ${
          disabled
            ? 'bg-neutral-600 text-neutral-400 cursor-not-allowed border-neutral-600'
            : 'bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-600 hover:border-neutral-500'
        }
        ${className}
      `}
      whileTap={!disabled ? { scale: 0.95, rotateX: 5 } : {}}
      whileHover={
        !disabled
          ? {
              scale: 1.02,
              boxShadow: '0 8px 25px rgba(255,255,255,0.1)',
            }
          : {}
      }
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: [0.8, 1.05, 1],
      }}
      transition={{
        delay: 2.2,
        duration: 0.8,
        ease: [0.68, -0.55, 0.265, 1.55],
      }}
    >
      {/* シマーエフェクト（ホバー時） */}
      {!disabled && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-neutral-400/20 to-transparent"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.6 }}
        />
      )}
      
      {/* アイコン部分 */}
      <motion.div
        className={`
          w-5 h-5 rounded-md flex items-center justify-center border-2 transition-all duration-300
          ${
            isAllSelected
              ? 'bg-white border-white shadow-[0_4px_12px_rgba(255,255,255,0.3)]'
              : 'bg-transparent border-neutral-400'
          }
        `}
        animate={
          isAllSelected
            ? {
                boxShadow: [
                  '0 4px 12px rgba(255,255,255,0.3)',
                  '0 8px 25px rgba(255,255,255,0.5)',
                  '0 4px 12px rgba(255,255,255,0.3)',
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
        {isAllSelected && (
          <motion.svg
            initial={{ scale: 0, rotate: -180 }}
            animate={{
              scale: [0, 1.3, 1],
              rotate: [-180, 0, 360, 0],
            }}
            transition={{
              duration: 0.8,
              ease: [0.68, -0.55, 0.265, 1.55],
            }}
            className="w-3 h-3 text-black"
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

      {/* テキスト部分 */}
      <motion.span
        className="text-sm font-medium leading-relaxed"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          delay: 2.4,
          duration: 0.6,
        }}
      >
        {isAllSelected ? 'すべて解除' : 'すべて選択'}
      </motion.span>

      {/* パーティクルエフェクト（選択時） */}
      {isAllSelected &&
        [...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              x: [0, (Math.random() - 0.5) * 40],
              y: [0, (Math.random() - 0.5) * 40],
            }}
            transition={{
              duration: 1,
              delay: i * 0.1,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="absolute w-1 h-1 bg-neutral-400 rounded-full pointer-events-none"
            style={{
              left: '20px',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
    </motion.button>
  )
}