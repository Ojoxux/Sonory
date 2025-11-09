import { create } from "zustand"
import type {
   AnalysisStatus,
   AudioData,
   InferenceResult,
   InferenceState,
   PythonAnalysisResult,
} from "./types"
import { useRecorderStore } from "./useRecorderStore"

/**
 * Python YAMNet API response classification type
 */
interface APIClassification {
   label: string
   confidence: number
   category?: string
}

/**
 * 道路音分類の結果候補（フォールバック用）
 *
 * @description
 * 現在は擬似的な分析結果を生成。将来的にはバックエンドのPython YAMNetサービスと統合予定。
 */
const FALLBACK_CLASSIFICATIONS: readonly InferenceResult[] = [
   { label: "車の音", confidence: 0.85 },
   { label: "バイクの音", confidence: 0.78 },
   { label: "トラックの音", confidence: 0.72 },
   { label: "交通音", confidence: 0.8 },
   { label: "バスの音", confidence: 0.75 },
   { label: "電車の音", confidence: 0.73 },
   { label: "鳥の鳴き声", confidence: 0.82 },
   { label: "雨音", confidence: 0.77 },
   { label: "風の音", confidence: 0.73 },
   { label: "人の声", confidence: 0.88 },
   { label: "音楽", confidence: 0.85 },
   { label: "工事の音", confidence: 0.79 },
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
   const primaryIndex = Math.floor(
      Math.random() * FALLBACK_CLASSIFICATIONS.length,
   )
   const primaryResult = FALLBACK_CLASSIFICATIONS[primaryIndex]

   // 他の分類結果をランダムな低い信頼度で追加
   const otherResults = FALLBACK_CLASSIFICATIONS.filter(
      (_, index) => index !== primaryIndex,
   )
      .slice(0, Math.floor(Math.random() * 3) + 1) // 1-3つの追加結果
      .map((result) => ({
         ...result,
         confidence: Math.random() * 0.4 + 0.1, // 0.1-0.5の範囲
      }))

   return [primaryResult, ...otherResults].sort(
      (a, b) => b.confidence - a.confidence,
   )
}

/**
 * 音声ファイルをSupabase Storageにアップロード (旧実装)
 *
 * @param audioData - アップロードする音声データ
 * @returns アップロード後のURL
 */
async function uploadAudioToStorage(audioData: AudioData): Promise<string> {
   try {
      // FormDataを作成
      const formData = new FormData()
      formData.append("audio", audioData.blob, `audio-${audioData.id}.webm`)

      // 音声ファイルをアップロード
      const response = await fetch("/api/audio/upload", {
         method: "POST",
         body: formData,
      })

      if (!response.ok) {
         const errorData = await response.json().catch(() => ({}))
         throw new Error(
            `アップロード失敗: ${response.status} ${response.statusText} - ${
               errorData.error?.message || "不明なエラー"
            }`,
         )
      }

      const result = await response.json()

      if (!result.success || !result.data?.audioUrl) {
         throw new Error("アップロード結果が不正です")
      }
      return result.data.audioUrl
   } catch (error) {
      console.error("❌ 音声アップロードエラー:", error)
      throw error
   }
}

/**
 * 分析ジョブを投入
 */
async function submitAnalysisJob(
   audioData: AudioData,
   audioUrl: string,
): Promise<string> {
   console.log("🔄 分析ジョブを投入中...", {
      audioId: audioData.id,
      audioUrl,
   })

   const scheduleResponse = await fetch(`/api/audio/${audioData.id}/analyze`, {
      method: "POST",
      headers: {
         "Content-Type": "application/json",
      },
      body: JSON.stringify({
         audioUrl: audioUrl,
         topK: 5,
      }),
   })

   if (!scheduleResponse.ok) {
      const errorData = await scheduleResponse.json().catch(() => ({}))
      throw new Error(
         `ジョブ投入失敗: ${scheduleResponse.status} ${scheduleResponse.statusText} - ${
            errorData.error?.message || "不明なエラー"
         }`,
      )
   }

   const scheduleResult = await scheduleResponse.json()

   if (!scheduleResult.success || !scheduleResult.data?.jobId) {
      throw new Error("ジョブ投入結果が不正です")
   }

   const { jobId } = scheduleResult.data
   console.log("✅ ジョブ投入成功:", { jobId })
   return jobId
}

/**
 * 分析結果を変換
 */
function convertAnalysisResult(
   result: PythonAnalysisResult,
): InferenceResult[] {
   const classifications: InferenceResult[] = (result.classifications || [])
      .slice(0, 5)
      .map((classification: APIClassification) => ({
         label: classification.label || "不明",
         confidence: classification.confidence || 0,
      }))

   if (classifications.length === 0) {
      throw new Error("分析結果が空でした")
   }

   return classifications
}

/**
 * ジョブステータスを取得
 */
async function fetchJobStatus(
   audioData: AudioData,
   jobId: string,
): Promise<{
   status: string
   result?: PythonAnalysisResult
   error?: { message?: string }
}> {
   const statusResponse = await fetch(
      `/api/audio/${audioData.id}/analysis/${jobId}/status`,
      {
         method: "GET",
      },
   )

   if (!statusResponse.ok) {
      const errorData = await statusResponse.json().catch(() => ({}))
      throw new Error(
         `ステータス取得失敗: ${statusResponse.status} ${statusResponse.statusText} - ${
            errorData.error?.message || "不明なエラー"
         }`,
      )
   }

   const statusResult = await statusResponse.json()

   if (!statusResult.success || !statusResult.data) {
      throw new Error("ステータス結果が不正です")
   }

   return statusResult.data
}

/**
 * ジョブステータスをポーリング
 */
async function pollJobStatus(
   audioData: AudioData,
   jobId: string,
): Promise<InferenceResult[]> {
   console.log("⏳ 分析結果を待機中...")
   const maxAttempts = 60
   const pollInterval = 1000

   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval))

      const { status, result, error } = await fetchJobStatus(audioData, jobId)

      console.log(`📊 ステータス確認 (${attempt}/${maxAttempts}):`, status)

      if (status === "completed" && result) {
         console.log("✅ 分析完了:", result)
         return convertAnalysisResult(result)
      }

      if (status === "failed") {
         throw new Error(`分析失敗: ${error?.message || "不明なエラー"}`)
      }
   }

   throw new Error(
      `分析タイムアウト: ${maxAttempts}秒経過してもジョブが完了しませんでした`,
   )
}

/**
 * バックエンドAPI呼び出し（実装完了）
 *
 * @description
 * Python YAMNetサービスへのAPI呼び出しを実行
 * ジョブを投入し、ステータスをポーリングして結果を取得
 */
async function callBackendAnalysis(
   audioData: AudioData,
   audioUrl: string,
): Promise<InferenceResult[]> {
   try {
      const jobId = await submitAnalysisJob(audioData, audioUrl)
      return await pollJobStatus(audioData, jobId)
   } catch (error) {
      console.warn("⚠️ バックエンドAPI呼び出し失敗:", error)
      throw error
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
export const useInferenceStore = create<InferenceState>((set, _get) => ({
   // 初期状態
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
    *
    * @param audioData - 推論対象の音声データ
    * @description
    * Python YAMNetサービスをバックエンド経由で呼び出し、
    * 失敗時はフォールバック機能でリカバリします。
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
            // RecorderStoreから既存のアップロード情報を取得
            const recorderState = useRecorderStore.getState()
            let audioUrl = recorderState.uploadedAudioUrl

            // アップロード済みURLがない場合はレガシー実装を使用
            if (!audioUrl) {
               console.log(
                  "⚠️ アップロード済みURLがありません。レガシー実装を使用します。",
               )
               audioUrl = await uploadAudioToStorage(audioData)
            } else {
               console.log("✅ アップロード済みURLを使用:", audioUrl)
            }

            // バックエンドAPI呼び出しを実行
            results = await callBackendAnalysis(audioData, audioUrl)

            // バックエンド分析結果をPythonAnalysisResult形式で保存
            const pythonResult: PythonAnalysisResult = {
               classifications: results.map((r) => ({
                  label: r.label,
                  confidence: r.confidence,
               })),
               // 環境情報は実際のAPIレスポンスから取得できる場合に設定
            }

            set({
               analysisStatus: "success",
               backendAnalysisResult: pythonResult,
            })
         } catch (_backendError) {
            isUsingFallback = true

            // フォールバック分析を実行
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

         // 結果を設定
         set({
            results,
            isInferring: false,
            error: isUsingFallback
               ? new Error(
                    "バックエンドAPI接続失敗。フォールバック結果を表示しています。",
                 )
               : null,
         })

         if (isUsingFallback) {
            console.warn(
               "⚠️ フォールバック結果を使用中 - ネットワーク接続やサービス状態を確認してください",
            )
         }
      } catch (err) {
         console.error("❌ 推論エラー:", err)

         // 最終フォールバック
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
    *
    * @param audioId - 音声ID
    * @param audioUrl - 音声URL
    * @returns 分析結果
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
            headers: {
               "Content-Type": "application/json",
            },
            body: JSON.stringify({
               audioUrl: audioUrl,
               topK: 5,
            }),
         })

         if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.message || `分析失敗: ${response.status}`)
         }

         const result = await response.json()

         if (!result.success || !result.data) {
            throw new Error("分析結果が不正です")
         }

         // バックエンドの分析結果を保存
         set({
            backendAnalysisResult: result.data,
            analysisStatus: "success",
            fallbackUsed: false,
         })

         // InferenceResult形式に変換
         const inferenceResults: InferenceResult[] =
            result.data.allClassifications?.map(
               (classification: APIClassification) => ({
                  label: classification.label,
                  confidence: classification.confidence,
                  category: classification.category || "unknown",
               }),
            ) || []

         return inferenceResults
      } catch (error) {
         const errorMessage =
            error instanceof Error ? error.message : "分析に失敗しました"

         set({
            analysisStatus: "error",
            analysisError: errorMessage,
            fallbackUsed: false,
         })

         throw new Error(errorMessage)
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

   /**
    * 分析状態を設定
    *
    * @param status - 分析状態
    */
   setAnalysisStatus: (status: AnalysisStatus): void => {
      set({ analysisStatus: status })
   },

   /**
    * バックエンド分析結果を設定
    *
    * @param result - Python YAMNet分析結果
    */
   setBackendAnalysisResult: (result: PythonAnalysisResult): void => {
      set({ backendAnalysisResult: result })
   },

   /**
    * フォールバック使用フラグを設定
    *
    * @param used - フォールバック使用フラグ
    */
   setFallbackUsed: (used: boolean): void => {
      set({ fallbackUsed: used })
   },

   /**
    * 分析状態をクリア
    */
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
