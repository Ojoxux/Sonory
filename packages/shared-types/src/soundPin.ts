import type { InferenceResult } from "./audio.js"
import type { LocationCoordinates } from "./location.js"
import type { WeatherData } from "./weather.js"

/**
 * 音声ピンの基本データ型（API間共通）
 *
 * フロントエンド表示・バックエンドDB保存の両方で参照される標準形
 */
export interface SoundPinData {
   id: string
   latitude: number
   longitude: number
   primaryLabel: string
   primaryConfidence: number
   recordedAt: string
   audioFilePath?: string
   classificationResults?: InferenceResult[]
   weatherData?: WeatherData
   timeTag?: string
   createdAt: string
   updatedAt: string
}

/**
 * API音声情報
 */
export interface SoundPinAudio {
   url: string
   duration: number
   format: "webm" | "mp3" | "wav" | "mp4" | "m4a" | "flac" | "ogg"
}

/**
 * AI分析結果
 */
export interface AIAnalysis {
   transcription: string
   categories: {
      emotion: string
      topic: string
      language: string
      confidence: number
   }
   summary?: string
}

/**
 * Sound pin APIレスポンス型（Backend API用ドメインモデル）
 */
export interface SoundPinAPI {
   id: string
   userId?: string
   location: LocationCoordinates
   audio: SoundPinAudio
   weather?: WeatherData
   timeTag?: "朝" | "昼" | "夕" | "夜"
   aiAnalysis?: AIAnalysis
   status: "active" | "processing" | "deleted" | "reported"
   title?: string
   metadata?: {
      deviceInfo?: string
   }
   createdAt: string
   updatedAt: string
}
