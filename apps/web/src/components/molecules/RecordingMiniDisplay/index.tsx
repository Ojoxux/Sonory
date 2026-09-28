"use client"

import { clsx } from "clsx"
import { Square } from "lucide-react"
import { PulseEffect } from "../../atoms/PulseEffect"
import { WaveformDisplay } from "../WaveformDisplay"
import type { RecordingMiniDisplayProps } from "./types"

/**
 * 録音ミニ表示コンポーネント
 *
 * @description
 * 録音シートを収納しているときに見える1行。停止ボタン・波形・経過時間を並べる
 *
 * @param status 録音状態
 * @param recordingTime 録音時間
 * @param waveformData 波形データ
 * @param formatTime 時間フォーマット関数
 * @param onStop 停止ボタンクリック時のコールバック
 */
export function RecordingMiniDisplay({
   status,
   recordingTime,
   waveformData,
   formatTime,
   onStop,
}: RecordingMiniDisplayProps) {
   const isRecording = status === "recording"

   return (
      <div className="flex h-16 items-center justify-between">
         <button
            type="button"
            onClick={onStop}
            disabled={!isRecording}
            aria-label="録音を停止"
            className={clsx(
               "relative grid size-14 shrink-0 touch-manipulation place-items-center rounded-full text-white transition duration-press ease-out focus-visible:outline-2 focus-visible:outline-white/60 focus-visible:outline-offset-2 not-disabled:active:scale-97 sm:size-16",
               isRecording ? "bg-record-600" : "bg-white/10",
            )}
         >
            {isRecording ? (
               <Square
                  aria-hidden="true"
                  className="size-5 fill-current sm:size-6"
               />
            ) : (
               <span className="size-6 animate-spin rounded-full border-2 border-white border-t-transparent sm:size-8" />
            )}

            <PulseEffect
               isActive={isRecording}
               borderColor="border-record-500"
            />
         </button>

         <div className="mx-3 flex-1 sm:mx-6">
            <WaveformDisplay
               isRecording={isRecording}
               isCompleted={status === "completed"}
               recordingTime={recordingTime}
               waveformData={waveformData}
               height={48}
               className="h-12 text-white"
            />
         </div>

         <div className="min-w-24 text-right">
            <div className="font-medium font-mono text-white text-xl tabular-nums sm:text-2xl">
               {formatTime(recordingTime)}
            </div>
            <div className="text-neutral-400 text-xs">
               {isRecording ? "録音中" : "完了"}
            </div>
         </div>
      </div>
   )
}
