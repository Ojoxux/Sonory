/**
 * RecordingExpandedDisplayコンポーネントのプロパティ型定義
 */
export interface RecordingExpandedDisplayProps {
   /** 録音状態 */
   status: "recording" | "completed"
   /** 録音時間（秒） */
   recordingTime: number
   /** 波形データ */
   waveformData: number[]
   /** 時間フォーマット関数 */
   formatTime: (seconds: number) => string
   /** キャンセル時のコールバック */
   onCancel: () => void
   /** 次へボタンクリック時のコールバック */
   onNext: () => void
}
