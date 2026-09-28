"use client"

import { AnimatePresence, motion } from "motion/react"
import { type ReactElement, useEffect, useState } from "react"
import { Sheet, SheetBody, SheetContent } from "@/components/molecules/Sheet"
import { formatRecordedAt } from "@/utils/dateFormat"
import { AIAnalyzingView } from "./AIAnalyzingView"
import { AnalysisResultsView } from "./AnalysisResultsView"
import { AudioReviewView } from "./AudioReviewView"
import { VIEW_HIDDEN, VIEW_SHOWN, VIEW_SWAP_TRANSITION } from "./constants"
import { useAudioProcessing, useElementHeight, usePinPlacement } from "./hooks"
import type { AudioPlaybackProps } from "./types"

/**
 * 表示状態の型定義
 */
type ViewState = "audio-review" | "ai-analyzing" | "results"

/**
 * 録音完了後の音声処理オーケストレーターコンポーネント
 *
 * @description
 * 録音完了後の3つの画面状態を1枚のシートの中で切り替える：
 * 1. 録音確認画面（AudioReviewView）
 * 2. AI分析中画面（AIAnalyzingView）
 * 3. AI分析結果画面（AnalysisResultsView）
 *
 * シートは開いたまま中身だけをクロスフェードし、高さの差も補間する。
 * マウントと同時に開き、閉じるアニメーションが終わってから `onClose` を呼ぶ。
 * ビジネスロジックはカスタムフック（useAudioProcessing, usePinPlacement）に委譲する
 *
 * @param audioData 再生する音声データ
 * @param onClose シートが閉じきったときのコールバック
 * @param currentPosition 現在の位置情報（ピン表示用）
 *
 * @example
 * ```tsx
 * <AudioPlayback
 *   audioData={audioData}
 *   onClose={() => setShowPlayback(false)}
 *   currentPosition={{ latitude: 35.6895, longitude: 139.6917 }}
 * />
 * ```
 */
export function AudioPlayback({
   audioData,
   onClose,
   currentPosition,
}: AudioPlaybackProps): ReactElement | null {
   const {
      processAudio,
      analysisMessage,
      setAnalysisMessage,
      results,
      error,
      clearResults,
      fallbackUsed,
      backendAnalysisResult,
      uploadError,
      uploadedAudioUrl,
      clearUploadState,
   } = useAudioProcessing()

   const {
      placePin,
      pinCreationStatus,
      pinCreationError,
      clearPinCreationState,
   } = usePinPlacement()

   const [viewState, setViewState] = useState<ViewState>("audio-review")
   const [open, setOpen] = useState(true)
   const { ref: contentRef, height: contentHeight } = useElementHeight()

   /**
    * 続けるボタンのクリックハンドラー
    */
   const handleContinue = async (): Promise<void> => {
      if (!audioData) return

      setViewState("ai-analyzing")

      const result = await processAudio(audioData, currentPosition)

      // バリデーションエラーの場合は録音確認画面に戻る
      if (!result.success && result.error?.includes("録音時間")) {
         setViewState("audio-review")
         return
      }

      setViewState("results")
   }

   /**
    * ピン配置ボタンのクリックハンドラー
    */
   const handlePlacePin = async (): Promise<void> => {
      if (!audioData || !currentPosition) {
         return
      }

      const result = await placePin(
         audioData,
         uploadedAudioUrl,
         currentPosition,
         results,
         fallbackUsed,
      )

      if (result.success) {
         setOpen(false)
      }
   }

   const handleClose = (): void => {
      setOpen(false)
   }

   // コンポーネントがマウントされたときに状態をクリア
   useEffect(() => {
      clearResults()
      clearUploadState()
      clearPinCreationState()
      setAnalysisMessage("音声を分析中...")
   }, [
      clearResults,
      clearUploadState,
      clearPinCreationState,
      setAnalysisMessage,
   ])

   if (!audioData) {
      return null
   }

   return (
      // MEMO: AI分析中に閉じられると困るので、分析中はドラッグ・背景タップ・Esc を無効にする
      <Sheet
         open={open}
         onClose={handleClose}
         dismissible={viewState !== "ai-analyzing"}
         onExited={onClose}
      >
         <SheetContent>
            <SheetBody>
               <motion.div
                  initial={false}
                  animate={{ height: contentHeight }}
                  transition={VIEW_SWAP_TRANSITION}
                  className="overflow-hidden"
               >
                  <div ref={contentRef} className="relative">
                     <AnimatePresence mode="popLayout" initial={false}>
                        <motion.div
                           key={viewState}
                           initial={VIEW_HIDDEN}
                           animate={VIEW_SHOWN}
                           exit={VIEW_HIDDEN}
                           transition={VIEW_SWAP_TRANSITION}
                        >
                           {viewState === "audio-review" && (
                              <AudioReviewView
                                 audioData={audioData}
                                 formattedDate={formatRecordedAt(
                                    audioData.recordedAt,
                                 )}
                                 onContinue={handleContinue}
                                 onCancel={handleClose}
                              />
                           )}

                           {viewState === "ai-analyzing" && (
                              <AIAnalyzingView message={analysisMessage} />
                           )}

                           {viewState === "results" && (
                              <AnalysisResultsView
                                 audioData={audioData}
                                 results={results}
                                 error={error}
                                 uploadError={uploadError}
                                 pinCreationError={pinCreationError}
                                 fallbackUsed={fallbackUsed}
                                 backendAnalysisResult={backendAnalysisResult}
                                 onPlacePin={handlePlacePin}
                                 onClose={handleClose}
                                 pinCreationStatus={pinCreationStatus}
                                 hasPosition={!!currentPosition}
                              />
                           )}
                        </motion.div>
                     </AnimatePresence>
                  </div>
               </motion.div>
            </SheetBody>
         </SheetContent>
      </Sheet>
   )
}
