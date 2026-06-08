import type { z } from "zod"
import {
   AiAnalysisSchema,
   ApiErrorSchema,
   CreatePinRequestSchema,
   SoundPinApiSchema,
} from "./api-contract.js"

/**
 * 音声ピン作成リクエストのスキーマ
 *
 * @deprecated API contract schemas live in `api-contract.ts`.
 * Use `CreatePinRequestSchema` instead.
 */
export const SoundPinCreateRequestSchema = CreatePinRequestSchema

/**
 * AI分析結果のスキーマ
 *
 * @deprecated Use `AiAnalysisSchema` from `api-contract.ts`.
 */
export const AIAnalysisResultSchema = AiAnalysisSchema

/**
 * 音声ピンのスキーマ
 *
 * @deprecated Use `SoundPinApiSchema` from `api-contract.ts`.
 */
export const SoundPinSchema = SoundPinApiSchema

/**
 * APIエラーレスポンスのスキーマ
 *
 * @deprecated Use `ApiErrorSchema` from `api-contract.ts`.
 */
export const APIErrorSchema = ApiErrorSchema

/**
 * API成功レスポンスの型定義
 */
export interface APIResponse<T = unknown> {
   success: true
   data: T
}

/**
 * APIエラーレスポンスの型定義
 */
export interface APIErrorResponse {
   success: false
   error: APIError
}

// Zodスキーマから推論した型
export type SoundPinCreateRequest = z.infer<typeof SoundPinCreateRequestSchema>
export type AIAnalysisResult = z.infer<typeof AIAnalysisResultSchema>
export type ApiSoundPin = z.infer<typeof SoundPinSchema>
/**
 * @deprecated Use `ApiSoundPin` or `SoundPinAPI` for API data.
 */
export type SoundPin = ApiSoundPin
export type APIError = z.infer<typeof APIErrorSchema>

/**
 * 標準エラーコード定数
 */
export const ERROR_CODES = {
   // 音声関連
   AUDIO_TOO_LARGE: "AUDIO_TOO_LARGE",
   INVALID_AUDIO_FORMAT: "INVALID_AUDIO_FORMAT",
   AUDIO_DURATION_INVALID: "AUDIO_DURATION_INVALID",

   // 位置関連
   INVALID_LOCATION: "INVALID_LOCATION",
   LOCATION_OUT_OF_BOUNDS: "LOCATION_OUT_OF_BOUNDS",

   // AI分析関連
   AI_ANALYSIS_FAILED: "AI_ANALYSIS_FAILED",
   AI_SERVICE_UNAVAILABLE: "AI_SERVICE_UNAVAILABLE",

   // システム関連
   RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
   INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
   DATABASE_ERROR: "DATABASE_ERROR",
   STORAGE_ERROR: "STORAGE_ERROR",
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]
