/**
 * ピン変換ユーティリティ
 */

import type { SoundPin } from "@/store/useSoundPinStore"
import type { SoundPinAPI } from "@sonory/shared-types"

/**
 * APIピンをローカルピン形式に変換
 * @param apiPin - APIピン
 * @returns ローカルピン
 */
export const convertApiPinToLocal = (apiPin: SoundPinAPI): SoundPin => {
   // デバッグ: APIピンの変換処理をログ出力
   if (process.env.NODE_ENV === "development") {
      console.log("🔄 Converting API pin to local format:", {
         pinId: apiPin.id,
         title: apiPin.title,
         aiTopic: apiPin.aiAnalysis?.categories?.topic,
         aiConfidence: apiPin.aiAnalysis?.categories?.confidence,
      })
   }

   // 分類結果を構築
   const classificationResults = []

   // 1. titleフィールドから分類結果を取得（最優先）
   if (
      apiPin.title &&
      apiPin.title !== "音声ピン" &&
      apiPin.title.trim() !== ""
   ) {
      classificationResults.push({
         label: apiPin.title,
         confidence: apiPin.aiAnalysis?.categories?.confidence || 0.8, // デフォルトで80%の信頼度
         category: "other" as const,
      })
   }
   // 2. aiAnalysisのtopicから分類結果を取得
   else if (
      apiPin.aiAnalysis?.categories?.topic &&
      apiPin.aiAnalysis.categories.topic !== "unknown"
   ) {
      classificationResults.push({
         label: apiPin.aiAnalysis.categories.topic,
         confidence: apiPin.aiAnalysis.categories.confidence || 0,
         category: "other" as const,
      })
   }
   // 3. どちらもない場合は「未分類」
   else {
      classificationResults.push({
         label: "未分類",
         confidence: 0,
         category: "other" as const,
      })
   }

   // primaryLabelとenvironmentを決定
   const primaryLabel =
      apiPin.title || apiPin.aiAnalysis?.categories?.topic || "音声ピン"
   const environment =
      apiPin.title || apiPin.aiAnalysis?.categories?.topic || "unknown"

   return {
      id: apiPin.id,
      latitude: apiPin.location.lat,
      longitude: apiPin.location.lng,
      audioData: {
         url: apiPin.audio.url,
         recordedAt: new Date(apiPin.createdAt),
         id: apiPin.id,
         blob: new Blob(), // APIピンのblobは空
      },
      classificationResults,
      recordedAt: new Date(apiPin.createdAt),
      primaryLabel,
      primaryConfidence: apiPin.aiAnalysis?.categories?.confidence || 0.8,
      isPersisted: true,
      timeTag: (apiPin.timeTag as "朝" | "昼" | "夕" | "夜") || undefined,
      environment,
      weather: apiPin.weather
         ? {
              temperature: apiPin.weather.temperature,
              condition: apiPin.weather.condition || "unknown",
              windSpeed: apiPin.weather.windSpeed,
              humidity: apiPin.weather.humidity,
           }
         : undefined,
   }
}
