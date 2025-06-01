/**
 * PWAInstallPromptコンポーネントの型定義
 */

export interface PWAInstallPromptProps {
  /** 追加のCSSクラス名 */
  className?: string

  /** 自動でプロンプトを表示するかどうか */
  autoShow?: boolean

  /** インストール成功時のコールバック */
  onInstallSuccess?: () => void

  /** プロンプトを閉じた時のコールバック */
  onDismiss?: () => void
}
