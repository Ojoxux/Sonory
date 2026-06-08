import { create } from "zustand"
import {
   callBackendAnalysis,
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
         let resolvedAudioId = audioData.id

         try {
            const recorderState = useRecorderStore.getState()
            let audioUrl = recorderState.uploadedAudioUrl
            let audioId = recorderState.uploadedAudioId

            if (!audioUrl || !audioId) {
               const uploaded = await uploadAudioToStorage(audioData)
               audioUrl = uploaded.audioUrl
               audioId = uploaded.audioId
            }

            resolvedAudioId = audioId
            results = await callBackendAnalysis(audioId, audioUrl)

            const pythonResult: PythonAnalysisResult = {
               classifications: results.map((r) => ({
                  label: r.label,
                  confidence: r.confidence,
               })),
            }

            set({
               analysisStatus: "success",
               backendAnalysisResult: pythonResult,
               lastAnalyzedAudioId: resolvedAudioId,
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

         const inferenceResults = await callBackendAnalysis(audioId, audioUrl)
         const pythonResult: PythonAnalysisResult = {
            classifications: inferenceResults.map((result) => ({
               label: result.label,
               confidence: result.confidence,
            })),
         }

         set({
            results: inferenceResults,
            backendAnalysisResult: pythonResult,
            analysisStatus: "success",
            fallbackUsed: false,
            error: null,
         })

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
         set({
            results: fallbackResults,
            error: new Error(errorMessage),
         })
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
