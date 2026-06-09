import type { BrowserOptions, EdgeOptions, NodeOptions } from "@sentry/nextjs"

const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN

/**
 * Sentry が有効かどうかを判定する。
 *
 * @description
 * DSN 未設定時は SDK を初期化せず、ローカル開発への影響を避ける。
 */
export function isSentryEnabled(): boolean {
   return Boolean(sentryDsn)
}

/**
 * Sentry 共通オプションを返す。
 */
export function getSentryOptions(): BrowserOptions | NodeOptions | EdgeOptions {
   const isProduction = process.env.NODE_ENV === "production"

   return {
      dsn: sentryDsn,
      enabled: isSentryEnabled(),
      environment: process.env.NODE_ENV,
      tracesSampleRate: isProduction ? 0.1 : 1,
      sendDefaultPii: false,
   }
}
