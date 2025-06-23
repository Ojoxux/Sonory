'use client'

import { motion } from 'framer-motion'
import type { ConfirmButtonProps } from './types'

/**
 * 確認ボタンコンポーネント
 *
 * @description
 * 確認事項に同意するためのボタン
 * 押下後は確認済み状態に変化する
 *
 * @param onClick クリック時のコールバック
 * @param isConfirmed 確認済みかどうか
 * @param isClosing 閉じるアニメーション中かどうか
 * @param className 追加のCSSクラス
 */

export function ConfirmButton({
   onClick,
   isConfirmed,
   isClosing,
   className = '',
}: ConfirmButtonProps) {
   return (
      <motion.div
         className={`mb-4 relative z-50 ${className}`}
         initial={{ opacity: 0, y: 30 }}
         animate={isClosing ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
         transition={isClosing ? { duration: 0.2 } : { delay: 1.8, duration: 0.6 }}>
         <motion.button
            onClick={onClick}
            disabled={isConfirmed}
            className={`
          w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-300 pointer-events-auto
          ${
             isConfirmed
                ? 'bg-green-500 text-white shadow-[0_4px_20px_rgba(34,197,94,0.4)]'
                : 'bg-white/90 text-black hover:bg-white hover:shadow-[0_4px_20px_rgba(255,255,255,0.3)]'
          }
        `}
            whileTap={{ scale: 0.98 }}
            whileHover={!isConfirmed ? { scale: 1.02 } : {}}>
            {isConfirmed ? (
               <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className='flex items-center justify-center gap-2'>
                  <motion.svg
                     aria-label='確認済み'
                     initial={{ scale: 0, rotate: -180 }}
                     animate={{ scale: 1, rotate: 0 }}
                     transition={{ delay: 0.1, duration: 0.5 }}
                     className='w-5 h-5'
                     fill='currentColor'
                     viewBox='0 0 20 20'>
                     <title>確認済み</title>
                     <path
                        fillRule='evenodd'
                        d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                        clipRule='evenodd'
                     />
                  </motion.svg>
                  確認済み
               </motion.div>
            ) : (
               '上記の確認事項を確認しました'
            )}
         </motion.button>
      </motion.div>
   )
}
