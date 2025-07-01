"use client"

import { MdCheck, MdFiberManualRecord, MdStop } from "react-icons/md"
import type { RecordButtonIconProps } from "./type"

/**
 * 録音ボタンアイコンコンポーネント
 *
 * @description
 * 録音ボタンの状態に応じたアイコンを表示するAtomコンポーネント
 * モダンなアイコンとアニメーションを含む
 *
 * @param status 録音の状態
 *
 * @example
 * ```tsx
 * <RecordButtonIcon status="recording" />
 * ```
 */
export function RecordButtonIcon({ status }: RecordButtonIconProps) {
   switch (status) {
      case "recording":
         return (
            <div className="relative">
               <MdStop className="h-10 w-10 text-white" />
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-3 w-3 animate-pulse rounded-full bg-white" />
               </div>
            </div>
         )
      case "completed":
         return (
            <div className="relative">
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-12 w-12 animate-ping rounded-full bg-white/20" />
               </div>
               <MdCheck className="relative z-10 h-10 w-10 text-white" />
            </div>
         )
      default:
         return (
            <div className="relative">
               <MdFiberManualRecord className="h-10 w-10 text-white" />
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-6 w-6 rounded-full border-2 border-white/30" />
               </div>
            </div>
         )
   }
}
