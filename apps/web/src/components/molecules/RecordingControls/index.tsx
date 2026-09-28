"use client"

import { motion } from "motion/react"
import { DURATION, EASE_OUT } from "@/utils/motion"
import { RippleEffect } from "../../atoms/RippleEffect"
import type { RecordingControlsProps } from "./types"

/**
 * 録音コントロールコンポーネント
 *
 * @description
 * 録音を止めた直後、音声の書き出しを待つ間に出す一時停止の表示
 *
 * @param isRecording 録音中かどうか
 */
export function RecordingControls({ isRecording }: RecordingControlsProps) {
   return (
      <motion.div
         className="mt-auto mb-12 flex justify-center"
         initial={{ opacity: 0, scale: 0.9 }}
         animate={{ opacity: 1, scale: 1 }}
         transition={{ duration: DURATION.menu, ease: EASE_OUT }}
      >
         <div className="relative grid size-20 place-items-center rounded-full bg-white/10 sm:size-24">
            <div className="flex items-center gap-1.5">
               <div className="h-8 w-1 rounded-full bg-white sm:h-10" />
               <div className="h-8 w-1 rounded-full bg-white sm:h-10" />
            </div>

            <RippleEffect isActive={isRecording} />
         </div>
      </motion.div>
   )
}
