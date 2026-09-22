"use client"

import { WaveformPlayer } from "../WaveformPlayer"
import type { AudioPlayerSectionProps } from "./types"

/**
 * 音声プレイヤーセクションコンポーネント
 *
 * @description
 * 録音音声を再生するためのプレイヤーUIを提供する
 * WaveformPlayerをラップし、統一されたスタイリングを適用
 *
 * @param audioData 音声データ
 *
 * @example
 * ```tsx
 * <AudioPlayerSection audioData={audioData} />
 * ```
 */
export function AudioPlayerSection({ audioData }: AudioPlayerSectionProps) {
   return (
      <div className="space-y-2">
         <h3 className="font-semibold text-base text-white/80">録音音声</h3>
         <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <WaveformPlayer
               audioData={audioData}
               height={80}
               className="w-full"
            />
         </div>
      </div>
   )
}
