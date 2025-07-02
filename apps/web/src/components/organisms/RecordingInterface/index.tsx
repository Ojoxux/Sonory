"use client";

import { AnimatePresence, motion } from "framer-motion";
import { RecordingExpandedDisplay } from "../../molecules/RecordingExpandedDisplay";
import { RecordingInitialState } from "../../molecules/RecordingInitialState";
import { RecordingInstructions } from "../../molecules/RecordingInstructions";
import { RecordingMiniDisplay } from "../../molecules/RecordingMiniDisplay";
import { AudioPlayback } from "../AudioPlayback";
import { RecordingContainer } from "../RecordingContainer";
import { useRecordingInterface } from "./hooks/useRecordingInterface";
import type { RecordingInterfaceProps } from "./type";
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
      isClosing,
      showPlayback,
      isAgreed,
      showConfirmationComplete,
      constraintsRef,
      instructionsRef,
      waveformData,
      audioData,
      handleRecord,
      handleStartRecording,
      handleAgree,
      handleStop,
      handleClosePlayback,
      formatTime,
      handleDragEnd,
      instructionItems,
	} = useRecordingInterface(onExpandedChange);

   return (
      <div
         className={`fixed bottom-0 left-0 right-0 pointer-events-auto ${className}`}
			style={{ zIndex: status !== "idle" && isExpanded ? 110 : 50 }}
      >
         {/* 初期状態の録音ボタン（録音していない時のみ表示） */}
         <AnimatePresence>
				{status === "idle" && (
               <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-6 left-1/2 transform -translate-x-1/2 safe-bottom"
               >
                  {!showInstructions ? (
							<RecordingInitialState onClick={handleRecord} />
						) : (
							<RecordingInstructions
								instructionItems={instructionItems}
                                 isClosing={isClosing}
								isAgreed={isAgreed}
								showConfirmationComplete={showConfirmationComplete}
								onAgree={handleAgree}
								onStartRecording={handleStartRecording}
								instructionsRef={instructionsRef}
							/>
                  )}
               </motion.div>
            )}
         </AnimatePresence>

         {/* 録音中のUI */}
         <AnimatePresence>
				{status !== "idle" && (
					<RecordingContainer
						isExpanded={isExpanded}
						constraintsRef={constraintsRef}
                     onDragEnd={handleDragEnd}
						onToggleExpand={() => setIsExpanded(!isExpanded)}
                     >
                        {/* ミニマム表示（非展開時のみ表示） */}
						{!isExpanded ? (
							<RecordingMiniDisplay
								status={status}
                                    recordingTime={recordingTime}
                                    waveformData={waveformData}
								formatTime={formatTime}
								onStop={handleStop}
							/>
						) : (
							<RecordingExpandedDisplay
								status={status}
                                          recordingTime={recordingTime}
                                          waveformData={waveformData}
								formatTime={formatTime}
								onCancel={() => {
									handleStop();
									setIsExpanded(false);
								}}
								onNext={handleStop}
								onStop={handleStop}
							/>
						)}
					</RecordingContainer>
            )}
         </AnimatePresence>

         {/* 音声再生モーダル */}
         <AnimatePresence>
            {showPlayback && audioData && (
               <AudioPlayback
                  audioData={audioData}
                  onClose={handleClosePlayback}
                  currentPosition={currentPosition}
               />
            )}
         </AnimatePresence>
      </div>
	);
}
