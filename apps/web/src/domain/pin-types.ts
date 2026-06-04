import type { WeatherData } from "@sonory/shared-types"

/**
 * ピン作成APIレスポンスの型
 */
export interface PinApiResponse {
   success: boolean
   data?: {
      id: string
      audio_url: string
      location: {
         lat: number
         lng: number
      }
      audio: {
         url: string
      }
      createdAt: string
      timeTag?: "朝" | "昼" | "夕" | "夜"
      weather?: WeatherData
   }
   error?: string
}

/**
 * DBから取得したピンの型
 */
export interface DbPin {
   id: string
   location: { lat: number; lng: number }
   audio: { url: string; duration: number; format: string }
   title?: string
   timeTag?: "朝" | "昼" | "夕" | "夜"
   weather?: WeatherData
   aiAnalysis?: {
      transcription: string
      categories: {
         confidence: number
         topic: string
         emotion: string
         language: string
      }
      summary?: string
   }
   status: "active" | "processing" | "deleted" | "reported"
   createdAt: string
   updatedAt: string
   metadata?: {
      deviceInfo: string
   }
}
