import type { LogContext } from "@sonory/utils"

/**
 * Sentry SDK が提供する最小インターフェース。
 *
 * @description
 * `@sentry/nextjs` 導入後に `window.Sentry` へバインドされる想定。
 */
interface SentryClient {
   addBreadcrumb(breadcrumb: {
      category: string
      message: string
      level?: "debug" | "info" | "warning" | "error"
      data?: Record<string, unknown>
   }): void
   captureException(
      error: unknown,
      context?: { extra?: Record<string, unknown> },
   ): void
   captureMessage(
      message: string,
      context?: {
         level?: "warning" | "error"
         extra?: Record<string, unknown>
      },
   ): void
}

declare global {
   interface Window {
      Sentry?: SentryClient
   }
}

function getSentryClient(): SentryClient | undefined {
   if (typeof window === "undefined") {
      return undefined
   }

   return window.Sentry
}

/**
 * Sentry 向けのブレッドクラム・エラー転送シンク。
 *
 * @description
 * DSN 未設定時は no-op。APM 導入後も呼び出し側の変更は不要。
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
      const sentry = getSentryClient()
      if (!sentry) {
         return
      }

      sentry.addBreadcrumb({
         category: namespace,
         message,
         level: level === "warning" ? "warning" : level,
         data: context,
      })
   }

   return {
      info: (message, context) => {
         toBreadcrumb("info", message, context)
      },
      warn: (message, context) => {
         toBreadcrumb("warning", message, context)
         getSentryClient()?.captureMessage(message, {
            level: "warning",
            extra: context,
         })
      },
      error: (message, context) => {
         toBreadcrumb("error", message, context)
         getSentryClient()?.captureMessage(message, {
            level: "error",
            extra: context,
         })
      },
   }
}
