"use client"

import { MdPause, MdPlayArrow } from "react-icons/md"
import type { WaveformPlayerProps } from "./types"
import { useWaveformPlayer } from "./useWaveformPlayer"
import { PROGRESS_COLOR, WAVE_COLOR } from "./constants"
import { formatTime } from "./utils"

/**
 * wavesurfer.jsを使用した音声再生・波形表示コンポーネント
 * @param props WaveformPlayerProps
 * @returns JSX.Element
 */
export function WaveformPlayer({
   audioData,
   height = 128,
   waveColor = WAVE_COLOR,
   progressColor = PROGRESS_COLOR,
   className = "",
   onReady,
   onFinish,
}: WaveformPlayerProps) {
   const {
      containerRef,
      isPlaying,
      isLoading,
      isInitialized,
      currentTime,
      duration,
      error,
      togglePlayPause,
   } = useWaveformPlayer({
      audioData,
      height,
      waveColor,
      progressColor,
      onReady,
      onFinish,
   })

   if (!audioData) {
      return (
         <div
            className={`flex h-32 items-center justify-center rounded-lg bg-white/5 ${className}`}
         >
            <p className="text-neutral-400 text-sm">音声データがありません</p>
         </div>
      )
   }

   if (error) {
      return (
         <div
            className={`flex h-32 items-center justify-center rounded-lg border border-danger-500/30 bg-danger-500/10 ${className}`}
         >
            <p className="text-danger-300 text-sm">エラー: {error.message}</p>
         </div>
      )
   }

   return (
      <div className={`w-full ${className}`}>
         {/* 波形表示 */}
         <div
            className="relative w-full overflow-hidden rounded-lg bg-white/5"
            style={{ height: `${height}px` }}
         >
            <div
               ref={containerRef}
               className="absolute inset-0 h-full w-full"
            />
         </div>

         {/* 再生/一時停止ボタンと再生時間表示 */}
         <div className="mt-4 flex items-center justify-between px-2">
            <button
               type="button"
               onClick={togglePlayPause}
               disabled={isLoading || !isInitialized}
               className="flex h-12 w-12 touch-manipulation items-center justify-center rounded-full bg-white/10 text-white transition duration-press ease-out hover:bg-white/15 not-disabled:active:scale-97 disabled:cursor-not-allowed disabled:opacity-50"
               aria-label={isPlaying ? "一時停止" : "再生"}
            >
               {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
               ) : isPlaying ? (
                  <MdPause className="h-6 w-6" />
               ) : (
                  <MdPlayArrow className="h-6 w-6" />
               )}
            </button>

            <div className="flex items-center gap-2 font-mono text-neutral-400 text-sm">
               <span>
                  {formatTime(Number.isFinite(currentTime) ? currentTime : 0)}
               </span>
               <span>/</span>
               <span>
                  {formatTime(Number.isFinite(duration) ? duration : 0)}
               </span>
            </div>

            <div className="w-12" />
         </div>
      </div>
   )
}
