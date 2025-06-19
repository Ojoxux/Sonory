/**
 * WaveformDisplayコンポーネントのプロパティ型定義
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
    * 波形の色
    * @default '#1f2937'
    */
   waveColor?: string

   /**
    * プログレスバーの色
    * @default '#dc2626'
    */
   progressColor?: string

   /**
    * 背景色
    * @default '#f3f4f6'
    */
   backgroundColor?: string

   /**
    * 波形データ（0-100の値の配列）
    * @default []
    */
   waveformData?: number[]

   /**
    * 追加のCSSクラス名
    * @default ''
    */
   className?: string

   /**
    * 録音が完了したかどうか
    * @default false
    */
   isCompleted?: boolean
}
