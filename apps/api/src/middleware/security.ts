import type { AppMiddleware } from '@/types/api'

/**
 * セキュリティヘッダーミドルウェア
 * @description 基本的なセキュリティヘッダーを設定
 */
export const securityHeaders: AppMiddleware = async (c, next) => {
  // セキュリティヘッダーを設定
  c.header('X-Content-Type-Options', 'nosniff')
  c.header('X-Frame-Options', 'DENY')
  c.header('X-XSS-Protection', '1; mode=block')
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
  c.header('Permissions-Policy', 'geolocation=(self), microphone=(self)')

  // 開発環境以外ではHSTSを有効化
  if (c.env.ENVIRONMENT !== 'development') {
    c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  await next()
}
