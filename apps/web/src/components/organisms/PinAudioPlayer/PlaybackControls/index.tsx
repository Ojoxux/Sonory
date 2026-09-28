import { MdPause, MdPlayArrow } from "react-icons/md"
import type { PlaybackControlsProps } from "./types"

/**
 * 再生コントロールコンポーネント
 *
 * @description
 * 音声の再生・一時停止、シークバー、再生時間表示を含む
 * 再生コントロール UI を提供します。
 *
 * @param audioLoadingStatus - 音声の読み込み状態（loading/ready/error）
 * @param playbackState - 再生状態（playing/paused）
 * @param currentTime - 現在の再生位置（秒）
 * @param duration - 音声の総長（秒）
 * @param progressPercentage - 再生進捗率（0-100）
 * @param progressBarRef - プログレスバーの DOM 参照
 * @param togglePlayback - 再生/一時停止を切り替える関数
 * @param handleSeek - シーク操作を処理する関数
 * @param formatTime - 時間を "mm:ss" 形式にフォーマットする関数
 *
 * @example
 * ```tsx
 * <PlaybackControls
 *   audioLoadingStatus="ready"
 *   playbackState="playing"
 *   currentTime={45}
 *   duration={120}
 *   progressPercentage={37.5}
 *   progressBarRef={progressBarRef}
 *   togglePlayback={() => audio.togglePlay()}
 *   handleSeek={(e) => audio.seek(e)}
 *   formatTime={(sec) => `${Math.floor(sec / 60)}:${sec % 60}`}
 * />
 * ```
 */
export function PlaybackControls({
   audioLoadingStatus,
   playbackState,
   currentTime,
   duration,
   progressPercentage,
   progressBarRef,
   togglePlayback,
   handleSeek,
   formatTime,
}: PlaybackControlsProps) {
   const isReady = audioLoadingStatus === "ready"

   return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
         <div className="mb-4 flex items-center justify-center">
            <button
               type="button"
               onClick={togglePlayback}
               disabled={!isReady}
               aria-label={playbackState === "playing" ? "一時停止" : "再生"}
               className="flex h-16 w-16 touch-manipulation items-center justify-center rounded-full bg-accent-600 text-white transition duration-press ease-out hover:bg-accent-500 not-disabled:active:scale-97 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-neutral-500"
            >
               {audioLoadingStatus === "loading" ? (
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
               ) : playbackState === "playing" ? (
                  <MdPause className="h-8 w-8" />
               ) : (
                  <MdPlayArrow className="h-8 w-8" />
               )}
            </button>
         </div>

         <div className="text-center text-neutral-300 text-sm">
            {formatTime(currentTime)} / {formatTime(duration)}
         </div>

         <div
            ref={progressBarRef}
            className="mt-2 h-2 w-full cursor-pointer rounded-full bg-white/10"
            onClick={handleSeek}
            onKeyDown={(e) => {
               if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  if (progressBarRef.current) {
                     const rect = progressBarRef.current.getBoundingClientRect()
                     const centerX = rect.left + rect.width / 2
                     const mockEvent = {
                        clientX: centerX,
                        preventDefault: () => {
                           // Intentionally empty - mock event does not need default prevention
                        },
                     } as React.MouseEvent<HTMLDivElement>
                     handleSeek(mockEvent)
                  }
               }
            }}
            tabIndex={0}
            role="slider"
            aria-label="再生位置"
            aria-valuemin={0}
            aria-valuemax={duration}
            aria-valuenow={currentTime}
         >
            <div
               className="h-2 rounded-full bg-accent-500"
               style={{
                  width: `${progressPercentage}%`,
                  transition:
                     playbackState === "playing"
                        ? "none"
                        : "width 0.2s ease-out",
               }}
            />
         </div>
      </div>
   )
}
