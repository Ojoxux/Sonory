"use client"

import { motion } from "framer-motion"
import { RippleEffect } from "../../atoms/RippleEffect"
import type { RecordingControlsProps } from "./types"

/**
 * 録音コントロールコンポーネント
 *
 * @description
 * 録音の一時停止・停止ボタンを提供するコンポーネント
 *
 * @param isRecording 録音中かどうか
 */
export function RecordingControls({ isRecording }: RecordingControlsProps) {
   return (
      <motion.div
         className="fixed right-0 bottom-20 left-0 flex justify-center sm:bottom-10 md:bottom-12"
         initial={{ scale: 0 }}
         animate={{ scale: 1 }}
         transition={{
            delay: 0.3,
            type: "spring",
            stiffness: 200,
         }}
      >
         <motion.div className="relative z-50 flex h-20 w-20 touch-manipulation items-center justify-center rounded-full bg-gray-100 shadow-lg transition-all duration-300 sm:h-24 sm:w-24">
            {/* 一時停止アイコン */}
            <div className="flex items-center gap-1.5">
               <div className="h-8 w-1 rounded-full bg-gray-900 sm:h-10" />
               <div className="h-8 w-1 rounded-full bg-gray-900 sm:h-10" />
            </div>

            {/* リップルエフェクト */}
            <RippleEffect
               isActive={isRecording}
               borderColor="border-gray-400"
            />
         </motion.div>
      </motion.div>
   )
}
