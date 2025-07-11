/**
 * ClusterBadgeコンポーネントの型定義
 */

export type ClusterBadgeSize = "small" | "medium" | "large"

export type ClusterBadgeProps = {
   /** ピン数 */
   count: number
   /** バッジサイズ（指定しない場合は自動計算） */
   size?: ClusterBadgeSize
   /** クリック時のコールバック */
   onClick?: () => void
   /** 追加のCSSクラス */
   className?: string
}
