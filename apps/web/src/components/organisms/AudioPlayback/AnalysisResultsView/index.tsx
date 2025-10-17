"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useCallback, useState } from "react"
import { Sheet } from "react-modal-sheet"
import { WaveformPlayer } from "../../../molecules/WaveformPlayer"
import type { AnalysisResultsViewProps } from "./types"

/**
 * AI分析結果表示画面コンポーネント
 *
 * @description
 * AI分析の結果を表示し、マップへのピン配置または閉じる操作を提供
 * エラー状態やフォールバック状態の表示も含む
 *
 * @param isOpen シートの開閉状態
 * @param audioData 音声データ
 * @param results AI分析結果
 * @param error エラーメッセージ
 * @param uploadError アップロードエラーメッセージ
 * @param pinCreationError ピン作成エラーメッセージ
 * @param fallbackUsed フォールバック結果が使用されたか
 * @param backendAnalysisResult バックエンドAI分析結果
 * @param onPlacePin ピン配置ボタンのクリックハンドラー
 * @param onClose 閉じるボタンのクリックハンドラー
 * @param pinCreationStatus ピン作成ステータス
 * @param hasPosition 現在位置が存在するか
 * @param onWaveformReady 波形プレイヤーの準備完了時のコールバック
 * @param onWaveformFinish 波形プレイヤーの再生完了時のコールバック
 *
 * @example
 * ```tsx
 * <AnalysisResultsView
 *   audioData={audioData}
 *   results={results}
 *   onPlacePin={handlePlacePin}
 *   onClose={handleClose}
 *   hasPosition={true}
 * />
 * ```
 */
export function AnalysisResultsView({
   isOpen,
   audioData,
   results,
   error,
   uploadError,
   pinCreationError,
   fallbackUsed,
   backendAnalysisResult,
   onPlacePin,
   onClose,
   pinCreationStatus = "idle",
   hasPosition,
   onWaveformReady,
   onWaveformFinish,
}: AnalysisResultsViewProps) {
   /**
    * 信頼度をパーセンテージでフォーマット
    */
   const formatConfidence = useCallback((confidence: number): string => {
      return `${Math.round(confidence * 100)}%`
   }, [])

   // 表示する結果
   const displayResults = results

   // detent="content"により、コンテンツの高さに自動調整される
   const isFullHeight = true

   // その他のアコーディオンの開閉状態
   const [isOtherResultsOpen, setIsOtherResultsOpen] = useState(false)

   // その他の候補アコーディオンのトグル
   const toggleOtherResults = useCallback(() => {
      setIsOtherResultsOpen((prev) => !prev)
   }, [])

   return (
      <Sheet
         isOpen={isOpen}
         onClose={onClose}
         snapPoints={[0, 1]}
         initialSnap={1}
         detent="content"
      >
         <Sheet.Container className="!bg-black/95 !backdrop-blur-xl !border-t !border-white/10 !shadow-2xl">
            <Sheet.Header className="!bg-transparent">
               <div className="flex flex-col items-center px-6 pt-4 pb-4">
                  <div className="mb-3 h-1 w-12 rounded-full bg-white/20" />
                  <h2 className="font-bold text-white text-xl">AI分析結果</h2>
                  <p className="mt-2 text-neutral-400 text-sm">
                     音声を分析した結果を表示しています
                  </p>
               </div>
            </Sheet.Header>

            <Sheet.Content className="!bg-transparent !overflow-y-auto">
               <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="min-h-0 space-y-4 px-6"
               >
                  {/* エラー表示 */}
                  {(error || uploadError || pinCreationError) && (
                     <motion.div
                        className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 backdrop-blur-sm"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                     >
                        <span className="text-red-300 text-sm leading-relaxed">
                           {pinCreationError || uploadError || error?.message}
                        </span>
                     </motion.div>
                  )}

                  {/* フォールバック警告 */}
                  {fallbackUsed && (
                     <motion.div
                        className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 backdrop-blur-sm"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                     >
                        <span className="text-sm text-yellow-300 leading-relaxed">
                           ⚠️ オフライン分析結果を表示中
                        </span>
                     </motion.div>
                  )}

                  {/* 分析結果リスト */}
                  {displayResults.length > 0 && (
                     <div className="space-y-3">
                        <h3 className="font-semibold text-base text-white/80">
                           検出された音
                        </h3>

                        {/* 最も可能性の高い結果（ハイライト表示） */}
                        <motion.div
                           initial={{ opacity: 0, scale: 0.95 }}
                           animate={{ opacity: 1, scale: 1 }}
                           transition={{ delay: 0.1 }}
                           className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 backdrop-blur-sm"
                        >
                           <div className="mb-1.5 flex items-center justify-between">
                              <span className="font-semibold text-base text-green-300">
                                 {displayResults[0].label}
                              </span>
                              <span className="font-mono font-semibold text-green-400 text-sm">
                                 {formatConfidence(
                                    displayResults[0].confidence,
                                 )}
                              </span>
                           </div>
                           <div className="flex items-center gap-1.5 text-green-300/60 text-xs">
                              <span className="inline-block h-1 w-1 animate-pulse rounded-full bg-green-400" />
                              最も可能性が高い
                           </div>
                        </motion.div>

                        {/* その他の候補（アコーディオン） */}
                        {displayResults.length > 1 && isFullHeight && (
                           <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
                              <button
                                 type="button"
                                 onClick={toggleOtherResults}
                                 className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-white/5"
                              >
                                 <span className="font-medium text-white/60 text-xs">
                                    その他の候補 ({displayResults.length - 1}件)
                                 </span>
                                 <motion.span
                                    animate={{
                                       rotate: isOtherResultsOpen ? 180 : 0,
                                    }}
                                    transition={{ duration: 0.2 }}
                                    className="text-sm text-white/60"
                                 >
                                    ▼
                                 </motion.span>
                              </button>

                              <AnimatePresence initial={false}>
                                 {isOtherResultsOpen && (
                                    <motion.div
                                       initial={{ height: 0, opacity: 0 }}
                                       animate={{ height: "auto", opacity: 1 }}
                                       exit={{ height: 0, opacity: 0 }}
                                       transition={{
                                          duration: 0.2,
                                          ease: "easeInOut",
                                       }}
                                       className="overflow-hidden"
                                    >
                                       <div className="space-y-2 px-3 pb-3">
                                          {displayResults
                                             .slice(1, 3)
                                             .map((result, index) => (
                                                <div
                                                   key={`${result.label}-${index + 1}`}
                                                   className="flex items-center justify-between py-1"
                                                >
                                                   <span className="text-neutral-300 text-sm">
                                                      {result.label}
                                                   </span>
                                                   <span className="font-mono text-neutral-400 text-xs">
                                                      {formatConfidence(
                                                         result.confidence,
                                                      )}
                                                   </span>
                                                </div>
                                             ))}
                                       </div>
                                    </motion.div>
                                 )}
                              </AnimatePresence>
                           </div>
                        )}
                     </div>
                  )}

                  {/* バックエンド環境情報 */}
                  {backendAnalysisResult?.environment && (
                     <motion.div
                        className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 backdrop-blur-sm"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                     >
                        <div className="flex items-center gap-2">
                           <span className="text-blue-400 text-lg">🌍</span>
                           <span className="text-blue-300 text-sm">
                              {backendAnalysisResult.environment.description ||
                                 backendAnalysisResult.environment.primary_type}
                           </span>
                        </div>
                     </motion.div>
                  )}

                  {/* 録音音声プレイヤー */}
                  <div className="space-y-2">
                     <h3 className="font-semibold text-base text-white/80">
                        録音音声
                     </h3>
                     <div className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
                        <WaveformPlayer
                           audioData={audioData}
                           height={80}
                           waveColor="#9ca3af"
                           progressColor="#dc2626"
                           className="w-full"
                           onReady={onWaveformReady}
                           onFinish={onWaveformFinish}
                        />
                     </div>
                  </div>

                  {/* アクションボタン */}
                  <div className="flex gap-2.5 pt-1 pb-6">
                     {displayResults.length > 0 ? (
                        <>
                           {/* ピン配置ボタン */}
                           <motion.button
                              onClick={onPlacePin}
                              disabled={
                                 pinCreationStatus === "creating" ||
                                 !hasPosition
                              }
                              className={`flex-1 touch-manipulation rounded-xl px-4 py-3 font-semibold text-sm text-white transition-all duration-200 ${
                                 pinCreationStatus === "creating" ||
                                 !hasPosition
                                    ? "cursor-not-allowed bg-gray-600/60"
                                    : "bg-green-600 active:bg-green-700"
                              }`}
                              whileTap={
                                 pinCreationStatus === "creating" ||
                                 !hasPosition
                                    ? {}
                                    : { scale: 0.98 }
                              }
                           >
                              {pinCreationStatus === "creating"
                                 ? "ピン作成中..."
                                 : !hasPosition
                                   ? "位置情報が必要です"
                                   : "マップにピンを配置"}
                           </motion.button>

                           {/* 閉じるボタン */}
                           <motion.button
                              onClick={onClose}
                              className="flex-1 touch-manipulation rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-sm text-white transition-all duration-200 active:bg-white/10"
                              whileTap={{ scale: 0.98 }}
                           >
                              閉じる
                           </motion.button>
                        </>
                     ) : (
                        <motion.button
                           onClick={onClose}
                           className="w-full touch-manipulation rounded-xl bg-blue-600 px-4 py-3 font-semibold text-sm text-white transition-all duration-200 active:bg-blue-700"
                           whileTap={{ scale: 0.98 }}
                        >
                           閉じる
                        </motion.button>
                     )}
                  </div>
               </motion.div>
            </Sheet.Content>
         </Sheet.Container>

         <Sheet.Backdrop className="!bg-black/50 !backdrop-blur-sm" />
      </Sheet>
   )
}
