/**
 * 音声分析サービス
 *
 * バックエンドのPython YAMNet APIとの通信、フォールバック生成を集約
 */

import type {
   AnalysisStatusData,
   AnalysisStatusResponse,
   InferenceResult,
   PythonAnalysisResult,
   SubmitAnalysisJobResponse,
   UploadAudioResponse,
} from "@sonory/shared-types"
import type { AudioData } from "../store/types"
import { type ApiClient, defaultApiClient } from "./api-client"

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
 *
 * @param audioData - 音声データ
 * @param client - APIクライアント（テスト時に差し替え可能）
 */
export interface UploadedAudioRef {
   audioUrl: string
   audioId: string
}

export async function uploadAudioToStorage(
   audioData: AudioData,
   client: ApiClient = defaultApiClient,
): Promise<UploadedAudioRef> {
   const formData = new FormData()
   formData.append("audio", audioData.blob, `audio-${audioData.id}.webm`)

   const result = await client.postFormData<UploadAudioResponse>(
      "/api/audio/upload",
      formData,
   )

   if (!result.success || !result.data?.audioUrl || !result.data.audioId) {
      throw new Error("アップロード結果が不正です")
   }

   return {
      audioUrl: result.data.audioUrl,
      audioId: result.data.audioId,
   }
}

/**
 * 分析ジョブを投入
 *
 * @param audioId - 音声ID
 * @param audioUrl - 音声URL
 * @param client - APIクライアント（テスト時に差し替え可能）
 */
export async function submitAnalysisJob(
   audioId: string,
   audioUrl: string,
   client: ApiClient = defaultApiClient,
): Promise<string> {
   const result = await client.post<SubmitAnalysisJobResponse>(
      `/api/audio/${audioId}/analyze`,
      { audioUrl, topK: 5 },
   )

   if (!result.success || !result.data?.jobId) {
      throw new Error("ジョブ投入結果が不正です")
   }

   return result.data.jobId
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
   client: ApiClient,
): Promise<{
   status: AnalysisStatusData["status"]
   result?: AnalysisStatusData["result"]
   error?: AnalysisStatusData["error"]
}> {
   const result = await client.get<AnalysisStatusResponse>(
      `/api/audio/${audioId}/analysis/${jobId}/status`,
   )

   if (!result.success || !result.data) {
      throw new Error("ステータス結果が不正です")
   }

   return result.data
}

/**
 * ジョブステータスをポーリング
 *
 * @param audioId - 音声ID
 * @param jobId - ジョブID
 * @param client - APIクライアント（テスト時に差し替え可能）
 */
export async function pollJobStatus(
   audioId: string,
   jobId: string,
   client: ApiClient = defaultApiClient,
): Promise<InferenceResult[]> {
   const maxAttempts = 120
   const pollInterval = 1000

   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (attempt > 1) {
         await new Promise((resolve) => setTimeout(resolve, pollInterval))
      }

      const { status, result, error } = await fetchJobStatus(
         audioId,
         jobId,
         client,
      )

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
 *
 * @param audioId - 音声ID
 * @param audioUrl - 音声URL
 * @param client - APIクライアント（テスト時に差し替え可能）
 */
export async function callBackendAnalysis(
   audioId: string,
   audioUrl: string,
   client: ApiClient = defaultApiClient,
): Promise<InferenceResult[]> {
   const jobId = await submitAnalysisJob(audioId, audioUrl, client)
   return pollJobStatus(audioId, jobId, client)
}
