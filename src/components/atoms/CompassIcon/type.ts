/**
 * CompassIconコンポーネントのプロパティ型定義
 */
export interface CompassIconProps {
  /** 追加のCSSクラス */
  className?: string
  /** アイコンのサイズ（ピクセル） */
  size?: number
  /** マップのbearing（回転角度）- 北を指すために使用 */
  mapBearing?: number
}
