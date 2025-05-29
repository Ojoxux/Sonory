/**
 * UIOverlayコンポーネントのプロパティ型定義
 */
export interface UIOverlayProps {
  /** 設定ボタンクリック時のハンドラー */
  onSettingsClick?: () => void
  /** 現在の緯度 */
  latitude?: number
  /** 現在の経度 */
  longitude?: number
  /** デバッグ用時間オーバーライド（時間のみ0-23） */
  debugTimeOverride?: number | null
}
