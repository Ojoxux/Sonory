"use client"

import { RecordingControls } from "../RecordingControls"
import { RecordingTimer } from "../RecordingTimer"
import { WaveformDisplay } from "../WaveformDisplay"
import type { RecordingExpandedDisplayProps } from "./types"

/**
 * 録音拡大表示コンポーネント
 *
 * @description
 * 録音シートの本体。収納時は画面外にあり、引き上げると見えてくる
 *
 * @param status 録音状態
 * @param recordingTime 録音時間
 * @param levels 区間ごとの音量
 * @param formatTime 時間フォーマット関数
 */
export function RecordingExpandedDisplay({
   status,
   recordingTime,
   levels,
   formatTime,
}: RecordingExpandedDisplayProps) {
   return (
      <div className="flex flex-1 flex-col">
         <div className="flex flex-col items-center px-6 pt-4 sm:px-8">
            <RecordingTimer time={recordingTime} formatTime={formatTime} />

            <div className="mb-4 w-full max-w-2xl px-4">
               <WaveformDisplay
                  isRecording={status === "recording"}
                  isCompleted={status === "completed"}
                  recordingTime={recordingTime}
                  levels={levels}
                  height={160}
                  className="h-40 text-white"
               />
            </div>
         </div>

         {status === "completed" && <RecordingControls isRecording={false} />}
      </div>
   )
}
