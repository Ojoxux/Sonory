import { create } from "zustand"
import {
   callBackendAnalysis,
   convertAnalysisResult,
   generateClassificationResults,
   uploadAudioToStorage,
} from "../services/analysis"
import type {
   AnalysisStatus,
   AudioData,
   InferenceResult,
   InferenceState,
   PythonAnalysisResult,
} from "./types"
import { useRecorderStore } from "./useRecorderStore"

interface APIClassification {
   label: string
   confidence: number
   category?: string
}

/**
 * AI推論機能を管理するZustandストア
 *
 * @description
 * 音声データからAI推論を行い、結果を管理します。
 * Python YAMNetサービスをバックエンド経由で呼び出し、
 * 失敗時はフォールバック機能を使用します。
 */
export const useInferenceStore = create<InferenceState>((set, _get) => ({
   results: [],
   isInferring: false,
   error: null,
   analysisStatus: "idle",
   backendAnalysisResult: null,
   fallbackUsed: false,
   analysisError: null,
   lastAnalyzedAudioId: null,

   /**
    * 音声データから音響AI推論を開始します
    */
   startInference: async (audioData: AudioData): Promise<void> => {
      try {
         set({
            isInferring: true,
            error: null,
            analysisStatus: "analyzing",
            fallbackUsed: false,
            analysisError: null,
            lastAnalyzedAudioId: audioData.id,
         })

         let results: InferenceResult[]
         let isUsingFallback = false

         try {
            const recorderState = useRecorderStore.getState()
            let audioUrl = recorderState.uploadedAudioUrl

            if (!audioUrl) {
               audioUrl = await uploadAudioToStorage(audioData)
            }

            results = await callBackendAnalysis(audioData.id, audioUrl)

            const pythonResult: PythonAnalysisResult = {
               classifications: results.map((r) => ({
                  label: r.label,
                  confidence: r.confidence,
               })),
            }

            set({
               analysisStatus: "success",
               backendAnalysisResult: pythonResult,
            })
         } catch (_backendError) {
            isUsingFallback = true
            results = generateClassificationResults()

            set({
               analysisStatus: "fallback",
               fallbackUsed: true,
               analysisError:
                  _backendError instanceof Error
                     ? _backendError.message
                     : "バックエンドAPI接続失敗",
            })
         }

         set({
            results,
            isInferring: false,
            error: isUsingFallback
               ? new Error(
                    "バックエンドAPI接続失敗。フォールバック結果を表示しています。",
                 )
               : null,
         })
      } catch (err) {
         const fallbackResults = generateClassificationResults()
         const errorMessage =
            err instanceof Error
               ? `推論処理に失敗: ${err.message}. フォールバック結果を表示しています。`
               : "推論処理に失敗しました。フォールバック結果を表示しています。"

         set({
            results: fallbackResults,
            isInferring: false,
            error: new Error(errorMessage),
            analysisStatus: "error",
            fallbackUsed: true,
            analysisError: errorMessage,
         })
      }
   },

   /**
    * バックエンドで音声分析を実行
    */
   analyzeAudioWithBackend: async (
      audioId: string,
      audioUrl: string,
   ): Promise<InferenceResult[]> => {
      try {
         set({
            analysisStatus: "analyzing",
            analysisError: null,
            lastAnalyzedAudioId: audioId,
         })

         const response = await fetch(`/api/audio/${audioId}/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audioUrl, topK: 5 }),
         })

         if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(
               (errorData as { message?: string }).message ||
                  `分析失敗: ${response.status}`,
            )
         }

         const result = await response.json()

         if (!result.success || !(result as { data?: unknown }).data) {
            throw new Error("分析結果が不正です")
         }

         const data = (result as { data: PythonAnalysisResult }).data

         set({
            backendAnalysisResult: data,
            analysisStatus: "success",
            fallbackUsed: false,
         })

         const inferenceResults: InferenceResult[] =
            (
               data as {
                  allClassifications?: APIClassification[]
               }
            ).allClassifications?.map((classification: APIClassification) => ({
               label: classification.label,
               confidence: classification.confidence,
            })) || convertAnalysisResult(data)

         set({ results: inferenceResults })
         return inferenceResults
      } catch (error) {
         const errorMessage =
            error instanceof Error
               ? error.message
               : "バックエンド分析に失敗しました"

         set({
            analysisStatus: "error",
            analysisError: errorMessage,
            fallbackUsed: true,
         })

         const fallbackResults = generateClassificationResults()
         set({ results: fallbackResults })
         return fallbackResults
      }
   },

   clearResults: (): void => {
      set({
         results: [],
         error: null,
         analysisStatus: "idle",
         backendAnalysisResult: null,
         fallbackUsed: false,
         analysisError: null,
         lastAnalyzedAudioId: null,
      })
   },

   setResults: (results: InferenceResult[]): void => {
      set({ results })
   },

   setError: (error: Error | null): void => {
      set({ error })
   },

   setAnalysisStatus: (status: AnalysisStatus): void => {
      set({ analysisStatus: status })
   },

   setBackendAnalysisResult: (result: PythonAnalysisResult): void => {
      set({ backendAnalysisResult: result })
   },

   setFallbackUsed: (used: boolean): void => {
      set({ fallbackUsed: used })
   },

   clearAnalysisState: (): void => {
      set({
         analysisStatus: "idle",
         backendAnalysisResult: null,
         fallbackUsed: false,
         analysisError: null,
         lastAnalyzedAudioId: null,
      })
   },
}))
