import type { MiddlewareHandler } from 'hono'
import { cors } from 'hono/cors'

/**
 * CORS設定を環境に応じて返す
 * @param env - 環境変数
 * @returns CORSミドルウェア
 */
export const getCorsMiddleware = (env: {
  CORS_ORIGIN?: string
}): MiddlewareHandler => {
  const origin = env.CORS_ORIGIN || 'http://localhost:3000'

  return cors({
    origin: origin.split(','), // カンマ区切りで複数のオリジンを許可
    allowHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    exposeHeaders: ['X-Request-ID'],
    maxAge: 600,
    credentials: true,
  })
}
