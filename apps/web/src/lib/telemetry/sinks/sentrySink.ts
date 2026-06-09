import * as Sentry from "@sentry/nextjs"
import type { LogContext } from "@sonory/utils"

/**
 * Sentry 向けのブレッドクラム・エラー転送シンク。
 *
 * @description
 * DSN 未設定時は SDK 側で no-op になる。
 */
export function createSentrySink(namespace: string): {
   info(message: string, context?: LogContext): void
   warn(message: string, context?: LogContext): void
   error(message: string, context?: LogContext): void
} {
   const toBreadcrumb = (
      level: "info" | "warning" | "error",
      message: string,
      context?: LogContext,
   ): void => {
      Sentry.addBreadcrumb({
         category: namespace,
         message,
         level,
         data: context,
      })
   }

   return {
      info: (message, context) => {
         toBreadcrumb("info", message, context)
      },
      warn: (message, context) => {
         toBreadcrumb("warning", message, context)
         Sentry.captureMessage(message, {
            level: "warning",
            extra: context,
         })
      },
      error: (message, context) => {
         toBreadcrumb("error", message, context)
         Sentry.captureMessage(message, {
            level: "error",
            extra: context,
         })
      },
   }
}
