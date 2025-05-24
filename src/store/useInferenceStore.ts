import { create } from 'zustand'
import type { AudioData, InferenceResult, InferenceState } from './types'

/**
 * AI推論機能を管理するZustandストア
 *
 * 音声データからAI推論を行い、結果を管理します。
 * TensorFlow.jsとYAMNetモデルを使用して、オンデバイスで音声分類を行います。
 */
export const useInferenceStore = create<InferenceState>((set) => ({
  // 初期状態
  results: [],
  isInferring: false,
  error: null,

  /**
   * 音声データからAI推論を開始します
   *
   * @param _audioData - 推論対象の音声データ
   * @throws 推論処理中にエラーが発生した場合
   */
  startInference: async (_audioData: AudioData) => {
    try {
      set({ isInferring: true, error: null })

      // TODO: TensorFlow.jsとYAMNetモデルを使用した推論ロジックを実装
      // 現在はダミーデータを返す
      const dummyResults: InferenceResult[] = [
        { label: '犬の鳴き声', confidence: 0.85 },
        { label: '車の音', confidence: 0.1 },
        { label: '話し声', confidence: 0.05 },
      ]

      // 擬似的な遅延を追加（実際の推論では削除）
      await new Promise((resolve) => setTimeout(resolve, 1000))

      set({ results: dummyResults, isInferring: false })
    } catch (err) {
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
  clearResults: () => {
    set({ results: [], error: null })
  },

  /**
   * 推論結果を直接設定します
   *
   * 主にテストや外部からの結果インポート時に使用します
   *
   * @param results - 設定する推論結果の配列
   */
  setResults: (results: InferenceResult[]) => {
    set({ results })
  },

  /**
   * 推論エラー状態を設定します
   *
   * エラーのクリアや外部エラー処理からのエラー状態設定に使用します
   *
   * @param error - 設定するエラーオブジェクト、またはnull（エラークリア時）
   */
  setError: (error: Error | null) => {
    set({ error })
  },
}))
