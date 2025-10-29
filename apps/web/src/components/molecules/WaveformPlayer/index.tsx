"use client"

import { MdPause, MdPlayArrow } from "react-icons/md"
import type { WaveformPlayerProps } from "./types"
import { useWaveformPlayer } from "./useWaveformPlayer"
import { formatTime } from "./utils"

/**
 * wavesurfer.jsを使用した音声再生・波形表示コンポーネント
 * @param props WaveformPlayerProps
 * @returns JSX.Element
 */
export function WaveformPlayer({
   audioData,
   height = 128,
   waveColor = "#1f2937",
   progressColor = "#dc2626",
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
            className={`flex h-32 items-center justify-center rounded-lg bg-gray-100 ${className}`}
         >
            <p className="text-gray-500">音声データがありません</p>
         </div>
      )
   }

   if (error) {
      return (
         <div
            className={`flex h-32 items-center justify-center rounded-lg bg-red-50 ${className}`}
         >
            <p className="text-red-600">エラー: {error.message}</p>
         </div>
      )
   }

   return (
      <div className={`w-full ${className}`}>
         {/* 波形表示 */}
         <div
            className="relative w-full overflow-hidden rounded-lg bg-gray-50"
            style={{ height: `${height}px` }}
         >
            {/* WaveSurfer */}
            <div
               ref={containerRef}
               className="absolute inset-0 h-full w-full"
               style={{
                  // WaveSurferの進捗バーを滑らかに
                  transition: isPlaying ? "none" : "all 0.2s ease-out",
               }}
            />
         </div>

         {/* 再生/一時停止ボタンと再生時間表示 */}
         <div className="mt-4 flex items-center justify-between px-2">
            <button
               type="button"
               onClick={togglePlayPause}
               disabled={isLoading || !isInitialized}
               className="flex h-12 w-12 touch-manipulation items-center justify-center rounded-full bg-gray-900 text-white transition-colors hover:bg-gray-800 disabled:bg-gray-400"
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

            <div className="flex items-center gap-2 font-mono text-gray-600 text-sm">
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
