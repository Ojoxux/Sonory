"use client"

import { motion } from "framer-motion"
import { Sheet } from "react-modal-sheet"
import { ErrorDisplay } from "@/components/atoms/ErrorDisplay"
import { FallbackWarning } from "@/components/atoms/FallbackWarning"
import { ActionButtons } from "@/components/molecules/ActionButtons"
import { AudioPlayerSection } from "@/components/molecules/AudioPlayerSection"
import { EnvironmentInfo } from "@/components/molecules/EnvironmentInfo"
import { OtherResultsAccordion } from "@/components/molecules/OtherResultsAccordion"
import { PrimaryResult } from "@/components/molecules/PrimaryResult"
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
 *   isOpen={true}
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
   return (
      <Sheet
         isOpen={isOpen}
         onClose={onClose}
         snapPoints={[0, 1]}
         initialSnap={1}
         detent="content"
      >
         <Sheet.Container className="border-t! border-white/10! bg-black/95! shadow-2xl! backdrop-blur-xl!">
            <Sheet.Header className="bg-transparent!">
               <div className="flex flex-col items-center px-6 pt-4 pb-4">
                  <div className="mb-3 h-1 w-12 rounded-full bg-white/20" />
                  <h2 className="font-bold text-white text-xl">AI分析結果</h2>
                  <p className="mt-2 text-neutral-400 text-sm">
                     音声を分析した結果を表示しています
                  </p>
               </div>
            </Sheet.Header>

            <Sheet.Content className="overflow-y-auto! bg-transparent!">
               <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="min-h-0 space-y-4 px-6"
               >
                  <ErrorDisplay
                     error={error}
                     uploadError={uploadError}
                     pinCreationError={pinCreationError}
                  />

                  <FallbackWarning fallbackUsed={fallbackUsed || false} />

                  {results.length > 0 && results[0] && (
                     <div className="space-y-3">
                        <h3 className="font-semibold text-base text-white/80">
                           検出された音
                        </h3>

                        <PrimaryResult result={results[0]} />

                        <OtherResultsAccordion
                           results={results}
                           isFullHeight={true}
                        />
                     </div>
                  )}

                  <EnvironmentInfo
                     environment={backendAnalysisResult?.environment}
                  />

                  <AudioPlayerSection
                     audioData={audioData}
                     onWaveformReady={onWaveformReady}
                     onWaveformFinish={onWaveformFinish}
                  />

                  <div className="flex gap-2.5 pt-1 pb-6">
                     <ActionButtons
                        hasResults={results.length > 0}
                        pinCreationStatus={pinCreationStatus}
                        hasPosition={hasPosition}
                        onPlacePin={onPlacePin}
                        onClose={onClose}
                     />
                  </div>
               </motion.div>
            </Sheet.Content>
         </Sheet.Container>

         <Sheet.Backdrop className="bg-black/50! backdrop-blur-sm!" />
      </Sheet>
   )
}
