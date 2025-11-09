"use client"

import { useEffect, useState } from "react"
import { FloatingIndicator } from "@/components/atoms/FloatingIndicator"
import { RecordButton } from "@/components/molecules/RecordButton"
import { useInferenceStore } from "@/store/useInferenceStore"
import { useRecorderStore } from "@/store/useRecorderStore"
import { useMediaRecorder } from "./hooks/useMediaRecorder"
import type { RecordSectionProps } from "./types"

/**
 * 録音セクションコンポーネント
 *
 * @description
 * 録音ボタンとインジケーターを含む録音機能セクションのOrganismコンポーネント
 * 録音のロジックと状態管理を担当
 *
 * @example
 * ```tsx
 * <RecordSection />
 * ```
 */
export function RecordSection({ className = "" }: RecordSectionProps) {
   const { status, handleClick, remainingTime } = useRecordSection()

   return (
      <div className={`flex flex-col items-center gap-6 ${className}`}>
         {/* 録音時間インジケーター */}
         {status === "recording" && (
            <div className="animate-fade-in">
               <div className="rounded-full border border-white/20 bg-white/80 px-4 py-2 shadow-lg backdrop-blur-xl">
                  <p className="font-medium text-gray-700 text-sm">
                     録音中...{" "}
                     <span className="font-bold text-red-500">
                        {remainingTime}秒
                     </span>
                  </p>
               </div>
            </div>
         )}

         {/* 録音ボタン */}
         <RecordButton
            status={status}
            onClick={handleClick}
            disabled={status === "processing"}
         />

         {/* フローティングインジケーター */}
         <div
            className={`transition-opacity duration-300 ${status === "idle" ? "opacity-100" : "opacity-0"}`}
         >
            <FloatingIndicator />
         </div>

         {/* ステータステキスト */}
         {status === "processing" && (
            <div className="animate-fade-in">
               <div className="rounded-full border border-white/20 bg-white/80 px-4 py-2 shadow-lg backdrop-blur-xl">
                  <p className="font-medium text-purple-700 text-sm">
                     音を分析中...
                  </p>
               </div>
            </div>
         )}

         {status === "completed" && (
            <div className="animate-fade-in">
               <div className="rounded-full border border-white/20 bg-white/80 px-4 py-2 shadow-lg backdrop-blur-xl">
                  <p className="font-medium text-green-700 text-sm">
                     ✓ 録音完了
                  </p>
               </div>
            </div>
         )}
      </div>
   )
}

/**
 * 録音セクションコンポーネントのカスタムフック
 *
 * @description
 * 録音ボタンとインジケーターを含む録音機能セクションのロジックを管理
 *
 * @example
 * ```tsx
 * const { status, handleClick, remainingTime } = useRecordSection()
 * ```
 */
export function useRecordSection() {
   const [status, setStatus] = useState<
      "idle" | "recording" | "processing" | "completed"
   >("idle")
   const [remainingTime, setRemainingTime] = useState(10)
   const { startRecording, stopRecording, isRecording } = useMediaRecorder()
   const { startInference, isInferring } = useInferenceStore()
   const { audioData } = useRecorderStore()

   const handleClick = async (): Promise<void> => {
      if (!isRecording) {
         setStatus("recording")
         setRemainingTime(10)

         // カウントダウンタイマー
         const timer = setInterval(() => {
            setRemainingTime((prev) => {
               if (prev <= 1) {
                  clearInterval(timer)
                  return 0
               }
               return prev - 1
            })
         }, 1000)

         await startRecording()

         // 10秒後に自動停止
         setTimeout(async () => {
            clearInterval(timer)
            setStatus("processing")
            await stopRecording()
            // 音分析が完了するまで待機
            // stopRecording後にaudioDataが設定されるのを待つ
         }, 10000)
      } else {
         // 手動停止
         setStatus("processing")
         await stopRecording()
         // 音分析が完了するまで待機
         // stopRecording後にaudioDataが設定されるのを待つ
      }
   }

   // audioDataが設定されたら音分析を開始
   useEffect(() => {
      if (audioData && status === "processing") {
         startInference(audioData)
      }
   }, [audioData, status, startInference])

   // 音分析が完了したらcompletedにする
   useEffect(() => {
      if (status === "processing" && !isInferring && audioData) {
         setStatus("completed")
         setTimeout(() => setStatus("idle"), 3000) // 完了表示後、アイドル状態に戻す
      }
   }, [status, isInferring, audioData])

   return {
      status,
      handleClick,
      remainingTime,
   }
}
