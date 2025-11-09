/**
 * PrimaryResult コンポーネントの Props
 */
export interface PrimaryResultProps {
   /** 分類結果のラベルと信頼度 */
   result: { label: string; confidence: number }
   /** 信頼度をフォーマットする関数 */
   formatConfidence: (confidence: number) => string
}
