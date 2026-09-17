export const LAST_POSITION_STORAGE_KEY = "sonory_last_position"

const JAPAN_OVERVIEW = {
   center: [137.5, 37.5] as [number, number],
   zoom: 4.5,
   pitch: 0,
   bearing: 0,
}

export type InitialCamera = typeof JAPAN_OVERVIEW

/**
 * 地図を開いたときのカメラ位置を決める
 *
 * 現在地が取れるまでの仮の表示。最後にいた位置があればそこ、無ければ日本全体。
 * 特定の街を既定値にすると、そこにいると誤解させるため。
 *
 * @param saved - `localStorage` に保存された最後の位置（JSON 文字列）
 */
export function getInitialCamera(saved: string | null): InitialCamera {
   if (!saved) {
      return JAPAN_OVERVIEW
   }

   try {
      const parsed: unknown = JSON.parse(saved)
      if (
         typeof parsed === "object" &&
         parsed !== null &&
         "latitude" in parsed &&
         "longitude" in parsed &&
         typeof parsed.latitude === "number" &&
         typeof parsed.longitude === "number" &&
         Number.isFinite(parsed.latitude) &&
         Number.isFinite(parsed.longitude)
      ) {
         return {
            center: [parsed.longitude, parsed.latitude],
            zoom: 16,
            pitch: 45,
            bearing: -20,
         }
      }
   } catch {}

   return JAPAN_OVERVIEW
}
