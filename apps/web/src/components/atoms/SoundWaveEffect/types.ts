/**
 * SoundWaveEffectコンポーネントのプロパティ型定義
 */
export interface SoundWaveEffectProps {
   /** エフェクトがアクティブかどうか */
   isActive?: boolean
   /** 波の色 */
   color?: 'blue' | 'green' | 'white' | 'red'
   /** 波のサイズ */
   size?: 'small' | 'medium' | 'large' | 'xlarge'
   /** 追加のCSSクラス */
   className?: string
}
