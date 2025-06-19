import { create } from 'zustand'
import type { AudioData, InferenceResult, InferenceState } from './types'

/**
 * 道路音分類の結果候補
 *
 * @description
 * デモ用のモック分類結果。実際のTensorFlow.js + YAMNet実装時に置き換え予定
 */
const ROAD_SOUND_CLASSIFICATIONS: readonly InferenceResult[] = [
   { label: '車の音', confidence: 0.85 },
   { label: 'バイクの音', confidence: 0.78 },
   { label: 'トラックの音', confidence: 0.72 },
   { label: '交通音', confidence: 0.8 },
   { label: 'バスの音', confidence: 0.75 },
] as const

/**
 * ランダムな道路音分類結果を生成
 *
 * @returns 道路音の分類結果配列（信頼度順）
 */
function generateRoadSoundClassification(): InferenceResult[] {
   // ランダムに1つの主要分類を選択
   const primaryIndex = Math.floor(
      Math.random() * ROAD_SOUND_CLASSIFICATIONS.length,
   )
   const primaryResult = ROAD_SOUND_CLASSIFICATIONS[primaryIndex]

   // 他の分類結果をランダムな低い信頼度で追加
   const otherResults = ROAD_SOUND_CLASSIFICATIONS.filter(
      (_, index) => index !== primaryIndex,
   )
      .slice(0, 2) // 最大2つの追加結果
      .map((result) => ({
         ...result,
         confidence: Math.random() * 0.3 + 0.05, // 0.05-0.35の範囲
      }))

   return [primaryResult, ...otherResults].sort(
      (a, b) => b.confidence - a.confidence,
   )
}

/**
 * AI推論機能を管理するZustandストア
 *
 * 音声データからAI推論を行い、結果を管理します。
 * 現在は道路音分類のモック実装。将来的にTensorFlow.jsとYAMNetモデルを使用予定。
 */
export const useInferenceStore = create<InferenceState>((set) => ({
   // 初期状態
   results: [],
   isInferring: false,
   error: null,

   /**
    * 音声データから道路音AI推論を開始します
    *
    * @param _audioData - 推論対象の音声データ（現在は未使用）
    * @throws 推論処理中にエラーが発生した場合
    */
   startInference: async (_audioData: AudioData): Promise<void> => {
      try {
         console.log('🚀 AI推論開始 - 15秒の遅延を開始します')
         set({ isInferring: true, error: null })

         // TODO: TensorFlow.jsとYAMNetモデルを使用した実際の推論ロジックを実装
         // 現在は道路音のモック分類結果を返す
         const mockResults = generateRoadSoundClassification()

         // 擬似的な推論遅延を追加（実装用に15秒に調整）
         const startTime = Date.now()
         await new Promise((resolve) => setTimeout(resolve, 15000))
         const endTime = Date.now()
         console.log(`⏱️ AI推論完了 - 実際の遅延時間: ${endTime - startTime}ms`)

         set({ results: mockResults, isInferring: false })
         console.log('✅ AI推論結果を設定しました:', mockResults)
      } catch (err) {
         console.error('❌ AI推論エラー:', err)
         set({
            error:
               err instanceof Error
                  ? err
                  : new Error('推論中に不明なエラーが発生しました'),
            isInferring: false,
         })
      }
   },

   /**
    * 推論結果をクリアし、初期状態に戻します
    *
    * 新しい推論を開始する前や、ユーザーが明示的に結果をリセットしたい場合に使用します
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
