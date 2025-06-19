'use client'

import { motion } from 'framer-motion'
import type { ConfirmationCompleteProps } from './types'

/**
 * 確認完了画面コンポーネント
 *
 * @description
 * 確認事項の確認完了後に表示される画面
 *
 * @param className 追加のCSSクラス
 * @param isClosing クローズアニメーション中かどうか
 */

export function ConfirmationComplete({
   className = '',
   isClosing = false,
}: ConfirmationCompleteProps) {
   return (
      <motion.div
         initial={{ opacity: 0, scale: 0.95 }}
         animate={
            isClosing ? { opacity: 0, scale: 0.95 } : { opacity: 1, scale: 1 }
         }
         transition={{
            duration: isClosing ? 0.3 : 0.4,
            ease: [0.25, 0.46, 0.45, 0.94],
         }}
         className={`flex flex-col items-center justify-center py-4 px-4 ${className}`}
      >
         {/* 大きなチェックマーク - Appleスタイル */}
         <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={
               isClosing ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }
            }
            transition={{
               delay: isClosing ? 0 : 0.1,
               duration: isClosing ? 0.2 : 0.5,
               ease: [0.175, 0.885, 0.32, 1.275],
            }}
            className="mb-4"
         >
            <div className="relative">
               {/* 背景の円 - クローズ時は早めに非表示 */}
               <motion.div
                  initial={{ scale: 0 }}
                  animate={
                     isClosing
                        ? { scale: 0, opacity: 0 }
                        : { scale: 1, opacity: 1 }
                  }
                  transition={{
                     delay: isClosing ? 0 : 0.2,
                     duration: isClosing ? 0.15 : 0.3,
                  }}
                  className="absolute inset-0 w-20 h-20 bg-green-500/10 rounded-full"
               />
               {/* チェックマーク */}
               <div className="relative z-10 w-20 h-20 flex items-center justify-center">
                  <motion.svg
                     aria-label="確認完了マーク"
                     initial={{ scale: 0 }}
                     animate={
                        isClosing
                           ? { scale: 0, opacity: 0 }
                           : { scale: 1, opacity: 1 }
                     }
                     transition={{
                        delay: isClosing ? 0 : 0.3,
                        duration: isClosing ? 0.2 : 0.4,
                     }}
                     className="w-10 h-10 text-green-500"
                     fill="none"
                     viewBox="0 0 24 24"
                     stroke="currentColor"
                     strokeWidth={2}
                  >
                     <title>確認完了マーク</title>
                     <motion.path
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={
                           isClosing
                              ? { pathLength: 0, opacity: 0 }
                              : { pathLength: 1, opacity: 1 }
                        }
                        transition={{
                           delay: isClosing ? 0 : 0.5,
                           duration: isClosing ? 0.1 : 0.6,
                           ease: 'easeInOut',
                        }}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                     />
                  </motion.svg>
               </div>
            </div>
         </motion.div>

         {/* メッセージ - Appleスタイルのタイポグラフィ */}
         <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isClosing ? { opacity: 0, y: -10 } : { opacity: 1, y: 0 }}
            transition={{
               delay: isClosing ? 0 : 0.7,
               duration: isClosing ? 0.2 : 0.4,
            }}
            className="text-center max-w-sm"
         >
            <motion.h2
               className="text-white text-xl font-semibold mb-2 tracking-tight leading-tight"
               style={{
                  fontFamily:
                     '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
               }}
            >
               さあ、録音を始めましょう！
            </motion.h2>

            <motion.p
               initial={{ opacity: 0 }}
               animate={isClosing ? { opacity: 0 } : { opacity: 1 }}
               transition={{
                  delay: isClosing ? 0 : 0.9,
                  duration: isClosing ? 0.1 : 0.4,
               }}
               className="text-neutral-300 text-sm font-normal leading-relaxed"
               style={{
                  fontFamily:
                     '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
               }}
            >
               下のスライダーを右にドラッグして録音を開始してください
            </motion.p>
         </motion.div>
      </motion.div>
   )
}
