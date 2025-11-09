"use client"

import { motion } from "framer-motion"
import { ConfirmButton } from "../../atoms/ConfirmButton"
import { ConfirmationComplete } from "../ConfirmationComplete"
import { InstructionsList } from "../InstructionsList"
import { SlideToStart } from "../SlideToStart"
import type { RecordingInstructionsProps } from "./types"
import {
   getClosingAnimation,
   getClosingTransition,
   getInitialAnimation,
   getOpeningAnimation,
   getOpeningTransition,
} from "./utils"

/**
 * 録音前の説明・確認コンポーネント
 *
 * @description
 * 録音前に表示する説明と確認事項を表示するコンポーネント
 *
 * @param instructionItems 説明項目の配列
 * @param isClosing 閉じるアニメーション中かどうか
 * @param isAgreed 同意済みかどうか
 * @param showConfirmationComplete 確認完了画面を表示するかどうか
 * @param onAgree 同意ボタンクリック時のコールバック
 * @param onStartRecording 録音開始時のコールバック
 * @param instructionsRef 外部クリック検知用のref
 */
export function RecordingInstructions({
   instructionItems,
   isClosing,
   isAgreed,
   showConfirmationComplete,
   onAgree,
   onStartRecording,
   instructionsRef,
}: RecordingInstructionsProps) {
   const initialAnim = getInitialAnimation()
   const animate = isClosing ? getClosingAnimation() : getOpeningAnimation()
   const transition = isClosing
      ? getClosingTransition()
      : getOpeningTransition()

   return (
      <motion.div
         ref={instructionsRef}
         initial={initialAnim}
         animate={animate}
         transition={transition}
         className="relative mx-auto mb-5 flex max-w-sm flex-col overflow-hidden border border-neutral-600/30 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:p-6"
         style={{
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            maxHeight: "80vh",
            willChange: "transform, width, height, background-color",
            transform: "translate3d(0, 0, 0)",
            backfaceVisibility: "hidden",
            WebkitFontSmoothing: "antialiased",
         }}
      >
         {/* シンプルなグロー効果 */}
         <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={
               isClosing
                  ? { opacity: 0, scale: 0.95 }
                  : {
                       opacity: [0, 0.3, 0.1],
                       scale: [0.95, 1.05, 1],
                    }
            }
            transition={{
               duration: isClosing ? 0.3 : 1.0,
               delay: isClosing ? 0 : 0.1,
               ease: [0.4, 0, 0.2, 1],
            }}
            className="absolute inset-0 rounded-4xl bg-linear-to-br from-neutral-400/10 to-neutral-600/10 blur-xl"
            style={{
               willChange: "transform, opacity",
               transform: "translate3d(0, 0, 0)",
            }}
         />

         {/* ヘッダー（確認事項表示時のみ） */}
         {!showConfirmationComplete && (
            <motion.div
               initial={{ opacity: 0, y: -30, scale: 0.8 }}
               animate={
                  isClosing
                     ? { opacity: 0, scale: 0.8 }
                     : {
                          opacity: 1,
                          y: 0,
                          scale: [0.8, 1.1, 1],
                       }
               }
               transition={
                  isClosing
                     ? { duration: 0.2 }
                     : {
                          delay: 0.8,
                          duration: 0.8,
                          ease: [0.68, -0.55, 0.265, 1.55],
                       }
               }
               className="relative z-10 mb-4 text-center"
            >
               <motion.h3
                  initial={{ letterSpacing: "0.1em" }}
                  animate={{
                     letterSpacing: ["0.1em", "0.2em", "0.05em"],
                  }}
                  transition={{ duration: 1, delay: 1 }}
                  className="mb-2 font-bold text-lg text-white tracking-tight"
               >
                  録音前の確認
               </motion.h3>
               <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1] }}
                  transition={{ delay: 1.2, duration: 0.6 }}
                  className="font-normal text-base text-neutral-200 leading-relaxed"
               >
                  以下の項目をご確認ください
               </motion.p>
            </motion.div>
         )}

         {/* 確認事項リスト */}
         {!showConfirmationComplete ? (
            <>
               <InstructionsList
                  items={instructionItems}
                  isClosing={isClosing}
               />

               {/* 確認ボタン */}
               <ConfirmButton
                  onClick={onAgree}
                  isConfirmed={isAgreed}
                  isClosing={isClosing}
               />
            </>
         ) : (
            <>
               {/* 確認完了画面 */}
               <ConfirmationComplete isClosing={isClosing} />

               {/* スライドバー（確認完了後のみ表示） */}
               <motion.div
                  initial={{ opacity: 0, y: 50, scale: 0.8 }}
                  animate={{
                     opacity: 1,
                     y: 0,
                     scale: [0.8, 1.1, 1],
                  }}
                  transition={{
                     delay: 1.2,
                     duration: 0.8,
                     ease: [0.68, -0.55, 0.265, 1.55],
                  }}
                  className="relative z-10 w-full"
               >
                  <SlideToStart
                     onComplete={onStartRecording}
                     disabled={false}
                     text="録音開始"
                     className="px-0"
                  />
               </motion.div>
            </>
         )}
      </motion.div>
   )
}
