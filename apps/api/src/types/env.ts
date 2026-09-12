/**
 * Cloudflare Workers 環境変数の型定義。
 */
export interface Env {
   ENVIRONMENT: "development" | "production"
   CORS_ORIGIN?: string
   SUPABASE_URL: string
   SUPABASE_ANON_KEY: string
   SUPABASE_SERVICE_KEY?: string
   PYTHON_AUDIO_ANALYZER_URL: string
   PYTHON_AUDIO_ANALYZER_TIMEOUT: string
}

/**
 * Hono コンテキスト変数の型定義。
 *
 * 認証ミドルウェアが検証済みユーザーの UUID をここにセットする。
 */
export interface Variables {
   /** 認証済みユーザーのUUID。未認証時は undefined */
   userId?: string
}
