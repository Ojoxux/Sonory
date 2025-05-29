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
  /** デバッグ用時間オーバーライド（時間のみ0-23） */
  debugTimeOverride?: number | null
}
