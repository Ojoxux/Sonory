import { create } from 'zustand'
import type { AudioData, InferenceResult, InferenceState } from './types'

/**
 * 道路音分類の結果候補（フォールバック用）
 *
 * @description
 * 現在は擬似的な分析結果を生成。将来的にはバックエンドのPython YAMNetサービスと統合予定。
 */
const FALLBACK_CLASSIFICATIONS: readonly InferenceResult[] = [
   { label: '車の音', confidence: 0.85 },
   { label: 'バイクの音', confidence: 0.78 },
   { label: 'トラックの音', confidence: 0.72 },
   { label: '交通音', confidence: 0.8 },
   { label: 'バスの音', confidence: 0.75 },
   { label: '電車の音', confidence: 0.73 },
   { label: '鳥の鳴き声', confidence: 0.82 },
   { label: '雨音', confidence: 0.77 },
   { label: '風の音', confidence: 0.73 },
   { label: '人の声', confidence: 0.88 },
   { label: '音楽', confidence: 0.85 },
   { label: '工事の音', confidence: 0.79 },
] as const

/**
 * フォールバック用の音響分類結果を生成
 *
 * @description
 * ランダムに環境音の分類結果を生成します。
 * 将来的にはバックエンドのPython YAMNetサービスからの結果に置き換え予定。
 *
 * @returns 音響分類結果配列（信頼度順）
 */
function generateClassificationResults(): InferenceResult[] {
   // ランダムに1つの主要分類を選択
   const primaryIndex = Math.floor(Math.random() * FALLBACK_CLASSIFICATIONS.length)
   const primaryResult = FALLBACK_CLASSIFICATIONS[primaryIndex]

   // 他の分類結果をランダムな低い信頼度で追加
   const otherResults = FALLBACK_CLASSIFICATIONS.filter((_, index) => index !== primaryIndex)
      .slice(0, Math.floor(Math.random() * 3) + 1) // 1-3つの追加結果
      .map(result => ({
         ...result,
         confidence: Math.random() * 0.4 + 0.1, // 0.1-0.5の範囲
      }))

   return [primaryResult, ...otherResults].sort((a, b) => b.confidence - a.confidence)
}

/**
 * バックエンドAPI呼び出し（未実装）
 *
 * @description
 * 将来的にPython YAMNetサービスへのAPI呼び出しを実装予定
 */
async function callBackendAnalysis(audioData: AudioData): Promise<InferenceResult[]> {
   // TODO: バックエンドのPython YAMNetサービスを呼び出し
   console.log('🔜 バックエンドAPI呼び出し（未実装）:', audioData.id)

   // 現在は擬似的な遅延とフォールバック結果を返す
   await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

   throw new Error('バックエンドAPI未実装 - フォールバック結果を使用')
}

/**
 * AI推論機能を管理するZustandストア
 *
 * @description
 * 音声データからAI推論を行い、結果を管理します。
 * 現在はフォールバック実装。将来的にバックエンドのPython YAMNetサービスと統合予定。
 */
export const useInferenceStore = create<InferenceState>(set => ({
   // 初期状態
   results: [],
   isInferring: false,
   error: null,

   /**
    * 音声データから音響AI推論を開始します
    *
    * @param audioData - 推論対象の音声データ
    * @description
    * 現在はフォールバック実装。将来的にバックエンドのPython YAMNetサービスと統合予定。
    */
   startInference: async (audioData: AudioData): Promise<void> => {
      try {
         console.log('🚀 音響推論開始')
         set({ isInferring: true, error: null })

         let results: InferenceResult[]

         try {
            // バックエンドAPI呼び出しを試行（現在は未実装）
            results = await callBackendAnalysis(audioData)
            console.log('✅ バックエンドAPI推論完了:', results)
         } catch (backendError) {
            console.log('🔄 バックエンドAPI失敗、フォールバック実行:', backendError)

            // フォールバック分析を実行
            results = generateClassificationResults()
            console.log('✅ フォールバック推論完了:', results)

            // フォールバック使用の旨をユーザーに通知
            set({
               results,
               isInferring: false,
               error: new Error('バックエンドAPI未実装。フォールバック結果を表示しています。'),
            })
            return
         }

         set({ results, isInferring: false })
      } catch (err) {
         console.error('❌ 推論エラー:', err)

         // 最終フォールバック
         const fallbackResults = generateClassificationResults()
         const errorMessage =
            err instanceof Error
               ? `推論処理に失敗: ${err.message}. フォールバック結果を表示しています。`
               : '推論処理に失敗しました。フォールバック結果を表示しています。'

         set({
            results: fallbackResults,
            isInferring: false,
            error: new Error(errorMessage),
         })
         console.log('✅ 最終フォールバック推論結果:', fallbackResults)
      }
   },

   /**
    * 推論結果をクリアし、初期状態に戻します
    */
   clearResults: (): void => {
      set({ results: [], error: null })
   },

   /**
    * 推論結果を直接設定します
    *
    * @param results - 設定する推論結果配列
    */
   setResults: (results: InferenceResult[]): void => {
      set({ results, error: null })
   },

   /**
    * 推論エラーを設定します
    *
    * @param error - 設定するエラーオブジェクト
    */
   setError: (error: Error | null): void => {
      set({ error })
   },
}))
