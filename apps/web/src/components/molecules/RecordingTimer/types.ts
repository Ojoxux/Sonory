/**
 * RecordingTimerコンポーネントのProps型定義
 */
export interface RecordingTimerProps {
   /**
    * 録音時間（秒）
    */
   time: number

   /**
    * 時間をフォーマットする関数
    * @param time - 録音時間（秒）
    * @returns フォーマットされた時間文字列
    */
   formatTime: (time: number) => string
}
