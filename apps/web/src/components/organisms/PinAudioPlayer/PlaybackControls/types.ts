/**
 * PlaybackControlsのProps
 */
export interface PlaybackControlsProps {
   /** 音声の読み込み状態 */
   audioLoadingStatus: string
   /** 再生状態 */
   playbackState: string
   /** 現在の再生位置（秒） */
   currentTime: number
   /** 音声の総長（秒） */
   duration: number
   /** 再生進捗率（0-100） */
   progressPercentage: number
   /** プログレスバーの参照 */
   progressBarRef: React.RefObject<HTMLDivElement | null>
   /** 再生/一時停止を切り替える関数 */
   togglePlayback: () => void
   /** シーク操作を処理する関数 */
   handleSeek: (event: React.MouseEvent<HTMLDivElement>) => void
   /** 時間を表示形式にフォーマットする関数 */
   formatTime: (seconds: number) => string
}
