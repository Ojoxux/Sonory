/**
 * 分析結果の型定義
 */
export type AnalysisResult = {
   /** 推論結果のラベル */
   label: string
   /** 推論結果の確信度 (0-1) */
   confidence: number
}

/**
 * OtherResultsAccordion コンポーネントのProps
 */
export type OtherResultsAccordionProps = {
   /** 主要結果を除いた候補 */
   results: readonly AnalysisResult[]
}
