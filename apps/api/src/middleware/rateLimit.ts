import { APIException, ERROR_CODES } from '@/middleware/error'
import type { AppContext, AppMiddleware } from '@/types/api'

/**
 * レート制限設定
 */
interface RateLimitConfig {
   windowMs: number // 時間窓（ミリ秒）
   max: number // 最大リクエスト数
   keyGenerator?: (c: AppContext) => string // レート制限のキー生成
}

/**
 * メモリベースのレート制限ストア
 * 本番環境ではKVやDurable Objectsを使用すべき
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

/**
 * レート制限ミドルウェア
 * @description IPアドレスベースでリクエストを制限
 */
export const rateLimit = (config: RateLimitConfig): AppMiddleware => {
   const {
      windowMs = 60 * 1000, // デフォルト: 1分
      max = 100, // デフォルト: 100リクエスト
      keyGenerator = (c) => c.req.header('cf-connecting-ip') || 'unknown',
   } = config

   return async (c, next) => {
      const key = keyGenerator(c)
      const now = Date.now()

      // 既存のレート制限情報を取得
      let limitInfo = rateLimitStore.get(key)

      // 期限切れまたは新規の場合はリセット
      if (!limitInfo || limitInfo.resetAt <= now) {
         limitInfo = {
            count: 0,
            resetAt: now + windowMs,
         }
      }

      // リクエスト数をインクリメント
      limitInfo.count++

      // レート制限チェック
      if (limitInfo.count > max) {
         const retryAfter = Math.ceil((limitInfo.resetAt - now) / 1000)

         c.header('X-RateLimit-Limit', max.toString())
         c.header('X-RateLimit-Remaining', '0')
         c.header(
            'X-RateLimit-Reset',
            new Date(limitInfo.resetAt).toISOString(),
         )
         c.header('Retry-After', retryAfter.toString())

         throw new APIException(
            ERROR_CODES.RATE_LIMIT_EXCEEDED,
            `Rate limit exceeded. Please retry after ${retryAfter} seconds.`,
            429,
         )
      }

      // レート制限情報を保存
      rateLimitStore.set(key, limitInfo)

      // レート制限ヘッダーを設定
      c.header('X-RateLimit-Limit', max.toString())
      c.header('X-RateLimit-Remaining', (max - limitInfo.count).toString())
      c.header('X-RateLimit-Reset', new Date(limitInfo.resetAt).toISOString())

      await next()
   }
}

/**
 * エンドポイント別のレート制限設定
 */
export const rateLimits = {
   // 音声アップロード: 5リクエスト/分
   audioUpload: rateLimit({ windowMs: 60 * 1000, max: 5 }),

   // ピン取得: 100リクエスト/分
   getPins: rateLimit({ windowMs: 60 * 1000, max: 100 }),

   // ピン作成: 20リクエスト/分
   createPin: rateLimit({ windowMs: 60 * 1000, max: 20 }),

   // デフォルト: 60リクエスト/分
   default: rateLimit({ windowMs: 60 * 1000, max: 60 }),
}
