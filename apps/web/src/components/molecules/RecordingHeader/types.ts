/**
 * RecordingHeaderコンポーネントのProps型定義
 */
export interface RecordingHeaderProps {
   /**
    * 録音中かどうか
    */
   isRecording: boolean

   /**
    * キャンセルボタンクリック時のコールバック
    */
   onCancel: () => void

   /**
    * 次へボタンクリック時のコールバック
    */
   onNext: () => void
}
