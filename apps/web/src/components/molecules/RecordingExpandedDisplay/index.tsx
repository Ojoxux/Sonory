"use client"

import { motion } from "framer-motion"
import { RecordingControls } from "../RecordingControls"
import { RecordingHeader } from "../RecordingHeader"
import { RecordingTimer } from "../RecordingTimer"
import { WaveformDisplay } from "../WaveformDisplay"
import type { RecordingExpandedDisplayProps } from "./types"

/**
 * 録音拡大表示コンポーネント
 *
 * @description
 * 録音インターフェースの展開時に表示されるコンポーネント
 *
 * @param status 録音状態
 * @param recordingTime 録音時間
 * @param waveformData 波形データ
 * @param formatTime 時間フォーマット関数
 * @param onCancel キャンセルボタンクリック時のコールバック
 * @param onNext 次へボタンクリック時のコールバック
 */
export function RecordingExpandedDisplay({
   status,
   recordingTime,
   waveformData,
   formatTime,
   onCancel,
   onNext,
}: RecordingExpandedDisplayProps) {
   return (
      <motion.div
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         exit={{ opacity: 0 }}
         transition={{ duration: 0.3 }}
         className="flex flex-1 flex-col"
      >
         {/* ヘッダー部分 */}
         <RecordingHeader
            isRecording={status === "recording"}
            onCancel={onCancel}
            onNext={onNext}
         />

         {/* メインコンテンツエリア */}
         <div className="flex flex-1 flex-col items-center justify-start px-6 pt-4 sm:px-8">
            {/* タイマー表示 */}
            <RecordingTimer time={recordingTime} formatTime={formatTime} />

            {/* 波形表示 */}
            <motion.div
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               transition={{ delay: 0.2 }}
               className="mb-4 w-full max-w-2xl px-4"
            >
               <WaveformDisplay
                  isRecording={status === "recording"}
                  isCompleted={status === "completed"}
                  recordingTime={recordingTime}
                  waveformData={waveformData}
                  height={160}
                  className="h-32 sm:h-40"
                  waveColor="#000000"
                  backgroundColor="#f3f4f6"
                  key={`expanded-${status}-${recordingTime}`}
               />
            </motion.div>
         </div>

         {/* 停止ボタン - 録音中は非表示 */}
         {status === "completed" && <RecordingControls isRecording={false} />}
      </motion.div>
   )
}
