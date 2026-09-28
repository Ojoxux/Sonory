"use client"

import type { ReactElement } from "react"
import { ErrorDisplay } from "@/components/atoms/ErrorDisplay"
import { FallbackWarning } from "@/components/atoms/FallbackWarning"
import { ActionButtons } from "@/components/molecules/ActionButtons"
import { AudioPlayerSection } from "@/components/molecules/AudioPlayerSection"
import { EnvironmentInfo } from "@/components/molecules/EnvironmentInfo"
import { OtherResultsAccordion } from "@/components/molecules/OtherResultsAccordion"
import { PrimaryResult } from "@/components/molecules/PrimaryResult"
import { SheetHeader } from "@/components/molecules/Sheet"
import type { AnalysisResultsViewProps } from "./types"

/**
 * AI分析結果表示画面コンポーネント
 *
 * @description
 * AI分析の結果を表示し、マップへのピン配置または閉じる操作を提供
 * エラー状態やフォールバック状態の表示も含む。`AudioPlayback` のシートの中身として描画する
 *
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
}: AnalysisResultsViewProps): ReactElement {
   return (
      <>
         <SheetHeader
            title="AI分析結果"
            description="音声を分析した結果を表示しています"
         />

         <div className="space-y-4 px-6">
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

                  <OtherResultsAccordion results={results.slice(1, 3)} />
               </div>
            )}

            <EnvironmentInfo environment={backendAnalysisResult?.environment} />

            <AudioPlayerSection audioData={audioData} />

            <div className="flex gap-2.5 pt-1 pb-6">
               <ActionButtons
                  hasResults={results.length > 0}
                  pinCreationStatus={pinCreationStatus}
                  hasPosition={hasPosition}
                  onPlacePin={onPlacePin}
                  onClose={onClose}
               />
            </div>
         </div>
      </>
   )
}
