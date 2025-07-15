import type {
   ReverseGeocodingError,
   ReverseGeocodingResponse,
} from "@/types/geocoding"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

/**
 * 逆ジオコーディングAPI Route
 *
 * @description 複数のフォールバック戦略による高速化
 * - 超積極的なキャッシュ戦略
 * - 短縮タイムアウト
 * - 複数APIのフォールバック
 * - 座標の粗い丸め処理でキャッシュヒット率最大化
 */

// メモリキャッシュ（開発環境用）
const memoryCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 48 * 60 * 60 * 1000
const REQUEST_TIMEOUT = 1500

/**
 * 座標を粗く丸めてキャッシュキーを生成（キャッシュヒット率最大化）
 */
function createCacheKey(lat: number, lon: number, lang: string): string {
   // 約500m精度で丸める（キャッシュヒット率を最大化）
   const roundedLat = Math.round(lat * 200) / 200
   const roundedLon = Math.round(lon * 200) / 200
   return `${roundedLat},${roundedLon},${lang}`
}

/**
 * 超高速タイムアウト付きfetch
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
   const controller = new AbortController()
   const timeoutId = setTimeout(() => controller.abort(), timeout)
   
   try {
      const response = await fetch(url, {
         ...options,
         signal: controller.signal,
      })
      return response
   } finally {
      clearTimeout(timeoutId)
   }
}

/**
 * 複数APIのフォールバック戦略
 */
async function fetchLocationData(latitude: number, longitude: number, lang: string): Promise<any> {
   // 1. OpenStreetMap Nominatim（メイン）
   try {
      const nominatimUrl = new URL("https://nominatim.openstreetmap.org/reverse")
      nominatimUrl.searchParams.set("format", "json")
      nominatimUrl.searchParams.set("lat", latitude.toString())
      nominatimUrl.searchParams.set("lon", longitude.toString())
      nominatimUrl.searchParams.set("accept-language", lang)
      nominatimUrl.searchParams.set("zoom", "10") // 詳細度を下げて高速化
      nominatimUrl.searchParams.set("addressdetails", "1")
      nominatimUrl.searchParams.set("extratags", "0")
      nominatimUrl.searchParams.set("namedetails", "0")

      const response = await fetchWithTimeout(nominatimUrl.toString(), {
         headers: {
            "User-Agent": "Sonory-App/1.0 (https://sonory.app)",
            "Accept": "application/json",
            "Accept-Encoding": "gzip, deflate, br",
         },
      }, REQUEST_TIMEOUT)

      if (response.ok) {
         return await response.json()
      }
   } catch (error) {
      console.warn("Nominatim API failed, trying fallback:", error)
   }

   // 2. フォールバック: BigDataCloud
   try {
      const bigDataCloudUrl = new URL("https://api.bigdatacloud.net/data/reverse-geocode-client")
      bigDataCloudUrl.searchParams.set("latitude", latitude.toString())
      bigDataCloudUrl.searchParams.set("longitude", longitude.toString())
      bigDataCloudUrl.searchParams.set("localityLanguage", lang)

      const response = await fetchWithTimeout(bigDataCloudUrl.toString(), {
         headers: {
            "Accept": "application/json",
            "Accept-Encoding": "gzip, deflate, br",
         },
      }, REQUEST_TIMEOUT)

      if (response.ok) {
         const data = await response.json()
         // Nominatim形式に変換
         return {
            address: {
               city: data.city || data.locality,
               town: data.locality,
               village: data.locality,
               county: data.principalSubdivision,
               state: data.principalSubdivision,
               country: data.countryName,
            },
            display_name: data.locality ? `${data.locality}, ${data.countryName}` : data.countryName,
         }
      }
   } catch (error) {
      console.warn("BigDataCloud API failed:", error)
   }

   // 3. フォールバック: 軽量な地域推定
   return {
      address: {
         country: "Unknown",
      },
      display_name: "Unknown Location",
   }
}

export async function GET(
   request: NextRequest,
): Promise<NextResponse<ReverseGeocodingResponse | ReverseGeocodingError>> {
   try {
      const { searchParams } = new URL(request.url)
      const lat = searchParams.get("lat")
      const lon = searchParams.get("lon")
      const lang = searchParams.get("lang") || "en"

      // パラメータの検証
      if (!lat || !lon) {
         return NextResponse.json(
            { error: "Missing required parameters: lat, lon" },
            { status: 400 },
         )
      }

      // 緯度・経度の範囲チェック
      const latitude = Number.parseFloat(lat)
      const longitude = Number.parseFloat(lon)

      if (
         Number.isNaN(latitude) ||
         Number.isNaN(longitude) ||
         latitude < -90 ||
         latitude > 90 ||
         longitude < -180 ||
         longitude > 180
      ) {
         return NextResponse.json(
            { error: "Invalid latitude or longitude values" },
            { status: 400 },
         )
      }

      // キャッシュキーを生成
      const cacheKey = createCacheKey(latitude, longitude, lang)
      const now = Date.now()

      // メモリキャッシュをチェック
      const cached = memoryCache.get(cacheKey)
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
         return NextResponse.json(cached.data, {
         headers: {
               "Cache-Control": "public, s-maxage=172800, stale-while-revalidate=345600", // 48時間キャッシュ
               "X-Cache": "HIT",
               "X-Cache-Key": cacheKey,
         },
      })
      }

      // APIから取得
      const data = await fetchLocationData(latitude, longitude, lang)

      // レスポンスデータの構造化
      const result = {
         latitude,
         longitude,
         address: data.address || {},
         displayName: data.display_name || "",
         // 地域名の優先順位: city > town > village > county > state
         locationName:
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county ||
            data.address?.state ||
            data.address?.country ||
            "Unknown Location",
      }

      // メモリキャッシュに保存
      memoryCache.set(cacheKey, { data: result, timestamp: now })

      // 古いキャッシュエントリを削除（メモリ管理）
      if (memoryCache.size > 2000) { // キャッシュサイズを拡大
         const entries = Array.from(memoryCache.entries())
         const oldEntries = entries.filter(([, value]) => (now - value.timestamp) > CACHE_DURATION)
         for (const [key] of oldEntries) {
            memoryCache.delete(key)
         }
      }

      // 積極的なキャッシュヘッダーを設定
      return NextResponse.json(result, {
         headers: {
            "Cache-Control": "public, s-maxage=172800, stale-while-revalidate=345600",
            "X-Cache": "MISS",
            "X-Cache-Key": cacheKey,
         },
      })
   } catch (error) {
      console.error("Reverse geocoding error:", error)

      // タイムアウトエラーの場合はフォールバック
      if (error instanceof Error && error.name === 'AbortError') {
         return NextResponse.json(
            {
               latitude: Number.parseFloat(request.nextUrl.searchParams.get("lat") || "0"),
               longitude: Number.parseFloat(request.nextUrl.searchParams.get("lon") || "0"),
               address: {},
               displayName: "Location",
               locationName: "Unknown Location",
            },
            { 
               status: 200,
               headers: {
                  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200", // 1時間キャッシュ
                  "X-Cache": "TIMEOUT-FALLBACK",
               },
            }
         )
      }

      return NextResponse.json(
         {
            error: "Failed to fetch location data",
            details: error instanceof Error ? error.message : "Unknown error",
         },
         { status: 500 },
      )
   }
}

// Edge Runtimeで高速化
export const runtime = "edge"
export const dynamic = "force-dynamic"
