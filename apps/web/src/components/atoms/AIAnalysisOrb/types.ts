/**
 * AIAnalysisOrbコンポーネントのプロパティ
 */
export interface AIAnalysisOrbProps {
   /**
    * 追加のCSSクラス
    */
   className?: string

   /**
    * Orbの色相（0-360）
    */
   hue?: number

   /**
    * ホバー時の強度（0-1）
    */
   hoverIntensity?: number

   /**
    * ホバー時に回転するかどうか
    */
   rotateOnHover?: boolean

   /**
    * ホバー状態を強制するかどうか
    */
   forceHoverState?: boolean

   /**
    * 色相を自動的にサイクルさせるかどうか
    */
   cycleHue?: boolean

   /**
    * 色相サイクルの速度（度/秒）
    */
   hueCycleSpeed?: number

   /**
    * Orbのサイズ（ピクセル）
    */
   size?: number
}
