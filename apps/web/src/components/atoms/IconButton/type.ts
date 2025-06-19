import type { MouseEventHandler, ReactNode } from 'react'

/**
 * IconButtonコンポーネントのプロパティ型定義
 */
export interface IconButtonProps {
  /** 表示するアイコン要素 */
  icon: ReactNode
  /** アクセシビリティ用のラベル */
  ariaLabel: string
  /** クリック時のハンドラー */
  onClick?: MouseEventHandler<HTMLButtonElement>
  /** 追加のCSSクラス */
  className?: string
}
