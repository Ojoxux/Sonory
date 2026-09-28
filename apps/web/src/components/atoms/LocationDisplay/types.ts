/**
 * LocationDisplayコンポーネントの型定義
 */
export interface LocationDisplayProps {
   /** 緯度 */
   latitude?: number
   /** 経度 */
   longitude?: number
   /** 追加のCSSクラス名 */
   className?: string
   /** 地図が暗い時間帯か。true で白系、false で黒系の文字になる */
   isDarkTime?: boolean
}
