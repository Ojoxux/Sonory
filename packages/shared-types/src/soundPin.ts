import type { z } from "zod"
import type { AiAnalysisSchema, SoundPinApiSchema } from "./api-contract.js"

/**
 * API音声情報
 */
export type SoundPinAudio = z.infer<typeof SoundPinApiSchema>["audio"]

/**
 * AI分析結果
 */
export type AIAnalysis = z.infer<typeof AiAnalysisSchema>

/**
 * Sound pin APIレスポンス型（Backend API用ドメインモデル）
 */
export type SoundPinAPI = z.infer<typeof SoundPinApiSchema>
