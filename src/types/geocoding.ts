/**
 * 逆ジオコーディングAPI関連の型定義
 */

export interface ReverseGeocodingRequest {
  /** 緯度 */
  lat: number
  /** 経度 */
  lon: number
  /** 言語コード（デフォルト: en） */
  lang?: string
}

export interface ReverseGeocodingResponse {
  /** 緯度 */
  latitude: number
  /** 経度 */
  longitude: number
  /** 住所情報 */
  address: {
    city?: string
    town?: string
    village?: string
    county?: string
    state?: string
    country?: string
    [key: string]: string | undefined
  }
  /** 完全な住所表示名 */
  displayName: string
  /** 表示用の地域名 */
  locationName: string
}

export interface ReverseGeocodingError {
  /** エラーメッセージ */
  error: string
  /** 詳細なエラー情報 */
  details?: string
}
