/**
 * 位置情報の型定義
 */
export type LocationData = {
   /** 緯度 */
   latitude: number
   /** 経度 */
   longitude: number
}

/**
 * RecordingInterfaceコンポーネントのプロパティ型定義
 */
export interface RecordingInterfaceProps {
   /**
    * 追加のCSSクラス名
    * @default ''
    */
   className?: string

   /**
    * 展開状態が変更されたときのコールバック
    * @param isExpanded - 展開されているかどうか
    */
   onExpandedChange?: (isExpanded: boolean) => void

   /**
    * 現在の位置情報（マップピン表示用）
    */
   currentPosition?: LocationData | null
}
