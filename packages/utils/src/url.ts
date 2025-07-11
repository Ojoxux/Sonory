/**
 * URLとパスを適切に結合するユーティリティ関数
 * 
 * @param baseUrl - ベースURL（末尾にスラッシュがあってもなくても対応）
 * @param path - 結合するパス（先頭にスラッシュがあってもなくても対応）
 * @returns 適切に結合されたURL
 * 
 * @example
 * ```typescript
 * joinUrl('http://localhost:8000/', '/api/v1/analyze')
 * // => 'http://localhost:8000/api/v1/analyze'
 * 
 * joinUrl('http://localhost:8000', 'api/v1/analyze')
 * // => 'http://localhost:8000/api/v1/analyze'
 * 
 * joinUrl('http://localhost:8000///', '///api/v1/analyze///')
 * // => 'http://localhost:8000/api/v1/analyze///'
 * ```
 */
export function joinUrl(baseUrl: string, path: string): string {
   // ベースURLの末尾の連続するスラッシュを除去
   const cleanBaseUrl = baseUrl.replace(/\/+$/, '')
   // パスの先頭のスラッシュを確保（連続スラッシュは1つに正規化）
   const cleanPath = path.replace(/^\/+/, '/').startsWith('/') ? path.replace(/^\/+/, '/') : `/${path}`
   
   return `${cleanBaseUrl}${cleanPath}`
}

/**
 * URLが有効かどうかを検証する
 * 
 * @param url - 検証対象のURL
 * @returns URLが有効な場合はtrue
 */
export function isValidUrl(url: string): boolean {
   try {
      new URL(url)
      return true
   } catch {
      return false
   }
}

/**
 * URLからクエリパラメータを抽出する
 * 
 * @param url - 対象のURL
 * @returns クエリパラメータのオブジェクト
 */
export function extractQueryParams(url: string): Record<string, string> {
   try {
      const urlObj = new URL(url)
      const params: Record<string, string> = {}
      
      for (const [key, value] of urlObj.searchParams) {
         params[key] = value
      }
      
      return params
   } catch {
      return {}
   }
} 