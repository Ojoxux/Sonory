/**
 * 雫が落ちるような波紋エフェクトコンポーネントの型定義
 *
 * @description
 * スライダー完了時に右端から雫が落ちて波紋が広がるエフェクトの
 * プロパティを管理します。
 */

/**
 * 波紋の色の種類
 */
export type RippleColor = 'blue' | 'white' | 'green' | 'red'

/**
 * 波紋のサイズの種類
 */
export type RippleSize = 'small' | 'medium' | 'large'

/**
 * DropRippleEffectコンポーネントのプロパティ
 */
export type DropRippleEffectProps = {
  /** エフェクトの有効状態 */
  isActive: boolean

  /** 波紋の色（デフォルト: blue） */
  color?: RippleColor

  /** 波紋のサイズ（デフォルト: medium） */
  size?: RippleSize

  /** 追加のCSSクラス */
  className?: string
}
