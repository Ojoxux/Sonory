/**
 * ピンAPI通信サービス
 *
 * バックエンドAPIとの通信ロジックを集約
 */

import type { MapBounds, WeatherData } from "@sonory/shared-types"
import type { InferenceResult } from "../store/types"
import { type ApiClient, defaultApiClient } from "./api-client"

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
 *
 * @param params - ピン作成パラメータ
 * @param client - APIクライアント（テスト時に差し替え可能）
 */
export async function createPinFromStorageUrl(
   params: PinCreateParams,
   client: ApiClient = defaultApiClient,
): Promise<PinApiResponse> {
   return client.post<PinApiResponse>("/api/pins", {
      audio_file_path: params.audioFilePath,
      location: params.location,
      metadata: {
         duration: params.duration,
         timeTag: params.timeTag,
         title: params.title,
         deviceInfo: params.deviceInfo,
         ...(params.weather ? { weather: params.weather } : {}),
      },
   })
}

/**
 * 音声ファイルをアップロードしてピンを作成
 *
 * @param params - アップロードパラメータ
 * @param client - APIクライアント（テスト時に差し替え可能）
 */
export async function uploadPinWithAudio(
   params: PinUploadParams,
   client: ApiClient = defaultApiClient,
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

   return client.postFormData<PinApiResponse>("/api/pins/upload", formData)
}

/**
 * 周辺ピンを取得
 *
 * @param bounds - 地図の境界
 * @param client - APIクライアント（テスト時に差し替え可能）
 */
export async function fetchNearbyPins(
   bounds: MapBounds,
   client: ApiClient = defaultApiClient,
): Promise<{ success: boolean; data?: unknown[] }> {
   const params = new URLSearchParams({
      north: bounds.north.toString(),
      south: bounds.south.toString(),
      east: bounds.east.toString(),
      west: bounds.west.toString(),
      limit: "50",
   })

   return client.get<{ success: boolean; data?: unknown[] }>(
      `/api/pins/nearby?${params}`,
   )
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
