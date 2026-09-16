/**
 * UIOverlayコンポーネントのProps型定義
 */
export interface UIOverlayProps {
   /** 設定ボタンクリック時のハンドラー */
   onSettingsClick?: () => void
   /** アプリ情報ボタンクリック時のハンドラー */
   onAppInfoClick?: () => void
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
   /** 設定シートの開閉状態 */
   isSettingsOpen: boolean
   /** 設定シートを閉じる時のハンドラー */
   onSettingsClose: () => void
   /** アプリ情報シートの開閉状態 */
   isAppInfoOpen: boolean
   /** アプリ情報シートを閉じる時のハンドラー */
   onAppInfoClose: () => void
}
