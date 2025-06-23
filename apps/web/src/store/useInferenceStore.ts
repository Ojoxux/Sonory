import { create } from 'zustand'
import type { AudioData, InferenceResult, InferenceState } from './types'
import { YAMNetService } from '../services/yamnet.service'

// YAMNetサービスのシングルトンインスタンス
let yamnetService: YAMNetService | null = null

/**
 * YAMNetサービスインスタンスを取得
 */
function getYAMNetService(): YAMNetService {
   if (!yamnetService) {
      yamnetService = new YAMNetService()
   }
   return yamnetService
}

/**
 * 道路音分類の結果候補（フォールバック用）
 *
 * @description
 * YAMNet分析が失敗した場合のフォールバック用分類結果
 */
const FALLBACK_CLASSIFICATIONS: readonly InferenceResult[] = [
   { label: '車の音', confidence: 0.85 },
   { label: 'バイクの音', confidence: 0.78 },
   { label: 'トラックの音', confidence: 0.72 },
   { label: '交通音', confidence: 0.8 },
   { label: 'バスの音', confidence: 0.75 },
] as const

/**
 * フォールバック用の道路音分類結果を生成
 *
 * @returns 道路音の分類結果配列（信頼度順）
 */
function generateFallbackClassification(): InferenceResult[] {
   // ランダムに1つの主要分類を選択
   const primaryIndex = Math.floor(Math.random() * FALLBACK_CLASSIFICATIONS.length)
   const primaryResult = FALLBACK_CLASSIFICATIONS[primaryIndex]

   // 他の分類結果をランダムな低い信頼度で追加
   const otherResults = FALLBACK_CLASSIFICATIONS.filter((_, index) => index !== primaryIndex)
      .slice(0, 2) // 最大2つの追加結果
      .map(result => ({
         ...result,
         confidence: Math.random() * 0.3 + 0.05, // 0.05-0.35の範囲
      }))

   return [primaryResult, ...otherResults].sort((a, b) => b.confidence - a.confidence)
}

/**
 * AI推論機能を管理するZustandストア
 *
 * 音声データからAI推論を行い、結果を管理します。
 * 現在は道路音分類のモック実装。将来的にTensorFlow.jsとYAMNetモデルを使用予定。
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
    * @throws 推論処理中にエラーが発生した場合
    */
   startInference: async (audioData: AudioData): Promise<void> => {
      try {
         console.log('🚀 YAMNet音響推論開始')
         set({ isInferring: true, error: null })

         const yamnet = getYAMNetService()

         // YAMNetモデルが初期化されていない場合は初期化
         if (!yamnet.isReady) {
            console.log('🤖 YAMNetモデルを初期化中...')
            await yamnet.initialize()
         }

         // YAMNetで音響分類を実行
         const classificationResult = await yamnet.classifyAudio(audioData)

         // 結果を統一形式に変換
         const results: InferenceResult[] = [
            classificationResult.primarySound,
            ...classificationResult.allClassifications.slice(1, 4).map(c => ({
               label: yamnet.mapToJapanese(c.className),
               confidence: c.confidence,
            })),
         ]

         set({ results, isInferring: false })
         console.log('✅ YAMNet推論結果を設定しました:', results)
         console.log(`🌍 検出された環境: ${classificationResult.environment}`)
      } catch (err) {
         console.error('❌ YAMNet推論エラー、フォールバック使用:', err)

         // YAMNet推論が失敗した場合はフォールバックを使用
         console.log('🔄 フォールバック推論を使用します')
         const fallbackResults = generateFallbackClassification()

         set({
            results: fallbackResults,
            isInferring: false,
            error: new Error('YAMNet推論に失敗しました。フォールバック結果を表示しています。'),
         })
         console.log('✅ フォールバック推論結果を設定しました:', fallbackResults)
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
