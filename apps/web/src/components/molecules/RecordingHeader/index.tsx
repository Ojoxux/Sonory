"use client"

import { BlinkingIndicator } from "../../atoms/BlinkingIndicator"
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
      <div className="relative flex items-center justify-between px-6 py-4 pb-2 sm:px-8 sm:pb-3">
         <button
            type="button"
            onClick={onCancel}
            className="touch-manipulation font-medium text-base text-gray-600 transition-colors hover:text-gray-900 sm:text-lg"
         >
            キャンセル
         </button>

         <div className="-translate-x-1/2 absolute left-1/2 flex transform items-center gap-2">
            <BlinkingIndicator
               isActive={isRecording}
               size="w-2 h-2"
               color="bg-red-500"
            />
            <span className="font-medium text-base text-gray-900 sm:text-lg">
               録音中
            </span>
         </div>

         <button
            type="button"
            onClick={onNext}
            className="touch-manipulation font-medium text-base text-gray-900 transition-colors hover:text-gray-700 sm:text-lg"
         >
            次へ
         </button>
      </div>
   )
}
