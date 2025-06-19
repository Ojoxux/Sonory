/**
 * AppHeaderコンポーネントのプロパティ型定義
 */
export interface AppHeaderProps {
   /** 設定ボタンクリック時のハンドラー */
   onSettingsClick?: () => void
   /** コンパスボタンクリック時のハンドラー（現在位置に戻る） */
   onCompassClick?: () => void
   /** 現在の緯度 */
   latitude?: number
   /** 現在の経度 */
   longitude?: number
   /** デバッグ用時間オーバーライド（時間のみ0-23） */
   debugTimeOverride?: number | null
   /** マップのbearing（回転角度） */
   mapBearing?: number
}
