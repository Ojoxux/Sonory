/**
 * RecordingControlsコンポーネントのプロパティ型定義
 */
export interface RecordingControlsProps {
   /**
    * 停止ボタンクリック時のコールバック
    */
   onStop: () => void

   /**
    * 録音中かどうか
    */
   isRecording: boolean
}
