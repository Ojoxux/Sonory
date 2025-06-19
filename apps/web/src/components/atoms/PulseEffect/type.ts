/**
 * PulseEffectコンポーネントのプロパティ型定義
 */
export interface PulseEffectProps {
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
   * ボーダーの色クラス
   * @default 'border-red-500'
   */
  borderColor?: string

  /**
   * エフェクトのサイズクラス
   * @default 'inset-0'
   */
  size?: string
}
