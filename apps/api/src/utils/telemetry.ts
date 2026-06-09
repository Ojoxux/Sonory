import type { LogContext } from "@sonory/utils"

/**
 * Workers 向けのエラー転送先。
 *
 * @description
 * Phase 2: `@sentry/cloudflare` 導入後に実装を差し替える。
 */
export async function captureException(
   error: unknown,
   context?: LogContext,
): Promise<void> {
   // Sentry DSN 設定後:
   // import * as Sentry from "@sentry/cloudflare"
   // Sentry.captureException(error, { extra: context })
   void error
   void context
}

/**
 * 構造化メトリクスを Workers Analytics Engine へ送るためのプレースホルダー。
 */
export function recordMetric(
   name: string,
   value: number,
   tags?: LogContext,
): void {
   void name
   void value
   void tags
}
