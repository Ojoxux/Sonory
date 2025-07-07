"use client"

import { useInferenceStore } from "@/store/useInferenceStore"
import { useRecorderStore } from "@/store/useRecorderStore"
import { useSoundPinStore } from "@/store/useSoundPinStore"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { MdClose } from "react-icons/md"
import { SonicLoader } from "../../atoms/SonicLoader"
import { SoundWaveBackground } from "../../atoms/SoundWaveBackground"
import { WaveformPlayer } from "../../molecules/WaveformPlayer"
import type { AudioPlaybackProps } from "./types"

/**
 * 表示状態の型定義
 */
type ViewState = "audio-review" | "uploading" | "ai-analyzing" | "results"

/**
 * 録音完了後の音声再生コンポーネント
 *
 * @description
 * 録音が完了した音声データの再生と削除機能を提供します。
 * wavesurfer.jsを使用した波形表示と再生コントロールを含みます。
 * ユーザーの操作に応じてAI推論を実行し、結果をマップピンとして表示します。
 * Sonoryらしい音響的なUIエフェクトを含みます。
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
   className = "",
   currentPosition,
}: AudioPlaybackProps) {
   const {
      startInference,
      results,
      error,
      clearResults,
      analysisStatus,
      fallbackUsed,
      backendAnalysisResult,
   } = useInferenceStore()
   const {
      uploadAudioToStorage,
      uploadStatus,
      uploadProgress,
      uploadError,
      uploadedAudioUrl,
      uploadedAudioId,
      clearUploadState,
   } = useRecorderStore()
   const { addPin } = useSoundPinStore()
   const [viewState, setViewState] = useState<ViewState>("audio-review")
   const [analysisMessage, setAnalysisMessage] = useState("音声を分析中...")

   // TODO: viewState変更時のログ処理を実装（必要に応じて）

   /**
    * 録音時間をフォーマット
    */
   const formatRecordedAt = (date: Date): string => {
      return date.toLocaleString("ja-JP", {
         year: "numeric",
         month: "2-digit",
         day: "2-digit",
         hour: "2-digit",
         minute: "2-digit",
         second: "2-digit",
      })
   }

   /**
    * 信頼度をパーセンテージでフォーマット
    */
   const formatConfidence = (confidence: number): string => {
      return `${Math.round(confidence * 100)}%`
   }

   /**
    * 続けるボタンのクリックハンドラー
    */
   const handleContinue = async (): Promise<void> => {
      if (!audioData) return

      try {
         // まず音声をアップロード
         setViewState("uploading")
         setAnalysisMessage("音声をアップロード中...")

         // 音声時間を計算（10秒固定または実際の長さ）
         const duration = audioData.recordedAt ? 10 : 10 // デフォルト10秒

         const metadata = {
            duration,
            location: currentPosition
               ? {
                    lat: currentPosition.latitude,
                    lng: currentPosition.longitude,
                 }
               : undefined,
         }

         await uploadAudioToStorage(audioData.blob, metadata)

         // アップロード完了後、AI分析を開始
         setViewState("ai-analyzing")

         // 段階的にメッセージを変更（15秒間）
         setAnalysisMessage("音声データを読み込み中...")

         setTimeout(() => {
            if (viewState === "ai-analyzing") {
               setAnalysisMessage("AIモデルで分析中...")
            }
         }, 5000)

         setTimeout(() => {
            if (viewState === "ai-analyzing") {
               setAnalysisMessage("パターンマッチングを実行中...")
            }
         }, 10000)

         setTimeout(() => {
            if (viewState === "ai-analyzing") {
               setAnalysisMessage("結果を生成中...")
            }
         }, 13000)

         await startInference(audioData)
         setViewState("results")
      } catch (err) {
         console.error("💥 処理に失敗しました:", err)
         // エラーが発生した場合も結果画面に遷移（エラー表示のため）
         setViewState("results")
      }
   }

   /**
    * ピン配置ボタンのクリックハンドラー
    */
   const handlePlacePin = (): void => {
      if (
         results.length > 0 &&
         currentPosition &&
         audioData &&
         uploadedAudioUrl
      ) {
         // アップロード済みのURLと位置情報を使ってピンを作成
         addPin({
            latitude: currentPosition.latitude,
            longitude: currentPosition.longitude,
            audioData: {
               ...audioData,
               url: uploadedAudioUrl, // アップロード済みURLを使用
            },
            classificationResults: results,
         })
         onClose()
      }
   }

   /**
    * キャンセル・閉じるボタンのクリックハンドラー
    */
   const handleClose = (): void => {
      onClose()
   }

   // コンポーネントがマウントされたときに推論結果をクリア
   useEffect(() => {
      clearResults()
      clearUploadState()
      setViewState("audio-review")
      setAnalysisMessage("音声を分析中...")
   }, [clearResults, clearUploadState])

   if (!audioData) {
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
            <SoundWaveBackground opacity={0.01} animated={true} />

            {/* ヘッダー */}
            <div className="relative flex items-center justify-between border-white/10 border-b p-6">
               <div>
                  <motion.h2
                     className="font-bold text-white text-xl"
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: 0.2 }}
                  >
                     {viewState === "audio-review" && "録音完了"}
                     {viewState === "uploading" && "アップロード中"}
                     {viewState === "ai-analyzing" && "AI分析中"}
                     {viewState === "results" && "AI分析結果"}
                  </motion.h2>
                  <motion.p
                     className="mt-1 text-neutral-300 text-sm"
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: 0.3 }}
                  >
                     {formatRecordedAt(audioData.recordedAt)}
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
               {/* 音声確認画面 */}
               {viewState === "audio-review" && (
                  <motion.div
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.1 }}
                  >
                     <div className="mb-6">
                        <h3 className="mb-3 font-semibold text-lg text-white">
                           録音音声
                        </h3>
                        <WaveformPlayer
                           audioData={audioData}
                           height={120}
                           waveColor="#9ca3af"
                           progressColor="#dc2626"
                           className="w-full"
                           onReady={() => {
                              // TODO: 音声準備完了時の処理を実装
                           }}
                           onFinish={() => {
                              // TODO: 音声再生完了時の処理を実装
                           }}
                        />
                     </div>

                     <div className="flex gap-3">
                        <motion.button
                           onClick={handleClose}
                           className="flex-1 touch-manipulation rounded-xl border border-white/10 bg-white/10 px-4 py-3 font-semibold text-white shadow-[0_4px_20px_rgba(255,255,255,0.1)] backdrop-blur-sm transition-all duration-300 hover:bg-white/20 hover:shadow-[0_8px_32px_rgba(255,255,255,0.2)]"
                           whileHover={{ scale: 1.02 }}
                           whileTap={{ scale: 0.98 }}
                        >
                           キャンセル
                        </motion.button>
                        <motion.button
                           onClick={handleContinue}
                           className="flex-1 touch-manipulation rounded-xl border border-blue-500/30 bg-blue-600/80 px-4 py-3 font-semibold text-white shadow-[0_4px_20px_rgba(59,130,246,0.4)] backdrop-blur-sm transition-all duration-300 hover:bg-blue-600 hover:shadow-[0_8px_32px_rgba(59,130,246,0.6)]"
                           whileHover={{ scale: 1.02 }}
                           whileTap={{ scale: 0.98 }}
                        >
                           続ける
                        </motion.button>
                     </div>
                  </motion.div>
               )}

               {/* アップロード中画面 */}
               {viewState === "uploading" && (
                  <SonicLoader
                     isLoading={true}
                     text={`${analysisMessage} (${uploadProgress}%)`}
                  />
               )}

               {/* AI分析中画面 */}
               {viewState === "ai-analyzing" && (
                  <SonicLoader isLoading={true} text={analysisMessage} />
               )}

               {/* AI分析結果画面 */}
               {viewState === "results" && (
                  <motion.div
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.1 }}
                  >
                     <div className="mb-6">
                        <h3 className="mb-3 font-semibold text-lg text-white">
                           AI音分類結果
                        </h3>

                        {(error || uploadError) && (
                           <motion.div
                              className="mb-4 rounded-lg border border-red-500/30 bg-red-500/20 p-4 backdrop-blur-sm"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                           >
                              <span className="font-medium text-red-300">
                                 エラー: {uploadError || error?.message}
                              </span>
                           </motion.div>
                        )}

                        {fallbackUsed && (
                           <motion.div
                              className="mb-4 rounded-lg border border-yellow-500/30 bg-yellow-500/20 p-4 backdrop-blur-sm"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                           >
                              <span className="font-medium text-yellow-300">
                                 ⚠️
                                 バックエンドAPI接続失敗。オフライン分析結果を表示しています。
                              </span>
                           </motion.div>
                        )}

                        {results.length > 0 && (
                           <div className="mb-6 space-y-2">
                              {results.map((result, index) => (
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
                                       {formatConfidence(result.confidence)}
                                    </span>
                                 </motion.div>
                              ))}
                           </div>
                        )}

                        {backendAnalysisResult?.environment && (
                           <motion.div
                              className="mb-4 rounded-lg border border-blue-500/30 bg-blue-500/20 p-4 backdrop-blur-sm"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                           >
                              <span className="font-medium text-blue-300">
                                 環境:{" "}
                                 {backendAnalysisResult.environment
                                    .description ||
                                    backendAnalysisResult.environment
                                       .primary_type}
                              </span>
                           </motion.div>
                        )}
                     </div>

                     {/* 録音音声プレイヤー（結果画面でも表示） */}
                     <div className="mb-6">
                        <h3 className="mb-3 font-semibold text-lg text-white">
                           録音音声
                        </h3>
                        <WaveformPlayer
                           audioData={audioData}
                           height={120}
                           waveColor="#9ca3af"
                           progressColor="#dc2626"
                           className="w-full"
                           onReady={() => {
                              // TODO: 音声準備完了時の処理を実装
                           }}
                           onFinish={() => {
                              // TODO: 音声再生完了時の処理を実装
                           }}
                        />
                     </div>

                     {/* アクションボタン */}
                     <div className="flex gap-3">
                        {results.length > 0 &&
                        currentPosition &&
                        uploadedAudioUrl ? (
                           <motion.button
                              onClick={handlePlacePin}
                              className="w-full touch-manipulation rounded-xl border border-green-500/30 bg-green-600/80 px-4 py-3 font-semibold text-white shadow-[0_4px_20px_rgba(34,197,94,0.4)] backdrop-blur-sm transition-all duration-300 hover:bg-green-600 hover:shadow-[0_8px_32px_rgba(34,197,94,0.6)]"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                           >
                              マップにピンを配置
                           </motion.button>
                        ) : (
                           <motion.button
                              onClick={handleClose}
                              className="w-full touch-manipulation rounded-xl border border-blue-500/30 bg-blue-600/80 px-4 py-3 font-semibold text-white shadow-[0_4px_20px_rgba(59,130,246,0.4)] backdrop-blur-sm transition-all duration-300 hover:bg-blue-600 hover:shadow-[0_8px_32px_rgba(59,130,246,0.6)]"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                           >
                              閉じる
                           </motion.button>
                        )}
                     </div>
                  </motion.div>
               )}
            </div>
         </motion.div>
      </motion.div>
   )
}
