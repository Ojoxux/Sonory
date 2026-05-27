/**
 * ピンデータの型変換ロジック
 *
 * DB/APIレスポンスとフロントエンドのSoundPin間の変換を行う
 */

import type { InferenceResult } from "../store/types"
import type { SoundPin } from "../store/useSoundPinStore"
import type { DbPin, PinApiResponse } from "./pin-types"

/**
 * APIレスポンスをSoundPinに変換
 */
export function convertApiResponseToPin(
   result: PinApiResponse,
   analysisResult: InferenceResult[],
   primaryResult: InferenceResult | undefined,
   duration: number | undefined,
): SoundPin {
   if (!result.success || !result.data) {
      throw new Error("ピン作成結果が不正です")
   }

   return {
      id: result.data.id,
      latitude: result.data.location.lat,
      longitude: result.data.location.lng,
      audioData: {
         blob: new Blob(),
         url: result.data.audio.url,
         recordedAt: new Date(result.data.createdAt),
         id: result.data.id,
         duration,
      },
      classificationResults: analysisResult,
      recordedAt: new Date(result.data.createdAt),
      primaryLabel: primaryResult?.label ?? "不明",
      primaryConfidence: primaryResult?.confidence ?? 0,
      isPersisted: true,
      timeTag: result.data.timeTag,
      environment: primaryResult?.label || "unknown",
      weather: result.data.weather,
   }
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

/**
 * DBピンをSoundPinに変換
 */
export function convertDbPinToSoundPin(dbPin: unknown): SoundPin {
   const pin = dbPin as DbPin

   const classificationResults = buildClassificationResults(pin)
   const primaryLabel =
      pin.title || pin.aiAnalysis?.categories?.topic || "音声ピン"
   const environment =
      pin.title || pin.aiAnalysis?.categories?.topic || "unknown"

   return {
      id: pin.id,
      latitude: pin.location.lat,
      longitude: pin.location.lng,
      audioData: {
         blob: new Blob(),
         url: pin.audio.url,
         recordedAt: new Date(pin.createdAt),
         id: pin.id,
      },
      classificationResults,
      recordedAt: new Date(pin.createdAt),
      primaryLabel,
      primaryConfidence: pin.aiAnalysis?.categories?.confidence ?? 0.8,
      isPersisted: true,
      weather: pin.weather,
      timeTag: pin.timeTag,
      environment,
   }
}
