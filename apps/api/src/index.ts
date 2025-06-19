import { getCorsMiddleware } from '@/middleware/cors'
import { errorHandler } from '@/middleware/error'
import { healthRoutes } from '@/routes/health'
import { logger } from '@/utils/logger'
import { Hono } from 'hono'
import { logger as honoLogger } from 'hono/logger'
import { requestId } from 'hono/request-id'
import { timing } from 'hono/timing'

/**
 * Cloudflare Workers環境変数の型定義
 */
export interface Env {
   // 環境変数
   ENVIRONMENT: 'development' | 'production'
   CORS_ORIGIN?: string

   // Supabase
   SUPABASE_URL: string
   SUPABASE_ANON_KEY: string
   SUPABASE_SERVICE_KEY: string

   // OpenAI
   OPENAI_API_KEY: string

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
app.use('*', requestId())
app.use('*', timing())
app.use('*', honoLogger())
app.use('*', errorHandler)

// CORS設定（環境変数から取得）
app.use('*', async (c, next) => {
   const corsMiddleware = getCorsMiddleware(c.env)
   return corsMiddleware(c, next)
})

// リクエストログ
app.use('*', async (c, next) => {
   const start = Date.now()
   const method = c.req.method
   const url = new URL(c.req.url)

   logger.info('Request received', {
      requestId: c.get('requestId'),
      method,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      userAgent: c.req.header('user-agent'),
   })

   await next()

   const duration = Date.now() - start
   const status = c.res.status

   logger.info('Request completed', {
      requestId: c.get('requestId'),
      method,
      path: url.pathname,
      status,
      duration,
   })
})

/**
 * ルートハンドラー
 */
app.get('/', (c) => {
   return c.json({
      success: true,
      data: {
         name: 'Sonory API',
         version: '0.1.0',
         environment: c.env.ENVIRONMENT,
         timestamp: new Date().toISOString(),
      },
   })
})

// APIルート
app.route('/api/health', healthRoutes)

// 404ハンドラー
app.notFound((c) => {
   return c.json(
      {
         success: false,
         error: {
            code: 'NOT_FOUND',
            message: 'The requested resource was not found',
            timestamp: new Date().toISOString(),
            requestId: c.get('requestId'),
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
