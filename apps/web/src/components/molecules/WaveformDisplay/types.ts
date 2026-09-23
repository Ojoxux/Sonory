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
    * 先頭から順に並んだ区間ごとの音量（0〜1）。`SLOT_MS` ごとに1つ
    * @default []
    */
   levels?: readonly number[]

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
