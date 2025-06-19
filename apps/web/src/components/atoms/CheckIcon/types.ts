/**
 * チェックマークアイコンの型定義
 *
 * @description
 * チェックマークアイコンのサイズと色を指定できる
 *
 * @param size アイコンのサイズ（デフォルト: 'large'）
 * @param color アイコンの色（デフォルト: 'green'）
 * @param className 追加のCSSクラス
 */

export type CheckIconProps = {
   size?: 'small' | 'medium' | 'large'
   color?: 'green' | 'white' | 'black'
   className?: string
}
