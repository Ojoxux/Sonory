/**
 * ピンAPI通信サービス
 *
 * バックエンドAPIとの通信ロジックを集約
 */

import type { MapBounds, WeatherData } from "@sonory/shared-types"
import type { PinApiResponse } from "../domain/pin-types"
import { type ApiClient, defaultApiClient } from "./api-client"

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
 * ピンを削除
 *
 * @param pinId - 削除するピンID
 * @param client - APIクライアント（テスト時に差し替え可能）
 */
export async function deletePin(
   pinId: string,
   client: ApiClient = defaultApiClient,
): Promise<void> {
   const result = await client.delete<{ success: boolean }>(
      `/api/pins/${pinId}`,
   )

   if (!result.success) {
      throw new Error("ピン削除結果が不正です")
   }
}
