/**
 * BlinkingIndicatorコンポーネントのプロパティ型定義
 */
export interface BlinkingIndicatorProps {
  /**
   * アニメーションがアクティブかどうか
   */
  isActive: boolean

  /**
   * 追加のCSSクラス名
   * @default ''
   */
  className?: string

  /**
   * インジケーターのサイズクラス
   * @default 'w-2 h-2'
   */
  size?: string

  /**
   * インジケーターの色クラス
   * @default 'bg-red-500'
   */
  color?: string
}
