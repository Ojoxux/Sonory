import { z } from "zod"

/**
 * 音声フォーマットスキーマ
 */
export const AudioFormatSchema = z.enum([
   "webm",
   "mp3",
   "wav",
   "mp4",
   "m4a",
   "flac",
   "ogg",
])
export type AudioFormat = z.infer<typeof AudioFormatSchema>

/**
 * AI推論結果のスキーマ
 *
 * YAMNetまたはフォールバック分類の1件分の結果
 */
export const InferenceResultSchema = z.object({
   label: z.string(),
   confidence: z.number().min(0).max(1),
})
export type InferenceResult = z.infer<typeof InferenceResultSchema>

/**
 * Python YAMNet分析結果のスキーマ
 *
 * バックエンドのPython Audio Analyzerから返却される分析結果
 */
export const PythonAnalysisResultSchema = z.object({
   classifications: z.array(
      z.object({
         label: z.string(),
         confidence: z.number(),
      }),
   ),
   environment: z
      .object({
         primary_type: z.string(),
         type_scores: z.record(z.string(), z.number()),
         description: z.string(),
      })
      .optional(),
   performance_metrics: z
      .object({
         yamnet_inference_time: z.number(),
         total_time: z.number(),
         processing_ratio: z.number(),
      })
      .optional(),
})
export type PythonAnalysisResult = z.infer<typeof PythonAnalysisResultSchema>

/**
 * 音声メタデータ（アップロード後のサーバー側メタデータ）
 */
export interface AudioMetadata {
   id: string
   filename: string
   size: number
   format: AudioFormat
   duration: number
   url: string
   uploadedAt: string
}

/**
 * 音声アップロード結果
 */
export interface AudioUploadResult {
   audioId: string
   audioUrl: string
   audioFilePath: string
   metadata: AudioMetadata
}
