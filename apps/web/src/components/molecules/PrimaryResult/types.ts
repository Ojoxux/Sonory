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
 * PrimaryResult コンポーネントのプロパティ
 */
export type PrimaryResultProps = {
   /** 主要な分析結果 */
   result: AnalysisResult
}
