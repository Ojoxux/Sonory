import * as Sentry from "@sentry/cloudflare"
import type { LogContext } from "@sonory/utils"

/**
 * Workers 向けのエラー転送。
 */
export async function captureException(
   error: unknown,
   context?: LogContext,
): Promise<void> {
   if (context === undefined) {
      Sentry.captureException(error)
      return
   }

   Sentry.captureException(error, { extra: { ...context } })
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
