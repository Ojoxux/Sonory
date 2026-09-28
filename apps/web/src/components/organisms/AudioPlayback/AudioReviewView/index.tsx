"use client"

import type { ReactElement } from "react"
import { Button } from "@/components/atoms/Button"
import { SheetHeader } from "@/components/molecules/Sheet"
import { WaveformPlayer } from "../../../molecules/WaveformPlayer"
import type { AudioReviewViewProps } from "./types"

/**
 * 録音確認画面
 *
 * @description
 * 録音した音声の確認と、続行またはキャンセルの選択を行う画面
 * 波形プレイヤーで音声を再生できる。`AudioPlayback` のシートの中身として描画する
 *
 * @param audioData 音声データ
 * @param formattedDate 録音日時のフォーマット済み文字列
 * @param onContinue 続けるボタンのクリックハンドラー
 * @param onCancel キャンセルボタンのクリックハンドラー
 *
 * @example
 * ```tsx
 * <AudioReviewView
 *   audioData={audioData}
 *   formattedDate="2025/10/08 12:30:00"
 *   onContinue={handleContinue}
 *   onCancel={handleCancel}
 * />
 * ```
 */
export function AudioReviewView({
   audioData,
   formattedDate,
   onContinue,
   onCancel,
}: AudioReviewViewProps): ReactElement {
   return (
      <>
         <SheetHeader title="録音完了" description={formattedDate} />

         <div className="px-6 pb-6">
            <div className="mb-6">
               <h3 className="mb-3 font-semibold text-lg text-white">
                  録音音声
               </h3>
               <WaveformPlayer
                  audioData={audioData}
                  height={120}
                  className="w-full"
               />
            </div>

            <div className="flex gap-3">
               <Button onClick={onCancel} className="flex-1">
                  キャンセル
               </Button>
               <Button intent="accent" onClick={onContinue} className="flex-1">
                  続ける
               </Button>
            </div>
         </div>
      </>
   )
}
