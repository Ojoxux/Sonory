/**
 * ピンAPI通信サービス
 *
 * バックエンドAPIとの通信ロジックを集約
 */

import type { MapBounds, WeatherData } from "@sonory/shared-types"
import type { PinApiResponse } from "../domain/pin-types"

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
