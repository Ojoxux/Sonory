/**
 * 音声分析サービス
 *
 * バックエンドのPython YAMNet APIとの通信、フォールバック生成を集約
 */

import type {
   AudioData,
   InferenceResult,
   PythonAnalysisResult,
} from "../store/types"

interface APIClassification {
   label: string
   confidence: number
   category?: string
}

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
 */
export function generateClassificationResults(): InferenceResult[] {
   const primaryIndex = Math.floor(
      Math.random() * FALLBACK_CLASSIFICATIONS.length,
   )
   const primaryResult = FALLBACK_CLASSIFICATIONS[primaryIndex]

   const otherResults = FALLBACK_CLASSIFICATIONS.filter(
      (_, index) => index !== primaryIndex,
   )
      .slice(0, Math.floor(Math.random() * 3) + 1)
      .map((result) => ({
         ...result,
         confidence: Math.random() * 0.4 + 0.1,
      }))

   return [primaryResult, ...otherResults].sort(
      (a, b) => b.confidence - a.confidence,
   )
}

/**
 * 音声ファイルをSupabase Storageにアップロード
 */
export async function uploadAudioToStorage(
   audioData: AudioData,
): Promise<string> {
   const formData = new FormData()
   formData.append("audio", audioData.blob, `audio-${audioData.id}.webm`)

   const response = await fetch("/api/audio/upload", {
      method: "POST",
      body: formData,
   })

   if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
         `アップロード失敗: ${response.status} ${response.statusText} - ${
            (errorData as { error?: { message?: string } }).error?.message ||
            "不明なエラー"
         }`,
      )
   }

   const result = await response.json()

   if (
      !result.success ||
      !(result as { data?: { audioUrl?: string } }).data?.audioUrl
   ) {
      throw new Error("アップロード結果が不正です")
   }
   return (result as { data: { audioUrl: string } }).data.audioUrl
}

/**
 * 分析ジョブを投入
 */
export async function submitAnalysisJob(
   audioId: string,
   audioUrl: string,
): Promise<string> {
   const scheduleResponse = await fetch(`/api/audio/${audioId}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audioUrl, topK: 5 }),
   })

   if (!scheduleResponse.ok) {
      const errorData = await scheduleResponse.json().catch(() => ({}))
      throw new Error(
         `ジョブ投入失敗: ${scheduleResponse.status} ${scheduleResponse.statusText} - ${
            (errorData as { error?: { message?: string } }).error?.message ||
            "不明なエラー"
         }`,
      )
   }

   const scheduleResult = await scheduleResponse.json()

   if (
      !scheduleResult.success ||
      !(scheduleResult as { data?: { jobId?: string } }).data?.jobId
   ) {
      throw new Error("ジョブ投入結果が不正です")
   }

   return (scheduleResult as { data: { jobId: string } }).data.jobId
}

/**
 * 分析結果をInferenceResult形式に変換
 */
export function convertAnalysisResult(
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
   audioId: string,
   jobId: string,
): Promise<{
   status: string
   result?: PythonAnalysisResult
   error?: { message?: string }
}> {
   const statusResponse = await fetch(
      `/api/audio/${audioId}/analysis/${jobId}/status`,
   )

   if (!statusResponse.ok) {
      const errorData = await statusResponse.json().catch(() => ({}))
      throw new Error(
         `ステータス取得失敗: ${statusResponse.status} ${statusResponse.statusText} - ${
            (errorData as { error?: { message?: string } }).error?.message ||
            "不明なエラー"
         }`,
      )
   }

   const statusResult = await statusResponse.json()

   if (!statusResult.success || !(statusResult as { data?: unknown }).data) {
      throw new Error("ステータス結果が不正です")
   }

   return (
      statusResult as {
         data: {
            status: string
            result?: PythonAnalysisResult
            error?: { message?: string }
         }
      }
   ).data
}

/**
 * ジョブステータスをポーリング
 */
export async function pollJobStatus(
   audioId: string,
   jobId: string,
): Promise<InferenceResult[]> {
   const maxAttempts = 60
   const pollInterval = 1000

   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval))

      const { status, result, error } = await fetchJobStatus(audioId, jobId)

      if (status === "completed" && result) {
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
 * バックエンドAPI呼び出し（ジョブ投入 + ポーリング）
 */
export async function callBackendAnalysis(
   audioId: string,
   audioUrl: string,
): Promise<InferenceResult[]> {
   const jobId = await submitAnalysisJob(audioId, audioUrl)
   return pollJobStatus(audioId, jobId)
}
