"use client"

import { BlinkingIndicator } from "../../atoms/BlinkingIndicator"
import { Button } from "../../atoms/Button"
import type { RecordingHeaderProps } from "./types"

/**
 * 録音インターフェースのヘッダーコンポーネント
 *
 * @description
 * 録音中の状態表示と操作ボタンを含むヘッダー
 *
 * @param isRecording 録音中かどうか
 * @param onCancel キャンセルボタンクリック時のコールバック
 * @param onNext 次へボタンクリック時のコールバック
 */
export function RecordingHeader({
   isRecording,
   onCancel,
   onNext,
}: RecordingHeaderProps) {
   return (
      <div className="relative flex h-16 items-center justify-between">
         <Button size="sm" onClick={onCancel} disabled={isRecording}>
            キャンセル
         </Button>

         <div className="-translate-x-1/2 pointer-events-none absolute left-1/2 flex items-center gap-2">
            <BlinkingIndicator
               isActive={isRecording}
               size="size-2"
               color="bg-record-500"
            />
            <span className="font-medium text-base text-white sm:text-lg">
               録音中
            </span>
         </div>

         <Button intent="accent" size="sm" onClick={onNext}>
            次へ
         </Button>
      </div>
   )
}
