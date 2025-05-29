/**
 * AppHeaderコンポーネントのプロパティ型定義
 */
export interface AppHeaderProps {
  /** 設定ボタンクリック時のハンドラー */
  onSettingsClick?: () => void
  /** 現在の緯度 */
  latitude?: number
  /** 現在の経度 */
  longitude?: number
}
