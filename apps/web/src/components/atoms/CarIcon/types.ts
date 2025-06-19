/**
 * CarIconコンポーネントのサイズ型
 */
export type CarIconSize = 'small' | 'medium' | 'large'

/**
 * CarIconコンポーネントのプロパティ型
 */
export type CarIconProps = {
  /** アイコンのサイズ */
  size?: CarIconSize
  /** アイコンの色（Tailwind CSS色クラス） */
  color?: string
  /** 追加のCSSクラス */
  className?: string
  /** クリック時のコールバック関数 */
  onClick?: () => void
}
