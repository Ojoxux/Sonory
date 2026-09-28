"use client"

import { AnimatePresence, MotionConfig, motion } from "motion/react"
import { RecordingExpandedDisplay } from "../../molecules/RecordingExpandedDisplay"
import { RecordingHeader } from "../../molecules/RecordingHeader"
import { RecordingInitialState } from "../../molecules/RecordingInitialState"
import { RecordingInstructions } from "../../molecules/RecordingInstructions"
import { RecordingMiniDisplay } from "../../molecules/RecordingMiniDisplay"
import { AudioPlayback } from "../AudioPlayback"
import { RecordingContainer } from "../RecordingContainer"
import { CROSSFADE, RECORD_BUTTON_MOTION } from "./constants"
import { useRecordingInterface } from "./hooks/useRecordingInterface"
import type { RecordingInterfaceProps } from "./types"

/**
 * 録音インターフェースコンポーネント
 *
 * @description
 * モバイルファーストのPWA向け録音UI
 * タッチ操作に最適化されたデザイン
 *
 * @param className クラス名
 * @param onExpandedChange 展開状態が変更されたときに呼び出されるコールバック関数
 * @param currentPosition 現在の位置
 */
export function RecordingInterface({
   className = "",
   onExpandedChange,
   currentPosition,
}: RecordingInterfaceProps) {
   const {
      isExpanded,
      setIsExpanded,
      status,
      recordingTime,
      showInstructions,
      showPlayback,
      isAgreed,
      showConfirmationComplete,
      instructionsRef,
      levels,
      audioData,
      microphonePermission,
      handleRecord,
      handleStartRecording,
      handleRequestMicrophonePermission,
      handleAgree,
      handleStop,
      handleClosePlayback,
      formatTime,
      instructionItems,
   } = useRecordingInterface(onExpandedChange)

   return (
      <>
         {/* 位置を動かすアニメーションは OS のモーション軽減設定に従って止める（不透明度は残る） */}
         <MotionConfig reducedMotion="user">
            <div
               className={`pointer-events-none fixed inset-x-0 bottom-0 z-chrome ${className}`}
            >
               <AnimatePresence initial={false}>
                  {status === "idle" && !showInstructions && (
                     <motion.div
                        key="record-button"
                        {...RECORD_BUTTON_MOTION}
                        className="safe-bottom pointer-events-auto absolute bottom-11 left-1/2 -translate-x-1/2"
                     >
                        <RecordingInitialState onClick={handleRecord} />
                     </motion.div>
                  )}

                  {status === "idle" && showInstructions && (
                     <div
                        key="instructions"
                        className="safe-bottom absolute inset-x-0 bottom-11 flex justify-center px-4 *:pointer-events-auto"
                     >
                        <RecordingInstructions
                           instructionItems={instructionItems}
                           isAgreed={isAgreed}
                           showConfirmationComplete={showConfirmationComplete}
                           microphonePermission={microphonePermission}
                           hasPosition={!!currentPosition}
                           onRequestMicrophonePermission={
                              handleRequestMicrophonePermission
                           }
                           onAgree={handleAgree}
                           onStartRecording={handleStartRecording}
                           instructionsRef={instructionsRef}
                        />
                     </div>
                  )}
               </AnimatePresence>
            </div>

            <AnimatePresence>
               {status !== "idle" && (
                  <RecordingContainer
                     key="recording-sheet"
                     isExpanded={isExpanded}
                     onExpandedChange={setIsExpanded}
                  >
                     <div className="relative h-16 shrink-0">
                        <AnimatePresence initial={false}>
                           <motion.div
                              key={isExpanded ? "header" : "mini"}
                              {...CROSSFADE}
                              className="absolute inset-0 px-4 sm:px-6"
                           >
                              {isExpanded ? (
                                 <RecordingHeader
                                    isRecording={status === "recording"}
                                    onCancel={handleStop}
                                    onNext={handleStop}
                                 />
                              ) : (
                                 <RecordingMiniDisplay
                                    status={status}
                                    recordingTime={recordingTime}
                                    levels={levels}
                                    formatTime={formatTime}
                                    onStop={handleStop}
                                 />
                              )}
                           </motion.div>
                        </AnimatePresence>
                     </div>

                     <RecordingExpandedDisplay
                        status={status}
                        recordingTime={recordingTime}
                        levels={levels}
                        formatTime={formatTime}
                     />
                  </RecordingContainer>
               )}
            </AnimatePresence>
         </MotionConfig>

         <AnimatePresence>
            {showPlayback && audioData && (
               <AudioPlayback
                  audioData={audioData}
                  onClose={handleClosePlayback}
                  currentPosition={currentPosition}
               />
            )}
         </AnimatePresence>
      </>
   )
}
