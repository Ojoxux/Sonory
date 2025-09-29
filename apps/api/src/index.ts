import { Hono } from "hono"
import { logger as honoLogger } from "hono/logger"
import { requestId } from "hono/request-id"
import { timing } from "hono/timing"
import { getSecureSupabaseConfig } from "./config/secrets"
import { getCorsMiddleware } from "./middleware/cors"
import { errorHandler } from "./middleware/error"
import audioRoutes from "./routes/audio"
import { healthRoutes } from "./routes/health"
import pinsRoutes from "./routes/pins"
import { logger } from "./utils/logger"

// Node.js環境での環境変数設定（Docker環境用）
if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
   // Docker環境では強制的にpython-apiコンテナを使用
   if (
      !process.env.PYTHON_AUDIO_ANALYZER_URL ||
      process.env.PYTHON_AUDIO_ANALYZER_URL.includes("localhost")
   ) {
      process.env.PYTHON_AUDIO_ANALYZER_URL = "http://python-api:8000"
   }
   process.env.PYTHON_AUDIO_ANALYZER_TIMEOUT =
      process.env.PYTHON_AUDIO_ANALYZER_TIMEOUT || "30000"

   // デバッグ出力
   console.log("🔧 Environment Variables (Docker override):")
   console.log(
      "  PYTHON_AUDIO_ANALYZER_URL:",
      process.env.PYTHON_AUDIO_ANALYZER_URL,
   )
   console.log(
      "  PYTHON_AUDIO_ANALYZER_TIMEOUT:",
      process.env.PYTHON_AUDIO_ANALYZER_TIMEOUT,
   )
}

/**
 * Cloudflare Workers環境変数の型定義
 */
export interface Env {
   // 環境変数
   ENVIRONMENT: "development" | "production"
   CORS_ORIGIN?: string

   // Supabase
   SUPABASE_URL: string
   SUPABASE_ANON_KEY: string
   SUPABASE_SERVICE_KEY?: string

   // Python Audio Analyzer（YAMNet使用）
   PYTHON_AUDIO_ANALYZER_URL: string
   PYTHON_AUDIO_ANALYZER_TIMEOUT: string

   // KVネームスペース（将来使用）
   // CACHE: KVNamespace

   // R2バケット（将来使用）
   // AUDIO_STORAGE: R2Bucket

   // Durable Objects（将来使用）
   // RATE_LIMITER: DurableObjectNamespace
}

/**
 * Honoアプリケーションの初期化
 */
const app = new Hono<{ Bindings: Env }>()

// グローバルミドルウェア
app.use("*", requestId())
app.use("*", timing())
app.use("*", honoLogger())

// Node.js環境でのenv設定
app.use("*", async (c, next) => {
   if (typeof process !== "undefined") {
      // Docker Secretsを使用してセキュアに設定を取得
      try {
         const supabaseConfig = getSecureSupabaseConfig()

         c.env = {
            ENVIRONMENT:
               (process.env.ENVIRONMENT as "development" | "production") ||
               "development",
            CORS_ORIGIN: process.env.CORS_ORIGIN,
            SUPABASE_URL: supabaseConfig.url,
            SUPABASE_ANON_KEY: supabaseConfig.anonKey,
            SUPABASE_SERVICE_KEY: supabaseConfig.serviceKey,
            PYTHON_AUDIO_ANALYZER_URL:
               process.env.PYTHON_AUDIO_ANALYZER_URL || "",
            PYTHON_AUDIO_ANALYZER_TIMEOUT:
               process.env.PYTHON_AUDIO_ANALYZER_TIMEOUT || "30000",
         } as Env
      } catch (error) {
         // セキュア設定の取得に失敗した場合はエラーログを出力
         console.error("❌ Failed to load secure configuration:", error)
         // フォールバック: 環境変数から直接読み取り（警告付き）
         console.warn(
            "⚠️ Falling back to environment variables - this is not secure for production",
         )
         c.env = {
            ENVIRONMENT:
               (process.env.ENVIRONMENT as "development" | "production") ||
               "development",
            CORS_ORIGIN: process.env.CORS_ORIGIN,
            SUPABASE_URL: process.env.SUPABASE_URL || "",
            SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || "",
            SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
            PYTHON_AUDIO_ANALYZER_URL:
               process.env.PYTHON_AUDIO_ANALYZER_URL || "",
            PYTHON_AUDIO_ANALYZER_TIMEOUT:
               process.env.PYTHON_AUDIO_ANALYZER_TIMEOUT || "30000",
         } as Env
      }
   }
   await next()
})

app.use("*", errorHandler)

// CORS設定（環境変数から取得）
app.use("*", async (c, next) => {
   const corsMiddleware = getCorsMiddleware(c.env)
   return corsMiddleware(c, next)
})

// リクエストログ
app.use("*", async (c, next) => {
   const start = Date.now()
   const method = c.req.method
   const url = new URL(c.req.url)

   logger.info("Request received", {
      requestId: c.get("requestId"),
      method,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      userAgent: c.req.header("user-agent"),
   })

   await next()

   const duration = Date.now() - start
   const status = c.res.status

   logger.info("Request completed", {
      requestId: c.get("requestId"),
      method,
      path: url.pathname,
      status,
      duration,
   })
})

/**
 * ルートハンドラー
 */
app.get("/", (c) => {
   return c.json({
      success: true,
      data: {
         name: "Sonory API",
         version: "0.1.0",
         environment: c.env.ENVIRONMENT,
         timestamp: new Date().toISOString(),
      },
   })
})

// APIルート
app.route("/api/health", healthRoutes)
app.route("/api/audio", audioRoutes)
app.route("/api/pins", pinsRoutes)

// 404ハンドラー
app.notFound((c) => {
   return c.json(
      {
         success: false,
         error: {
            code: "NOT_FOUND",
            message: "The requested resource was not found",
            timestamp: new Date().toISOString(),
            requestId: c.get("requestId"),
         },
      },
      404,
   )
})

/**
 * Cloudflare Workersエクスポート
 */
export default {
   fetch: app.fetch,
}

/**
 * Node.js環境での起動
 */
if (typeof process !== "undefined" && process.env.NODE_ENV !== "test") {
   const { serve } = await import("@hono/node-server")

   const port = Number(process.env.PORT) || 8787
   console.log(`🚀 Server is running on http://localhost:${port}`)

   serve({
      fetch: app.fetch,
      port,
   })
}
