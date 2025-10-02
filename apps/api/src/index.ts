import { Hono } from "hono"
import { logger as honoLogger } from "hono/logger"
import { requestId } from "hono/request-id"
import { timing } from "hono/timing"
import { getCorsMiddleware } from "./middleware/cors"
import { errorHandler } from "./middleware/error"
import audioRoutes from "./routes/audio"
import { healthRoutes } from "./routes/health"
import pinsRoutes from "./routes/pins"
import { logger } from "./utils/logger"

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
   async fetch(request: Request, env: Env, ctx: ExecutionContext) {
      return app.fetch(request, env, ctx)
   },
   async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
      const environment = env.ENVIRONMENT ?? "production"

      if (environment === "development") {
         logger.debug("Scheduled queue processing skipped", {
            environment,
         })
         return
      }

      const request = new Request(
         "https://scheduled.sonory.internal/api/audio/internal/process-queue",
         {
            method: "POST",
            headers: {
               "x-sonory-scheduled": "true",
               "x-sonory-cron": event.cron ?? "",
               "x-sonory-scheduled-time": new Date(
                  event.scheduledTime,
               ).toISOString(),
            },
         },
      )

      ctx.waitUntil(
         (async () => {
            try {
               const response = await app.fetch(request, env, ctx)

               if (!response.ok) {
                  const errorBody = await response
                     .text()
                     .catch(() => "<unavailable>")

                  logger.error("Scheduled queue processing failed", {
                     environment,
                     status: response.status,
                     errorBody,
                  })
                  return
               }

               const result = (await response.json().catch(() => null)) as {
                  data?: {
                     processedCount?: number
                  }
               } | null
               const processedCount = result?.data?.processedCount

               logger.info("Scheduled queue processing completed", {
                  environment,
                  processedCount,
               })
            } catch (error) {
               logger.error("Scheduled queue processing threw an error", {
                  environment,
                  error:
                     error instanceof Error
                        ? {
                             message: error.message,
                             stack: error.stack,
                          }
                        : String(error),
               })
            }
         })(),
      )
   },
}
