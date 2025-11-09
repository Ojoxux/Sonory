import type { DebugPanelProps } from "./types"

/**
 * 時間帯を判定
 */
export function getTimeOfDay(hour: number): string {
   if (hour >= 8 && hour < 17) {
      return "昼 (day)"
   }
   if (hour >= 17 && hour < 19) {
      return "夕方初期 (dusk)"
   }
   if (hour >= 19 && hour < 22) {
      return "夕方後期 (dusk)"
   }
   if (hour >= 22 || hour < 4) {
      return "夜 (night)"
   }
   if (hour >= 4 && hour < 6) {
      return "早朝暗め (night)"
   }
   if (hour >= 6 && hour < 8) {
      return "朝自然 (day)"
   }
   return "不明"
}

/**
 * メインデバッグ情報の表示内容を生成
 */
export function formatMainDebugInfo(
   position: DebugPanelProps["position"],
   permissionStatus: string,
   isMapboxPosition: boolean,
   geolocateInitialized: boolean,
   geolocateAttempted: boolean,
   currentLighting: DebugPanelProps["currentLighting"],
   debugTimeOverride: number | null,
): string {
   if (!position) {
      return "位置情報: 取得中..."
   }

   const hour =
      debugTimeOverride !== null ? debugTimeOverride : new Date().getHours()
   const timeOfDay = getTimeOfDay(hour)
   const currentTimeStr =
      debugTimeOverride !== null
         ? `${debugTimeOverride}時 (デバッグ)`
         : `${new Date().getHours()}時 (実時間)`

   const lightingInfo = currentLighting
      ? `
太陽強度: ${(currentLighting.sunIntensity * 100).toFixed(0)}%
影強度: ${(currentLighting.shadowIntensity * 100).toFixed(0)}%
霧密度: ${(currentLighting.fogDensity * 100).toFixed(0)}%`
      : ""

   return `位置: ${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}
精度: ${position.accuracy.toFixed(1)}m
更新: ${new Date(position.timestamp).toLocaleTimeString()}
権限: ${permissionStatus}
ソース: ${isMapboxPosition ? "Mapbox (高精度)" : "カスタム"}
初期化: ${geolocateInitialized ? "完了" : "未完了"}
試行: ${geolocateAttempted ? "完了" : "未完了"}${lightingInfo}

現在時間: ${currentTimeStr}
時間帯: ${timeOfDay}`
}

/**
 * 録音時間をフォーマット
 */
export function formatRecordedAt(date: Date): string {
   return date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
   })
}

