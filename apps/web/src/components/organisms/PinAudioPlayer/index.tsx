"use client"

import type { SoundPin } from "@/store/useSoundPinStore"
import { motion } from "framer-motion"
import { useCallback, useEffect, useState } from "react"
import { MdClose, MdPause, MdPlayArrow } from "react-icons/md"
import { SoundWaveBackground } from "../../atoms/SoundWaveBackground"

/**
 * 音声読み込み状態の型定義
 */
type AudioLoadingStatus = "idle" | "loading" | "ready" | "error"

/**
 * 再生状態の型定義
 */
type PlaybackState = "idle" | "playing" | "paused" | "ended"

/**
 * PinAudioPlayerコンポーネントのプロパティ型
 */
export interface PinAudioPlayerProps {
   /** 再生する音声ピン */
   pin: SoundPin | null
   /** 閉じるボタンが押されたときのコールバック */
   onClose: () => void
   /** クラス名 */
   className?: string
}

/**
 * ピンクリック時の音声再生コンポーネント
 *
 * @description
 * 永続化されたピンの音声を再生するためのコンポーネントです。
 * 音声URLから直接再生し、再生状態を管理します。
 * Sonoryらしい音響的なUIエフェクトを含みます。
 *
 * @param pin 再生する音声ピン
 * @param onClose 閉じるボタンが押されたときのコールバック
 * @param className クラス名
 *
 * @example
 * ```tsx
 * <PinAudioPlayer
 *   pin={selectedPin}
 *   onClose={() => setSelectedPin(null)}
 * />
 * ```
 */
export function PinAudioPlayer({
   pin,
   onClose,
   className = "",
}: PinAudioPlayerProps) {
   const [audioLoadingStatus, setAudioLoadingStatus] =
      useState<AudioLoadingStatus>("idle")
   const [playbackState, setPlaybackState] = useState<PlaybackState>("idle")
   const [audioLoadError, setAudioLoadError] = useState<string | null>(null)
   const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
      null,
   )
   const [currentTime, setCurrentTime] = useState<number>(0)
   const [duration, setDuration] = useState<number>(0)

   /**
    * 録音時間をフォーマット
    */
   const formatRecordedAt = useCallback((date: Date): string => {
      return date.toLocaleString("ja-JP", {
         year: "numeric",
         month: "2-digit",
         day: "2-digit",
         hour: "2-digit",
         minute: "2-digit",
         second: "2-digit",
      })
   }, [])

   /**
    * 時間をフォーマット（MM:SS形式）
    */
   const formatTime = useCallback((seconds: number): string => {
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
   }, [])

   /**
    * 音声を読み込み
    */
   const loadAudio = useCallback(async (audioUrl: string): Promise<void> => {
      try {
         setAudioLoadingStatus("loading")
         setAudioLoadError(null)

         const audio = new Audio(audioUrl)

         // 音声読み込み完了時の処理
         audio.onloadedmetadata = () => {
            setDuration(audio.duration)
            setAudioLoadingStatus("ready")
         }

         // 音声再生時間更新
         audio.ontimeupdate = () => {
            setCurrentTime(audio.currentTime)
         }

         // 音声再生終了時の処理
         audio.onended = () => {
            setPlaybackState("ended")
            setCurrentTime(0)
         }

         // 音声読み込みエラー時の処理
         audio.onerror = () => {
            setAudioLoadingStatus("error")
            setAudioLoadError("音声の読み込みに失敗しました")
         }

         setAudioElement(audio)
      } catch (error) {
         setAudioLoadingStatus("error")
         setAudioLoadError(
            error instanceof Error
               ? error.message
               : "音声の読み込みに失敗しました",
         )
      }
   }, [])

   /**
    * 音声再生/一時停止のトグル
    */
   const togglePlayback = useCallback(async (): Promise<void> => {
      if (!audioElement) return

      try {
         if (playbackState === "playing") {
            audioElement.pause()
            setPlaybackState("paused")
         } else {
            await audioElement.play()
            setPlaybackState("playing")
         }
      } catch (error) {
         console.error("音声再生エラー:", error)
         setAudioLoadError("音声の再生に失敗しました")
      }
   }, [audioElement, playbackState])

   /**
    * 音声停止
    */
   const stopAudio = useCallback((): void => {
      if (audioElement) {
         audioElement.pause()
         audioElement.currentTime = 0
         setPlaybackState("idle")
         setCurrentTime(0)
      }
   }, [audioElement])

   /**
    * 閉じるボタンのクリックハンドラー
    */
   const handleClose = useCallback((): void => {
      stopAudio()
      onClose()
   }, [stopAudio, onClose])

   // ピンが変更されたときに音声を読み込み
   useEffect(() => {
      if (pin?.audioData?.url) {
         loadAudio(pin.audioData.url)
      }

      return () => {
         // クリーンアップ
         if (audioElement) {
            audioElement.pause()
            audioElement.src = ""
         }
      }
   }, [pin, loadAudio])

   // コンポーネントがアンマウントされるときのクリーンアップ
   useEffect(() => {
      return () => {
         if (audioElement) {
            audioElement.pause()
            audioElement.src = ""
         }
      }
   }, [audioElement])

   if (!pin) {
      return null
   }

   return (
      <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         exit={{ opacity: 0, y: 20 }}
         className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm ${className}`}
      >
         <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-black/95 shadow-2xl backdrop-blur-xl"
         >
            {/* 音波背景パターン */}
            <SoundWaveBackground
               opacity={0.01}
               animated={playbackState === "playing"}
            />

            {/* ヘッダー */}
            <div className="relative flex items-center justify-between border-white/10 border-b p-6">
               <div>
                  <motion.h2
                     className="font-bold text-white text-xl"
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: 0.2 }}
                  >
                     音声ピン再生
                  </motion.h2>
                  <motion.p
                     className="mt-1 text-neutral-300 text-sm"
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: 0.3 }}
                  >
                     {formatRecordedAt(pin.recordedAt)}
                  </motion.p>
               </div>
               <motion.button
                  onClick={handleClose}
                  className="touch-manipulation rounded-full p-2 transition-colors hover:bg-white/10"
                  aria-label="閉じる"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
               >
                  <MdClose className="h-6 w-6 text-white" />
               </motion.button>
            </div>

            {/* メインコンテンツ */}
            <div className="relative p-6">
               {/* ピン情報 */}
               <div className="mb-6">
                  <h3 className="mb-3 font-semibold text-lg text-white">
                     音声分類結果
                  </h3>

                  {pin.classificationResults.length > 0 && (
                     <div className="mb-4 space-y-2">
                        {pin.classificationResults.map((result, index) => (
                           <motion.div
                              key={`${result.label}-${index}`}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className={`flex items-center justify-between rounded-lg border p-3 backdrop-blur-sm ${
                                 index === 0
                                    ? "border-green-500/30 bg-green-500/20"
                                    : "border-white/10 bg-white/5"
                              }`}
                           >
                              <span
                                 className={`font-medium ${
                                    index === 0
                                       ? "text-green-300"
                                       : "text-neutral-200"
                                 }`}
                              >
                                 {result.label}
                              </span>
                              <span
                                 className={`text-sm ${
                                    index === 0
                                       ? "text-green-400"
                                       : "text-neutral-400"
                                 }`}
                              >
                                 {Math.round(result.confidence * 100)}%
                              </span>
                           </motion.div>
                        ))}
                     </div>
                  )}

                  {pin.environment && (
                     <motion.div
                        className="mb-4 rounded-lg border border-blue-500/30 bg-blue-500/20 p-4 backdrop-blur-sm"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                     >
                        <span className="font-medium text-blue-300">
                           環境: {pin.environment}
                        </span>
                     </motion.div>
                  )}
               </div>

               {/* 音声再生エラー */}
               {audioLoadError && (
                  <motion.div
                     className="mb-4 rounded-lg border border-red-500/30 bg-red-500/20 p-4 backdrop-blur-sm"
                     initial={{ opacity: 0, scale: 0.9 }}
                     animate={{ opacity: 1, scale: 1 }}
                  >
                     <span className="font-medium text-red-300">
                        エラー: {audioLoadError}
                     </span>
                  </motion.div>
               )}

               {/* 音声再生コントロール */}
               <div className="mb-6">
                  <h3 className="mb-3 font-semibold text-lg text-white">
                     音声再生
                  </h3>

                  <div className="rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                     {/* 再生ボタン */}
                     <div className="mb-4 flex items-center justify-center">
                        <motion.button
                           onClick={togglePlayback}
                           disabled={audioLoadingStatus !== "ready"}
                           className={`flex h-16 w-16 items-center justify-center rounded-full transition-all duration-300 ${
                              audioLoadingStatus === "ready"
                                 ? "bg-blue-600 text-white hover:bg-blue-700"
                                 : "cursor-not-allowed bg-gray-600 text-gray-400"
                           }`}
                           whileHover={
                              audioLoadingStatus === "ready"
                                 ? { scale: 1.05 }
                                 : {}
                           }
                           whileTap={
                              audioLoadingStatus === "ready"
                                 ? { scale: 0.95 }
                                 : {}
                           }
                        >
                           {audioLoadingStatus === "loading" ? (
                              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                           ) : playbackState === "playing" ? (
                              <MdPause className="h-8 w-8" />
                           ) : (
                              <MdPlayArrow className="h-8 w-8" />
                           )}
                        </motion.button>
                     </div>

                     {/* 再生時間表示 */}
                     {duration > 0 && (
                        <div className="text-center text-neutral-300 text-sm">
                           {formatTime(currentTime)} / {formatTime(duration)}
                        </div>
                     )}

                     {/* 進捗バー */}
                     {duration > 0 && (
                        <div className="mt-2 h-2 w-full rounded-full bg-white/10">
                           <div
                              className="h-2 rounded-full bg-blue-500 transition-all duration-300"
                              style={{
                                 width: `${(currentTime / duration) * 100}%`,
                              }}
                           />
                        </div>
                     )}
                  </div>
               </div>

               {/* 閉じるボタン */}
               <motion.button
                  onClick={handleClose}
                  className="w-full touch-manipulation rounded-xl border border-white/10 bg-white/10 px-4 py-3 font-semibold text-white shadow-[0_4px_20px_rgba(255,255,255,0.1)] backdrop-blur-sm transition-all duration-300 hover:bg-white/20 hover:shadow-[0_8px_32px_rgba(255,255,255,0.2)]"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
               >
                  閉じる
               </motion.button>
            </div>
         </motion.div>
      </motion.div>
   )
}
