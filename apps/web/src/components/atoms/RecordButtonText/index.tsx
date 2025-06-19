'use client'

import type { RecordButtonTextProps } from './type'

/**
 * 録音ボタンテキストコンポーネント
 *
 * @description
 * 録音ボタンの状態に応じたテキストを表示するAtomコンポーネント
 * シンプルで読みやすいテキスト表示
 *
 * @example
 * ```tsx
 * <RecordButtonText status="recording" />
 * ```
 */
export function RecordButtonText({ status }: RecordButtonTextProps) {
   const getText = (): string => {
      switch (status) {
         case 'recording':
            return '停止'
         case 'completed':
            return '完了'
         default:
            return '録音'
      }
   }

   const getTextStyle = (): string => {
      switch (status) {
         case 'recording':
            return 'text-white/90 font-bold'
         case 'completed':
            return 'text-white/90 font-bold'
         default:
            return 'text-white/80 font-medium'
      }
   }

   return (
      <span className={`text-sm tracking-wider ${getTextStyle()}`}>
         {getText()}
      </span>
   )
}
