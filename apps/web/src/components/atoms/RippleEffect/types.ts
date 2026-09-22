/**
 * RippleEffectコンポーネントのProps型定義
 */
export interface RippleEffectProps {
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
    * @default 'border-white/40'
    */
   borderColor?: string

   /**
    * エフェクトのサイズクラス
    * @default 'inset-0'
    */
   size?: string
}
