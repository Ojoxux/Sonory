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
 * @param onWaveformReady 波形プレイヤーの準備完了時のコールバック
 * @param onWaveformFinish 波形プレイヤーの再生完了時のコールバック
 *
 * @example
 * ```tsx
 * <AudioPlayerSection
 *   audioData={audioData}
 *   onWaveformReady={() => console.log("Ready")}
 *   onWaveformFinish={() => console.log("Finished")}
 * />
 * ```
 */
export function AudioPlayerSection({
   audioData,
   onWaveformReady,
   onWaveformFinish,
}: AudioPlayerSectionProps) {
   return (
      <div className="space-y-2">
         <h3 className="font-semibold text-base text-white/80">録音音声</h3>
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
   )
}
