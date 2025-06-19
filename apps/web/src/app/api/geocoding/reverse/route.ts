import type {
   ReverseGeocodingError,
   ReverseGeocodingResponse,
} from '@/types/geocoding'
import { NextRequest, NextResponse } from 'next/server'

/**
 * 逆ジオコーディングAPI Route
 *
 * @description OpenStreetMap Nominatim APIへのプロキシとして機能し、
 * CORSエラーを回避しながら座標から住所情報を取得します。
 */

export async function GET(
   request: NextRequest,
): Promise<NextResponse<ReverseGeocodingResponse | ReverseGeocodingError>> {
   try {
      const { searchParams } = new URL(request.url)
      const lat = searchParams.get('lat')
      const lon = searchParams.get('lon')
      const lang = searchParams.get('lang') || 'en'

      // パラメータの検証
      if (!lat || !lon) {
         return NextResponse.json(
            { error: 'Missing required parameters: lat, lon' },
            { status: 400 },
         )
      }

      // 緯度・経度の範囲チェック
      const latitude = parseFloat(lat)
      const longitude = parseFloat(lon)

      if (
         isNaN(latitude) ||
         isNaN(longitude) ||
         latitude < -90 ||
         latitude > 90 ||
         longitude < -180 ||
         longitude > 180
      ) {
         return NextResponse.json(
            { error: 'Invalid latitude or longitude values' },
            { status: 400 },
         )
      }

      // OpenStreetMap Nominatim APIを呼び出し
      const nominatimUrl = new URL(
         'https://nominatim.openstreetmap.org/reverse',
      )
      nominatimUrl.searchParams.set('format', 'json')
      nominatimUrl.searchParams.set('lat', lat)
      nominatimUrl.searchParams.set('lon', lon)
      nominatimUrl.searchParams.set('accept-language', lang)
      nominatimUrl.searchParams.set('zoom', '10') // 市区町村レベルの詳細度

      const response = await fetch(nominatimUrl.toString(), {
         headers: {
            'User-Agent': 'Sonory-App/1.0 (https://sonory.app)', // 適切なUser-Agentを設定
         },
      })

      if (!response.ok) {
         throw new Error(`Nominatim API error: ${response.status}`)
      }

      const data = await response.json()

      // レスポンスデータの構造化
      const result = {
         latitude,
         longitude,
         address: data.address || {},
         displayName: data.display_name || '',
         // 地域名の優先順位: city > town > village > county > state
         locationName:
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county ||
            data.address?.state ||
            data.address?.country ||
            'Unknown Location',
      }

      // キャッシュヘッダーを設定（1時間キャッシュ）
      return NextResponse.json(result, {
         headers: {
            'Cache-Control':
               'public, s-maxage=3600, stale-while-revalidate=86400',
         },
      })
   } catch (error) {
      console.error('Reverse geocoding error:', error)

      return NextResponse.json(
         {
            error: 'Failed to fetch location data',
            details: error instanceof Error ? error.message : 'Unknown error',
         },
         { status: 500 },
      )
   }
}

// レート制限のためのオプション設定
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
