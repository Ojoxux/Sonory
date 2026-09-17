/**
 * API通信の抽象レイヤー
 *
 * fetch をラップし、テスト時にモック差し替えを可能にする。
 * Supabase の匿名セッションのアクセストークンを Authorization ヘッダーとして
 * 全リクエストに付与し、401 のときだけ再認証して1回リトライする。
 */

import { getAccessToken, reauthenticate } from "./supabase"

/** リクエスト設定。headers は Headers インスタンスだと展開できないため object に限定する */
type RequestConfig = RequestInit & { headers?: Record<string, string> }

/**
 * APIクライアントインターフェース
 */
export interface ApiClient {
   readonly get: <T>(url: string) => Promise<T>
   readonly post: <T>(url: string, body: unknown) => Promise<T>
   readonly postFormData: <T>(url: string, formData: FormData) => Promise<T>
   readonly delete: <T>(url: string) => Promise<T>
}

/**
 * APIレスポンスのパースエラー
 */
class ApiError extends Error {
   constructor(
      message: string,
      readonly status: number,
   ) {
      super(message)
      this.name = "ApiError"
   }
}

/**
 * トークンを取得する。環境変数が未設定でも例外にせず null を返す
 *
 * 未認証でも地図の閲覧は成立する（API 側が optionalAuth）ため、
 * 設定不備で閲覧機能まで巻き込んで落とさない。書き込み系は API が 401 を返す。
 */
async function tokenOrNull(
   source: () => Promise<string | null>,
): Promise<string | null> {
   try {
      return await source()
   } catch {
      return null
   }
}

/**
 * 認証付きで fetch し、401 のときだけ再認証して1回だけリトライする
 */
async function fetchWithAuth(
   fetchFn: typeof fetch,
   url: string,
   config: RequestConfig = {},
): Promise<Response> {
   const send = (token: string | null): Promise<Response> =>
      fetchFn(url, {
         ...config,
         headers: token
            ? { ...config.headers, Authorization: `Bearer ${token}` }
            : config.headers,
      })

   const response = await send(await tokenOrNull(getAccessToken))

   if (response.status !== 401) {
      return response
   }

   const refreshed = await tokenOrNull(reauthenticate)
   return refreshed ? send(refreshed) : response
}

/**
 * レスポンスを検証して JSON を返す
 *
 * @throws APIがエラーを返した場合に `ApiError`
 */
async function handleResponse<T>(response: Response): Promise<T> {
   if (!response.ok) {
      const rawBody = await response.text()
      let errorData: unknown = {}

      if (rawBody) {
         try {
            errorData = JSON.parse(rawBody) as unknown
         } catch {
            throw new ApiError(rawBody, response.status)
         }
      }

      const parsed = errorData as {
         message?: string
         error?: { message?: string }
      }
      const message =
         parsed.message ??
         parsed.error?.message ??
         `API error: ${response.status}`

      throw new ApiError(message, response.status)
   }
   return response.json() as Promise<T>
}

/**
 * デフォルトのAPIクライアント（fetch使用）
 *
 * @param fetchFn - 差し替え可能な fetch 実装（テスト用）
 */
export function createApiClient(
   fetchFn: typeof fetch = globalThis.fetch,
): ApiClient {
   return {
      get: async <T>(url: string): Promise<T> =>
         handleResponse<T>(await fetchWithAuth(fetchFn, url)),

      post: async <T>(url: string, body: unknown): Promise<T> =>
         handleResponse<T>(
            await fetchWithAuth(fetchFn, url, {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify(body),
            }),
         ),

      // Content-Type は指定しない。multipart の boundary が壊れる
      postFormData: async <T>(url: string, formData: FormData): Promise<T> =>
         handleResponse<T>(
            await fetchWithAuth(fetchFn, url, {
               method: "POST",
               body: formData,
            }),
         ),

      delete: async <T>(url: string): Promise<T> =>
         handleResponse<T>(
            await fetchWithAuth(fetchFn, url, { method: "DELETE" }),
         ),
   }
}

/**
 * デフォルトのAPIクライアントインスタンス
 */
export const defaultApiClient: ApiClient = createApiClient()
