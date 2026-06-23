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
   /** Sentry DSN（`wrangler secret put SENTRY_DSN` で設定） */
   SENTRY_DSN?: string
}
