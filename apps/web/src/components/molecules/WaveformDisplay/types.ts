/**
 * WaveformDisplayコンポーネントのProps型定義
 */
export interface WaveformDisplayProps {
   /**
    * 録音中かどうか
    */
   isRecording: boolean

   /**
    * 現在の録音時間（秒）
    */
   recordingTime: number

   /**
    * 最大録音時間（秒）
    * @default 10
    */
   maxDuration?: number

   /**
    * 波形の高さ（ピクセル）
    * @default 128
    */
   height?: number

   /**
    * 波形データ（0-100の値の配列）
    * @default []
    */
   waveformData?: number[]

   /**
    * 追加のCSSクラス名。バーの色は `text-*` で指定する
    * @default ''
    */
   className?: string

   /**
    * 録音が完了したかどうか
    * @default false
    */
   isCompleted?: boolean
}
