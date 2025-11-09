/**
 * OtherResultsのProps
 */
export interface OtherResultsProps {
   /** その他の分類結果の配列 */
   results: Array<{ label: string; confidence: number }>
   /** 開閉状態 */
   isOpen: boolean
   /** 開閉を切り替える関数 */
   toggle: () => void
   /** 信頼度をフォーマットする関数 */
   formatConfidence: (confidence: number) => string
}
