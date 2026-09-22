"use client"

import { motion } from "motion/react"
import { Sheet } from "react-modal-sheet"
import { Button } from "@/components/atoms/Button"
import { OtherResultsAccordion } from "@/components/molecules/OtherResultsAccordion"
import { SoundWaveBackground } from "../../atoms/SoundWaveBackground"
import { DebugInfo } from "./DebugInfo"
import { PlaybackControls } from "./PlaybackControls"
import { PrimaryResult } from "./PrimaryResult"
import type { PinAudioPlayerProps } from "./types"
import { usePinAudioPlayer } from "./usePinAudioPlayer"

/**
 * ピンクリック時の音声再生コンポーネント（BottomSheet版）
 *
 * @description
 * 永続化されたピンの音声を再生するためのコンポーネントです。
 * 音声URLから直接再生し、再生状態を管理します。
 * Sonoryらしい音響的なUIエフェクトを含みます。
 * react-modal-sheet を使用してボトムシートとして表示します。
 *
 * @param pin 再生する音声ピン
 * @param onClose 閉じるボタンが押されたときのコールバック
 *
 * @example
 * ```tsx
 * <PinAudioPlayer
 *   pin={selectedPin}
 *   onClose={() => setSelectedPin(null)}
 * />
 * ```
 */
export function PinAudioPlayer({ pin, onClose }: PinAudioPlayerProps) {
   const {
      audioLoadingStatus,
      playbackState,
      audioLoadError,
      currentTime,
      duration,
      isMounted,
      progressBarRef,
      formatRecordedAt,
      formatTime,
      togglePlayback,
      handleSeek,
      handleClose,
      progressPercentage,
      formatConfidence,
   } = usePinAudioPlayer(pin, onClose)

   if (!isMounted || !pin) {
      return null
   }

   return (
      <Sheet
         isOpen={true}
         onClose={handleClose}
         detent="content"
         snapPoints={[0, 1]}
         initialSnap={1}
         tweenConfig={{ ease: "easeInOut", duration: 0.3 }}
      >
         <Sheet.Container className="border-t! border-white/10! bg-black/95! shadow-2xl! backdrop-blur-xl!">
            {/* 音波背景パターン */}
            <SoundWaveBackground
               opacity={0.01}
               animated={playbackState === "playing"}
            />

            <Sheet.Header className="bg-transparent!">
               <div className="flex flex-col items-center px-6 pt-4 pb-2">
                  <div className="mb-2 h-1 w-12 rounded-full bg-white/20" />
                  <div className="w-full text-center">
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
               </div>
            </Sheet.Header>

            <Sheet.Content className="bg-transparent!">
               {/* メインコンテンツ */}
               <div className="relative px-6 pb-6">
                  {/* ピン情報 */}
                  <div className="mb-6">
                     <h3 className="mb-3 font-semibold text-lg text-white">
                        音声分類結果
                     </h3>

                     <DebugInfo pin={pin} />

                     {pin.classificationResults.length > 0 ? (
                        <div className="mb-4 space-y-3">
                           <PrimaryResult
                              result={pin.classificationResults[0]}
                              formatConfidence={formatConfidence}
                           />

                           <OtherResultsAccordion
                              results={pin.classificationResults.slice(1)}
                           />
                        </div>
                     ) : (
                        <div className="mb-4">
                           <motion.div
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex items-center justify-between rounded-lg border border-warn-500/30 bg-warn-500/20 p-3 backdrop-blur-sm"
                           >
                              <span className="font-medium text-warn-300">
                                 {pin.environment === "unknown"
                                    ? "未分類"
                                    : pin.environment}
                              </span>
                              <span className="text-sm text-warn-400">
                                 {Math.round(pin.primaryConfidence * 100)}%
                              </span>
                           </motion.div>
                        </div>
                     )}

                     {pin.environment && (
                        <motion.div
                           className="mb-4 rounded-lg border border-accent-500/30 bg-accent-500/20 p-4 backdrop-blur-sm"
                           initial={{ opacity: 0, scale: 0.9 }}
                           animate={{ opacity: 1, scale: 1 }}
                        >
                           <span className="font-medium text-accent-300">
                              環境: {pin.environment}
                           </span>
                        </motion.div>
                     )}
                  </div>

                  {/* 音声再生エラー */}
                  {audioLoadError && (
                     <motion.div
                        className="mb-4 rounded-lg border border-danger-500/30 bg-danger-500/20 p-4 backdrop-blur-sm"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                     >
                        <span className="font-medium text-danger-300">
                           エラー: {audioLoadError}
                        </span>
                     </motion.div>
                  )}

                  {/* 音声再生コントロール */}
                  <div className="mb-6">
                     <h3 className="mb-3 font-semibold text-lg text-white">
                        音声再生
                     </h3>

                     <PlaybackControls
                        audioLoadingStatus={audioLoadingStatus}
                        playbackState={playbackState}
                        currentTime={currentTime}
                        duration={duration}
                        progressPercentage={progressPercentage}
                        progressBarRef={progressBarRef}
                        togglePlayback={togglePlayback}
                        handleSeek={handleSeek}
                        formatTime={formatTime}
                     />
                  </div>

                  {/* 閉じるボタン */}
                  <Button block onClick={handleClose}>
                     閉じる
                  </Button>
               </div>
            </Sheet.Content>
         </Sheet.Container>

         <Sheet.Backdrop className="bg-black/50! backdrop-blur-sm!" />
      </Sheet>
   )
}
