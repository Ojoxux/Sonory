/**
 * RecordingExpandedDisplayコンポーネントのプロパティ型定義
 */
export interface RecordingExpandedDisplayProps {
   /**
    * 録音状態
    */
   status: "idle" | "recording" | "completed"

   /**
    * 録音時間
    */
   recordingTime: number

   /**
    * 波形データ
    */
   waveformData: number[]

   /**
    * 時間フォーマット関数
    * @param time - 録音時間（秒）
    * @returns フォーマットされた時間文字列
    */
   formatTime: (time: number) => string

   /**
    * キャンセルボタンクリック時のコールバック
    */
   onCancel: () => void

   /**
    * 次へボタンクリック時のコールバック
    */
   onNext: () => void

   /**
    * 停止ボタンクリック時のコールバック
    */
   onStop: () => void
}
