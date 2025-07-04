"use client"

import { motion } from "framer-motion"
import { MdMic } from "react-icons/md"
import type { RecordingInitialStateProps } from "./types"

/**
 * 録音初期状態コンポーネント
 *
 * @description
 * 録音開始前の初期状態を表示するコンポーネント
 *
 * @param onClick 録音ボタンクリック時のコールバック
 */
export function RecordingInitialState({ onClick }: RecordingInitialStateProps) {
   return (
      <motion.button
         onClick={onClick}
         className="mb-5 flex h-16 w-48 touch-manipulation items-center justify-center rounded-full bg-black shadow-2xl transition-all duration-300 hover:bg-gray-800 sm:h-20 sm:w-20"
         whileTap={{ scale: 0.95 }}
         whileHover={{ scale: 1.05 }}
      >
         <MdMic className="h-7 w-7 text-white sm:h-8 sm:w-8" />
      </motion.button>
   )
}
