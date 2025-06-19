'use client'

import { motion } from 'framer-motion'
import { InstructionItemProps } from './types'

/**
 * 確認事項アイテムコンポーネント
 *
 * @description
 * 録音前の確認事項を表示する個別アイテム
 * アニメーション付きで順次表示される
 *
 * @param text 表示するテキスト
 * @param index アニメーション遅延用のインデックス
 * @param isClosing 閉じるアニメーション中かどうか
 * @param className 追加のCSSクラス
 */

export function InstructionItem({
   text,
   index,
   isClosing,
   className = '',
}: InstructionItemProps) {
   return (
      <motion.div
         initial={{
            opacity: 0,
            x: -50,
            scale: 0.8,
         }}
         animate={
            isClosing
               ? { opacity: 0, x: -30, scale: 0.8 }
               : {
                    opacity: 1,
                    x: 0,
                    scale: 1,
                 }
         }
         transition={
            isClosing
               ? { duration: 0.2, delay: index * 0.05 }
               : {
                    delay: 1.2 + index * 0.15,
                    duration: 0.8,
                    ease: [0.68, -0.55, 0.265, 1.55],
                 }
         }
         className={`flex items-start gap-3 p-3 rounded-lg bg-black/20 backdrop-blur-sm border border-neutral-700/50 ${className}`}
      >
         <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
               delay: 1.4 + index * 0.15,
               duration: 0.6,
               type: 'spring',
               stiffness: 200,
            }}
            className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"
         />
         <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
               delay: 1.4 + index * 0.15,
               duration: 0.6,
            }}
            className="text-neutral-100 text-sm leading-relaxed font-medium"
         >
            {text}
         </motion.span>
      </motion.div>
   )
}
