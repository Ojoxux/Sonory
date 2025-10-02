import type { Context, Next } from "hono"
import type { Env } from "../index"
import { logger } from "../utils/logger"

/**
 * モニタリング・ログ基盤ミドルウェア
 *
 * @description
 * Cloudflare Workers環境でのログ・メトリクス・エラー追跡を提供
 * Phase 1: 基本的なログ機能を実装
 * Phase 2以降: Sentry連携やCloudflare Analytics統合を追加予定
 */

/**
 * エラー追跡ミドルウェア
 *
 * @description
 * 未処理のエラーをキャッチしてログに記録
 * 将来的にはSentryなどの外部サービスに送信
 */
export async function errorTracking(
   c: Context<{ Bindings: Env }>,
   next: Next,
): Promise<void> {
   try {
      await next()
   } catch (error) {
      // エラー情報を構造化してログ出力
      const errorDetails = {
         requestId: c.get("requestId"),
         method: c.req.method,
         path: c.req.path,
         error: error instanceof Error ? error.message : String(error),
         stack: error instanceof Error ? error.stack : undefined,
         timestamp: new Date().toISOString(),
         environment: c.env.ENVIRONMENT,
      }

      logger.error("Unhandled error occurred", errorDetails)

      // TODO Phase 2以降: Sentryに送信
      // if (c.env.SENTRY_DSN) {
      //   await sendToSentry(errorDetails)
      // }

      // エラーを再スロー（エラーハンドラーミドルウェアで処理）
      throw error
   }
}

/**
 * パフォーマンス計測ミドルウェア
 *
 * @description
 * リクエストの処理時間を計測してログに記録
 * Cloudflare Workers Analyticsでも自動的に記録される
 */
export async function performanceTracking(
   c: Context<{ Bindings: Env }>,
   next: Next,
): Promise<void> {
   const startTime = Date.now()

   await next()

   const duration = Date.now() - startTime
   const status = c.res.status

   // パフォーマンスメトリクスをログ出力
   logger.info("Request performance", {
      requestId: c.get("requestId"),
      method: c.req.method,
      path: c.req.path,
      status,
      duration,
      timestamp: new Date().toISOString(),
   })

   // 遅いリクエストを警告
   if (duration > 1000) {
      logger.warn("Slow request detected", {
         requestId: c.get("requestId"),
         method: c.req.method,
         path: c.req.path,
         duration,
      })
   }
}

/**
 * ヘルスチェック用のメトリクス収集
 *
 * @description
 * システムの健全性を示す基本的なメトリクスを返す
 */
export function getHealthMetrics(env: Env): {
   status: "healthy" | "degraded" | "unhealthy"
   environment: string
   timestamp: string
   uptime?: number
} {
   return {
      status: "healthy",
      environment: env.ENVIRONMENT,
      timestamp: new Date().toISOString(),
      // Workers環境ではuptimeは各リクエストで異なるため省略
   }
}

/**
 * ログレベルの設定
 *
 * @description
 * 環境に応じてログレベルを調整
 */
export function getLogLevel(env: Env): "debug" | "info" | "warn" | "error" {
   switch (env.ENVIRONMENT) {
      case "development":
         return "debug"
      case "production":
         return "info"
      default:
         return "info"
   }
}
