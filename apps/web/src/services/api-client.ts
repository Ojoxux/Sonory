/**
 * API通信の抽象レイヤー
 *
 * fetchをラップし、テスト時にモック差し替えを可能にする
 */

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

async function handleResponse<T>(response: Response): Promise<T> {
   if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const message =
         (errorData as { message?: string }).message ??
         (errorData as { error?: { message?: string } }).error?.message ??
         `API error: ${response.status}`
      throw new ApiError(message, response.status)
   }
   return response.json() as Promise<T>
}

/**
 * デフォルトのAPIクライアント（fetch使用）
 */
export function createApiClient(
   fetchFn: typeof fetch = globalThis.fetch,
): ApiClient {
   return {
      get: async <T>(url: string): Promise<T> => {
         const response = await fetchFn(url)
         return handleResponse<T>(response)
      },
      post: async <T>(url: string, body: unknown): Promise<T> => {
         const response = await fetchFn(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
         })
         return handleResponse<T>(response)
      },
      postFormData: async <T>(url: string, formData: FormData): Promise<T> => {
         const response = await fetchFn(url, {
            method: "POST",
            body: formData,
         })
         return handleResponse<T>(response)
      },
      delete: async <T>(url: string): Promise<T> => {
         const response = await fetchFn(url, {
            method: "DELETE",
         })
         return handleResponse<T>(response)
      },
   }
}

/**
 * デフォルトのAPIクライアントインスタンス
 */
export const defaultApiClient: ApiClient = createApiClient()
