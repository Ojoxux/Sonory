"use client"

import { useInferenceStore } from "@/store/useInferenceStore"
import { useRecorderStore } from "@/store/useRecorderStore"
import { useSoundPinStore } from "@/store/useSoundPinStore"
import { motion } from "framer-motion"
import { useCallback, useEffect, useState } from "react"
import { MdClose } from "react-icons/md"
import { AIAnalysisOrb } from "../../atoms/AIAnalysisOrb"
import { SoundWaveBackground } from "../../atoms/SoundWaveBackground"
import { WaveformPlayer } from "../../molecules/WaveformPlayer"
import type { AudioPlaybackProps } from "./types"

/**
 * 表示状態の型定義
 */
type ViewState = "audio-review" | "ai-analyzing" | "results"

/**
 * 録音完了後の音声再生コンポーネント
 *
 * @description
 * 録音が完了した音声データの再生と削除機能を提供する
 * wavesurfer.jsを使用した波形表示と再生コントロールを含む
 * ユーザーの操作に応じてAI推論を実行し、結果をマップピンとして表示
 * Sonoryらしい音響的なUIエフェクトを含む
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
 *
 * @memo
 * 録音確認、AI分析、結果表示の3つの画面を切り替えているためコンポーネントの責務が複雑になっている
 * TODO: なるはや責務分割して、コンポーネントの責務を明確にしたい
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
      fallbackUsed,
      backendAnalysisResult,
   } = useInferenceStore()
   const {
      uploadAudioToStorage,
      uploadError,
      uploadedAudioUrl,
      clearUploadState,
   } = useRecorderStore()
   const {
      createPersistentPin,
      pinCreationStatus,
      pinCreationError,
      clearPinCreationState,
   } = useSoundPinStore()
   const [viewState, setViewState] = useState<ViewState>("audio-review")
   const [analysisMessage, setAnalysisMessage] = useState("音声を分析中...")

   // TODO: viewState変更時のログ処理を実装（必要に応じて）

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
    * 信頼度をパーセンテージでフォーマット
    * TODO: 今は使ってないけど、パーセンテージ表示は好きなので後々ちゃんと実装したい
    */
   const formatConfidence = useCallback((confidence: number): string => {
      return `${Math.round(confidence * 100)}%`
   }, [])

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

      try {
         // AI分析を開始（アップロードは裏で実行）
         setViewState("ai-analyzing")
         setAnalysisMessage("音を聴いています...")

         // 音声時間を実際のBlobから計算
         const duration = await new Promise<number>((resolve) => {
            const audio = new Audio(audioData.url)
            audio.onloadedmetadata = () => {
               const actualDuration = audio.duration
               resolve(Number.isFinite(actualDuration) ? actualDuration : 10)
            }
            audio.onerror = () => resolve(10) // エラー時はデフォルト10秒
         })

         console.log("🎵 録音時間チェック:", { duration })

         // 録音時間のバリデーション（9.9秒未満の場合はエラー）
         if (duration < 9.9) {
            console.error("録音時間が不足しています:", { duration })
            setViewState("audio-review")
            setAnalysisMessage(
               `録音時間が${duration.toFixed(1)}秒のため、マップピンを作成できません。10秒の録音が必要です。`,
            )
            return
         }

         const metadata = {
            duration,
            location: currentPosition
               ? {
                    lat: currentPosition.latitude,
                    lng: currentPosition.longitude,
                 }
               : undefined,
         }

         // アップロードを試行（タイムアウト付き）
         let uploadResult: { url: string; id: string } | null = null
         try {
            console.log("🔄 音声アップロード開始:", {
               blobSize: audioData.blob.size,
               blobType: audioData.blob.type,
               metadata,
            })

            const uploadPromise = uploadAudioToStorage(audioData.blob, metadata)
            const timeoutPromise = new Promise<never>((_, reject) =>
               setTimeout(
                  () => reject(new Error("アップロードタイムアウト")),
                  10000,
               ),
            )

            uploadResult = await Promise.race([uploadPromise, timeoutPromise])
            console.log("✅ 音声アップロード成功:", uploadResult)
         } catch (uploadError) {
            console.warn(
               "⚠️ アップロードに失敗しました。オフライン分析を実行します:",
               uploadError,
            )
            // アップロードに失敗してもAI分析は続行
         }

         // 段階的にメッセージを変更（3段階）
         setTimeout(() => {
            setAnalysisMessage("パターンを探しています...")
         }, 3000)

         setTimeout(() => {
            setAnalysisMessage("もうすぐ完了です...")
         }, 6000)

         // AI分析を実行
         // MEMO: startInferenceが完了するまで待機する
         try {
            await startInference(audioData)
         } catch (inferenceError) {
            console.warn(
               "⚠️ AI分析に失敗しました。フォールバック結果を使用します:",
               inferenceError,
            )
            // フォールバック結果は useInferenceStore 内で自動的に生成される
         }

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
   const handlePlacePin = async (): Promise<void> => {
      if (results.length > 0 && currentPosition && audioData) {
         try {
            // アップロード済みURLを優先的に使用
            let audioUrl = uploadedAudioUrl

            // アップロード済みURLがない場合は、BlobURLを使用（createPersistentPin内でアップロードされる）
            if (!audioUrl) {
               audioUrl = audioData.url || URL.createObjectURL(audioData.blob)
               console.log(
                  "⚠️ アップロード済みURLがないため、BlobURLを使用します",
               )
            }

            console.log("📍 ピン配置開始:", {
               hasUploadedUrl: !!uploadedAudioUrl,
               audioUrl: `${audioUrl.substring(0, 100)}...`, // URLの先頭のみ表示
               position: currentPosition,
               resultsCount: results.length,
            })

            // 永続化ピンを作成
            await createPersistentPin(
               audioUrl,
               {
                  latitude: currentPosition.latitude,
                  longitude: currentPosition.longitude,
               },
               results,
            )

            console.log("✅ ピン配置成功")
            // 成功時は閉じる
            onClose()
         } catch (error) {
            // エラー時はログ出力（エラー表示はストアで管理）
            console.error("❌ ピン配置エラー:", error)
         }
      } else {
         console.warn("⚠️ ピン配置条件が満たされていません:", {
            hasResults: results.length > 0,
            hasPosition: !!currentPosition,
            hasAudioData: !!audioData,
         })
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
      clearPinCreationState()
      setViewState("audio-review")
      setAnalysisMessage("音声を分析中...")
   }, [clearResults, clearUploadState, clearPinCreationState])

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
                           onReady={handleWaveformReady}
                           onFinish={handleWaveformFinish}
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

               {/* AI分析中画面 */}
               {viewState === "ai-analyzing" && (
                  <motion.div
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="-mt-5 flex flex-col items-center justify-center"
                  >
                     <AIAnalysisOrb
                        hue={0}
                        cycleHue={true}
                        hueCycleSpeed={60}
                        forceHoverState={true}
                        rotateOnHover={true}
                        hoverIntensity={0.4}
                        size={280}
                     />
                     <div className="mt-8 mb-5 flex flex-col items-center space-y-2 text-center">
                        <p className="font-bold text-white text-xl tracking-wide">
                           {analysisMessage}
                        </p>
                        <p className="text-gray-400 text-sm tracking-wide">
                           この音が何を伝えているか、感じています
                        </p>
                     </div>
                  </motion.div>
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

                        {(error || uploadError || pinCreationError) && (
                           <motion.div
                              className="mb-4 rounded-lg border border-red-500/30 bg-red-500/20 p-4 backdrop-blur-sm"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                           >
                              <span className="font-medium text-red-300">
                                 エラー:{" "}
                                 {pinCreationError ||
                                    uploadError ||
                                    error?.message}
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
                           onReady={handleWaveformReady}
                           onFinish={handleWaveformFinish}
                        />
                     </div>

                     {/* アクションボタン */}
                     <div className="flex gap-3">
                        {results.length > 0 ? (
                           <>
                              {/* ピン配置ボタン */}
                              <motion.button
                                 onClick={handlePlacePin}
                                 disabled={
                                    pinCreationStatus === "creating" ||
                                    !currentPosition
                                 }
                                 className={`flex-1 touch-manipulation rounded-xl border px-4 py-3 font-semibold text-white backdrop-blur-sm transition-all duration-300 ${
                                    pinCreationStatus === "creating" ||
                                    !currentPosition
                                       ? "cursor-not-allowed border-gray-500/30 bg-gray-600/80"
                                       : "border-green-500/30 bg-green-600/80 shadow-[0_4px_20px_rgba(34,197,94,0.4)] hover:bg-green-600 hover:shadow-[0_8px_32px_rgba(34,197,94,0.6)]"
                                 }`}
                                 whileHover={
                                    pinCreationStatus === "creating" ||
                                    !currentPosition
                                       ? {}
                                       : { scale: 1.02 }
                                 }
                                 whileTap={
                                    pinCreationStatus === "creating" ||
                                    !currentPosition
                                       ? {}
                                       : { scale: 0.98 }
                                 }
                              >
                                 {pinCreationStatus === "creating"
                                    ? "ピン作成中..."
                                    : !currentPosition
                                      ? "位置情報が必要です"
                                      : "マップにピンを配置"}
                              </motion.button>

                              {/* 閉じるボタン */}
                              <motion.button
                                 onClick={handleClose}
                                 className="flex-1 touch-manipulation rounded-xl border border-white/10 bg-white/10 px-4 py-3 font-semibold text-white shadow-[0_4px_20px_rgba(255,255,255,0.1)] backdrop-blur-sm transition-all duration-300 hover:bg-white/20 hover:shadow-[0_8px_32px_rgba(255,255,255,0.2)]"
                                 whileHover={{ scale: 1.02 }}
                                 whileTap={{ scale: 0.98 }}
                              >
                                 閉じる
                              </motion.button>
                           </>
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
