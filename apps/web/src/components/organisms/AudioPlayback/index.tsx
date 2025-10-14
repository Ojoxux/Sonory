"use client"

import { formatRecordedAt } from "@/utils/dateFormat"
import { useCallback, useEffect, useState } from "react"
import { AIAnalyzingView } from "./AIAnalyzingView"
import { AnalysisResultsView } from "./AnalysisResultsView"
import { AudioReviewView } from "./AudioReviewView"
import { useAudioProcessing, usePinPlacement } from "./hooks"
import type { AudioPlaybackProps } from "./types"

/**
 * 表示状態の型定義
 */
type ViewState = "audio-review" | "ai-analyzing" | "results"

/**
 * 録音完了後の音声処理オーケストレーターコンポーネント
 *
 * @description
 * 録音完了後の3つの画面状態を管理するオーケストレーター：
 * 1. 録音確認画面（AudioReviewView）
 * 2. AI分析中画面（AIAnalyzingView）
 * 3. AI分析結果画面（AnalysisResultsView）
 *
 * ビジネスロジックはカスタムフック（useAudioProcessing, usePinPlacement）に委譲し、
 * このコンポーネントは状態管理と画面遷移のみを担当する
 *
 * @param audioData 再生する音声データ
 * @param onClose 閉じるボタンが押されたときのコールバック
 * @param className クラス名
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
}: AudioPlaybackProps) {
   // カスタムフックで状態とロジックを管理
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

   /**
    * 波形プレイヤーの準備完了時のコールバック（メモ化）
    */
   const handleWaveformReady = useCallback(() => {
      // TODO: 音声準備完了時の処理を実装
   }, [])

   /**
    * 波形プレイヤーの再生完了時のコールバック（メモ化）
    */
   const handleWaveformFinish = useCallback(() => {
      // TODO: 音声再生完了時の処理を実装
   }, [])

   /**
    * 続けるボタンのクリックハンドラー
    */
   const handleContinue = async (): Promise<void> => {
      if (!audioData) return

      // AI分析画面に遷移
      setViewState("ai-analyzing")

      // 音声処理を実行
      const result = await processAudio(audioData, currentPosition)

      // バリデーションエラーの場合は録音確認画面に戻る
      if (!result.success && result.error?.includes("録音時間")) {
         setViewState("audio-review")
         return
      }

      // 結果画面に遷移
      setViewState("results")
   }

   /**
    * ピン配置ボタンのクリックハンドラー
    */
   const handlePlacePin = async (): Promise<void> => {
      if (!audioData || !currentPosition) {
         console.warn("⚠️ 音声データまたは位置情報が不足しています")
         return
      }

      const result = await placePin(
         audioData,
         uploadedAudioUrl,
         currentPosition,
         results,
      )

      // 成功時は閉じる
      if (result.success) {
         onClose()
      }
   }

   /**
    * キャンセル・閉じるボタンのクリックハンドラー
    */
   const handleClose = (): void => {
      onClose()
   }

   // コンポーネントがマウントされたときに状態をクリア
   useEffect(() => {
      clearResults()
      clearUploadState()
      clearPinCreationState()
      setViewState("audio-review")
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
      <>
         {/* 音声確認画面 */}
         {viewState === "audio-review" && (
            <AudioReviewView
               isOpen={true}
               audioData={audioData}
               formattedDate={formatRecordedAt(audioData.recordedAt)}
               onContinue={handleContinue}
               onCancel={handleClose}
               onWaveformReady={handleWaveformReady}
               onWaveformFinish={handleWaveformFinish}
            />
         )}

         {/* AI分析中画面 */}
         {/* MEMO: AI分析中に閉じられると困るので、onCloseを使用しない */}
         {viewState === "ai-analyzing" && (
            <AIAnalyzingView isOpen={true} message={analysisMessage} />
         )}

         {/* AI分析結果画面 */}
         {viewState === "results" && (
            <AnalysisResultsView
               isOpen={true}
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
               onWaveformReady={handleWaveformReady}
               onWaveformFinish={handleWaveformFinish}
            />
         )}
      </>
   )
}
