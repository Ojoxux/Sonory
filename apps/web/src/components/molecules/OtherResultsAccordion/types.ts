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
   /** 分析結果の配列（最初の要素が主要結果） */
   results: AnalysisResult[]
   /** フルハイト表示かどうか */
   isFullHeight: boolean
}
