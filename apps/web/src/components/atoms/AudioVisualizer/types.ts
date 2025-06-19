/**
 * AudioVisualizerコンポーネントのプロパティ型定義
 */
export interface AudioVisualizerProps {
   /** ビジュアライザーがアクティブかどうか */
   isActive?: boolean
   /** バーの数 */
   barCount?: number
   /** バーの色 */
   color?: 'blue' | 'green' | 'white' | 'red' | 'purple'
   /** 追加のCSSクラス */
   className?: string
}
