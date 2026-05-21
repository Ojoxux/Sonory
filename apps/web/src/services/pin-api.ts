/**
 * ピンAPI通信サービス
 *
 * バックエンドAPIとの通信ロジックを集約
 */

import type { MapBounds, WeatherData } from "@sonory/shared-types"
import type { InferenceResult } from "../store/types"

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

interface PinCreateParams {
   audioFilePath: string
   location: { lat: number; lng: number; accuracy?: number }
   duration: number
   timeTag: string
   title: string
   deviceInfo: string
   weather?: WeatherData
}

interface PinUploadParams {
   audioBlob: Blob
   location: { lat: number; lng: number; accuracy?: number }
   duration: number
   timeTag: string
   title: string
   deviceInfo: string
   weather?: WeatherData
}

/**
 * storage:// URLからピンを作成（メタデータのみ送信）
 */
export async function createPinFromStorageUrl(
   params: PinCreateParams,
): Promise<PinApiResponse> {
   const response = await fetch("/api/pins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
         audio_file_path: params.audioFilePath,
         location: params.location,
         metadata: {
            duration: params.duration,
            timeTag: params.timeTag,
            title: params.title,
            deviceInfo: params.deviceInfo,
            ...(params.weather ? { weather: params.weather } : {}),
         },
      }),
   })

   if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
         (errorData as { message?: string }).message ||
            `ピン作成失敗: ${response.status}`,
      )
   }

   return response.json()
}

/**
 * 音声ファイルをアップロードしてピンを作成
 */
export async function uploadPinWithAudio(
   params: PinUploadParams,
): Promise<PinApiResponse> {
   const formData = new FormData()
   formData.append("audio", params.audioBlob, "audio.webm")
   formData.append("location", JSON.stringify(params.location))
   formData.append(
      "metadata",
      JSON.stringify({
         duration: params.duration,
         timeTag: params.timeTag,
         title: params.title,
         deviceInfo: params.deviceInfo,
         ...(params.weather ? { weather: params.weather } : {}),
      }),
   )

   const response = await fetch("/api/pins/upload", {
      method: "POST",
      body: formData,
   })

   if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
         (errorData as { message?: string }).message ||
            `ピン作成失敗: ${response.status}`,
      )
   }

   return response.json()
}

/**
 * 周辺ピンを取得
 */
export async function fetchNearbyPins(
   bounds: MapBounds,
): Promise<{ success: boolean; data?: unknown[] }> {
   const params = new URLSearchParams({
      north: bounds.north.toString(),
      south: bounds.south.toString(),
      east: bounds.east.toString(),
      west: bounds.west.toString(),
      limit: "50",
   })

   const response = await fetch(`/api/pins/nearby?${params}`)

   if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
         (errorData as { message?: string }).message ||
            `ピン取得失敗: ${response.status}`,
      )
   }

   return response.json()
}

/**
 * 分類結果を構築（DBピンから）
 */
export function buildClassificationResults(pin: DbPin): InferenceResult[] {
   if (pin.title && pin.title !== "音声ピン" && pin.title.trim() !== "") {
      return [
         {
            label: pin.title,
            confidence: pin.aiAnalysis?.categories?.confidence ?? 0.8,
         },
      ]
   }

   if (
      pin.aiAnalysis?.categories?.topic &&
      pin.aiAnalysis.categories.topic !== "unknown"
   ) {
      return [
         {
            label: pin.aiAnalysis.categories.topic,
            confidence: pin.aiAnalysis.categories.confidence ?? 0,
         },
      ]
   }

   return [{ label: "未分類", confidence: 0 }]
}
