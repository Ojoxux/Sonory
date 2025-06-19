import type { MouseEventHandler } from 'react'

/**
 * CompassButtonコンポーネントのプロパティ型定義
 */
export interface CompassButtonProps {
   /** クリック時のハンドラー */
   onClick?: MouseEventHandler<HTMLButtonElement>
   /** マップのbearing（回転角度） */
   mapBearing?: number
   /** 追加のCSSクラス */
   className?: string
   /** ダークモードかどうか */
   isDarkMode?: boolean
}
