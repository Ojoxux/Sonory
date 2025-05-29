'use client'

import { MdCheck, MdFiberManualRecord, MdStop } from 'react-icons/md'
import type { RecordButtonIconProps } from './type'

/**
 * 録音ボタンアイコンコンポーネント
 *
 * @description
 * 録音ボタンの状態に応じたアイコンを表示するAtomコンポーネント
 * モダンなアイコンとアニメーションを含む
 *
 * @example
 * ```tsx
 * <RecordButtonIcon status="recording" />
 * ```
 */
export function RecordButtonIcon({ status }: RecordButtonIconProps) {
  switch (status) {
    case 'recording':
      return (
        <div className="relative">
          <MdStop className="w-10 h-10 text-white" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
          </div>
        </div>
      )
    case 'completed':
      return (
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-white/20 rounded-full animate-ping" />
          </div>
          <MdCheck className="w-10 h-10 text-white relative z-10" />
        </div>
      )
    default:
      return (
        <div className="relative">
          <MdFiberManualRecord className="w-10 h-10 text-white" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white/30 rounded-full" />
          </div>
        </div>
      )
  }
}
