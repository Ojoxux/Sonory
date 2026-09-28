"use client"

import { type ReactElement, useState } from "react"
import { Button } from "@/components/atoms/Button"
import { OtherResultsAccordion } from "@/components/molecules/OtherResultsAccordion"
import {
   Sheet,
   SheetBody,
   SheetContent,
   SheetHeader,
} from "@/components/molecules/Sheet"
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
 * マウントと同時に開き、閉じるアニメーションが終わってから `onClose` を呼ぶ。
 *
 * @param pin 再生する音声ピン
 * @param onClose シートが閉じきったときのコールバック
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
}: PinAudioPlayerProps): ReactElement {
   const [open, setOpen] = useState(true)
   const {
      audioLoadingStatus,
      playbackState,
      audioLoadError,
      currentTime,
      duration,
      progressBarRef,
      formatRecordedAt,
      formatTime,
      togglePlayback,
      handleSeek,
      handleClose,
      progressPercentage,
      formatConfidence,
   } = usePinAudioPlayer(pin, () => setOpen(false))

   return (
      <Sheet open={open} onClose={handleClose} onExited={onClose}>
         <SheetContent>
            <SoundWaveBackground
               opacity={0.01}
               animated={playbackState === "playing"}
            />

            <SheetHeader
               title="音声ピン再生"
               description={formatRecordedAt(pin.recordedAt)}
            />

            <SheetBody>
               <div className="relative px-6 pb-6">
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
                        <div className="mb-4 flex items-center justify-between rounded-xl border border-warn-500/30 bg-warn-500/10 p-3">
                           <span className="font-medium text-warn-300">
                              {pin.environment === "unknown"
                                 ? "未分類"
                                 : pin.environment}
                           </span>
                           <span className="text-sm text-warn-300">
                              {Math.round(pin.primaryConfidence * 100)}%
                           </span>
                        </div>
                     )}

                     {pin.environment && (
                        <div className="mb-4 rounded-xl border border-accent-500/30 bg-accent-500/10 p-4">
                           <span className="font-medium text-accent-300">
                              環境: {pin.environment}
                           </span>
                        </div>
                     )}
                  </div>

                  {audioLoadError && (
                     <div
                        role="alert"
                        className="mb-4 rounded-xl border border-danger-500/30 bg-danger-500/10 p-4"
                     >
                        <span className="font-medium text-danger-300">
                           エラー: {audioLoadError}
                        </span>
                     </div>
                  )}

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

                  <Button block onClick={handleClose}>
                     閉じる
                  </Button>
               </div>
            </SheetBody>
         </SheetContent>
      </Sheet>
   )
}
