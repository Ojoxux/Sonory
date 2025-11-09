"use client"

import { motion } from "framer-motion"
import type { ConfirmationCompleteProps } from "./types"
import {
   getCheckmarkContainerAnimation,
   getCheckmarkIconAnimation,
   getCheckmarkPathAnimation,
   getCircleBackgroundAnimation,
   getContainerAnimation,
   getMessageAnimation,
   getParagraphAnimation,
} from "./utils"

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
   className = "",
   isClosing = false,
}: ConfirmationCompleteProps) {
   const containerAnim = getContainerAnimation(isClosing)
   const checkmarkContainerAnim = getCheckmarkContainerAnimation(isClosing)
   const circleAnim = getCircleBackgroundAnimation(isClosing)
   const iconAnim = getCheckmarkIconAnimation(isClosing)
   const pathAnim = getCheckmarkPathAnimation(isClosing)
   const messageAnim = getMessageAnimation(isClosing)
   const paragraphAnim = getParagraphAnimation(isClosing)

   return (
      <motion.div
         {...containerAnim}
         className={`flex flex-col items-center justify-center px-4 py-4 ${className}`}
      >
         {/* 大きなチェックマーク - Appleスタイル */}
         <motion.div {...checkmarkContainerAnim} className="mb-4">
            <div className="relative">
               {/* 背景の円 - クローズ時は早めに非表示 */}
               <motion.div
                  {...circleAnim}
                  className="absolute inset-0 h-20 w-20 rounded-full bg-green-500/10"
               />
               {/* チェックマーク */}
               <div className="relative z-10 flex h-20 w-20 items-center justify-center">
                  <motion.svg
                     {...iconAnim}
                     aria-label="確認完了マーク"
                     className="h-10 w-10 text-green-500"
                     fill="none"
                     viewBox="0 0 24 24"
                     stroke="currentColor"
                     strokeWidth={2}
                  >
                     <title>確認完了マーク</title>
                     <motion.path
                        {...pathAnim}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                     />
                  </motion.svg>
               </div>
            </div>
         </motion.div>

         {/* メッセージ - Appleスタイルのタイポグラフィ */}
         <motion.div {...messageAnim} className="max-w-sm text-center">
            <motion.h2
               className="mb-2 font-semibold text-white text-xl leading-tight tracking-tight"
               style={{
                  fontFamily:
                     '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
               }}
            >
               さあ、録音を始めましょう！
            </motion.h2>

            <motion.p
               {...paragraphAnim}
               className="font-normal text-neutral-300 text-sm leading-relaxed"
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
