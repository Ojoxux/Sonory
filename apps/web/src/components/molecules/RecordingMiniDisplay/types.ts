/**
 * RecordingMiniDisplayコンポーネントのProps型定義
 */
export interface RecordingMiniDisplayProps {
   /** 録音状態 */
   status: "recording" | "completed"
   /** 録音時間（秒） */
   recordingTime: number
   /** 区間ごとの音量（0〜1） */
   levels: readonly number[]
   /** 時間フォーマット関数 */
   formatTime: (seconds: number) => string
   /** 停止ボタンクリック時のコールバック */
   onStop: () => void
}
