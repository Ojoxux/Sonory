/**
 * SoundPinIconコンポーネントのプロパティ型定義
 */
export interface SoundPinIconProps {
   /** アイコンのサイズ */
   size?: "small" | "medium" | "large"
   /** デザインバリエーション */
   variant?: "default" | "active" | "analyzing"
   /** 追加のCSSクラス */
   className?: string
   /** クリック時のコールバック関数 */
   onClick?: () => void
   /** アニメーション効果の有効/無効 */
   animated?: boolean
}
