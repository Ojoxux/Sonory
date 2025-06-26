import { create } from 'zustand'
import type { AudioData, InferenceResult, InferenceState } from './types'

/**
 * Python YAMNet API response classification type
 */
interface APIClassification {
   label: string
   confidence: number
}

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
 * 音声ファイルをSupabase Storageにアップロード
 *
 * @param audioData - アップロードする音声データ
 * @returns アップロード後のURL
 */
async function uploadAudioToStorage(audioData: AudioData): Promise<string> {
   console.log('📤 音声ファイルをアップロード中...')

   try {
      // FormDataを作成
      const formData = new FormData()
      formData.append('audio', audioData.blob, `audio-${audioData.id}.webm`)

      // 音声ファイルをアップロード
      const response = await fetch('/api/audio/upload', {
         method: 'POST',
         body: formData,
      })

      if (!response.ok) {
         const errorData = await response.json().catch(() => ({}))
         throw new Error(
            `アップロード失敗: ${response.status} ${response.statusText} - ${
               errorData.error?.message || '不明なエラー'
            }`
         )
      }

      const result = await response.json()

      if (!result.success || !result.data?.audioUrl) {
         throw new Error('アップロード結果が不正です')
      }

      console.log('✅ 音声アップロード完了:', result.data.audioUrl)
      return result.data.audioUrl
   } catch (error) {
      console.error('❌ 音声アップロードエラー:', error)
      throw error
   }
}

/**
 * バックエンドAPI呼び出し（実装完了）
 *
 * @description
 * Python YAMNetサービスへのAPI呼び出しを実行
 */
async function callBackendAnalysis(
   audioData: AudioData,
   audioUrl: string
): Promise<InferenceResult[]> {
   console.log('🚀 バックエンドAPI呼び出し開始:', audioData.id)

   try {
      // API Gateway経由でPython YAMNet分析を実行
      const response = await fetch(`/api/audio/${audioData.id}/analyze`, {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
         },
         body: JSON.stringify({
            audioUrl: audioUrl, // アップロード後のURLを使用
            topK: 5,
         }),
      })

      if (!response.ok) {
         const errorData = await response.json().catch(() => ({}))
         throw new Error(
            `API分析失敗: ${response.status} ${response.statusText} - ${
               errorData.error?.message || '不明なエラー'
            }`
         )
      }

      const analysisResult = await response.json()

      if (!analysisResult.success || !analysisResult.data) {
         throw new Error('分析結果の形式が正しくありません')
      }

      // Python YAMNet分析結果を統一形式に変換
      const classifications: InferenceResult[] = (analysisResult.data.allClassifications || [])
         .slice(0, 5) // 上位5件に制限
         .map((classification: APIClassification) => ({
            label: classification.label || '不明',
            confidence: classification.confidence || 0,
         }))

      // 結果が空の場合はフォールバックを使用
      if (classifications.length === 0) {
         throw new Error('分析結果が空でした - フォールバックを使用')
      }

      console.log('✅ バックエンドAPI分析完了:', {
         classificationsCount: classifications.length,
         primarySound: classifications[0],
         environment: analysisResult.data.environment,
         processingTime: analysisResult.data.performanceMetrics?.total_time,
      })

      return classifications
   } catch (error) {
      console.warn('⚠️ バックエンドAPI呼び出し失敗:', error)
      throw error // エラーを上位に伝播してフォールバック処理を実行
   }
}

/**
 * AI推論機能を管理するZustandストア
 *
 * @description
 * 音声データからAI推論を行い、結果を管理します。
 * Python YAMNetサービスをバックエンド経由で呼び出し、
 * 失敗時はフォールバック機能を使用します。
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
    * Python YAMNetサービスをバックエンド経由で呼び出し、
    * 失敗時はフォールバック機能でリカバリします。
    */
   startInference: async (audioData: AudioData): Promise<void> => {
      try {
         console.log('🚀 音響推論開始')
         set({ isInferring: true, error: null })

         let results: InferenceResult[]
         let isUsingFallback = false

         try {
            // 1. 音声ファイルをSupabase Storageにアップロード
            const audioUrl = await uploadAudioToStorage(audioData)

            // 2. アップロードされたURLを使ってバックエンドAPI呼び出しを実行
            results = await callBackendAnalysis(audioData, audioUrl)
            console.log('✅ バックエンドAPI推論完了:', results)
         } catch (backendError) {
            console.log('🔄 バックエンドAPI失敗、フォールバック実行:', backendError)
            isUsingFallback = true

            // フォールバック分析を実行
            results = generateClassificationResults()
            console.log('✅ フォールバック推論完了:', results)
         }

         // 結果を設定
         set({
            results,
            isInferring: false,
            error: isUsingFallback
               ? new Error('バックエンドAPI接続失敗。フォールバック結果を表示しています。')
               : null,
         })

         if (isUsingFallback) {
            console.warn(
               '⚠️ フォールバック結果を使用中 - ネットワーク接続やサービス状態を確認してください'
            )
         }
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
