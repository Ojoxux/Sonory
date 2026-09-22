import type { RecordingTimerProps } from "./types"

/**
 * 録音タイマーコンポーネント
 *
 * @description
 * 録音時間を大きく表示するコンポーネント
 *
 * @param time 録音時間（秒）
 * @param formatTime 時間フォーマット関数
 */
export function RecordingTimer({ time, formatTime }: RecordingTimerProps) {
   return (
      <div className="my-8 font-light font-mono text-6xl text-white tabular-nums tracking-wider sm:my-10 sm:text-7xl lg:text-8xl">
         {formatTime(time)}
      </div>
   )
}
