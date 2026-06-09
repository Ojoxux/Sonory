import * as Sentry from "@sentry/nextjs"

/**
 * Next.js サーバー・Edge ランタイム向け Sentry 登録フック。
 */
export async function register(): Promise<void> {
   if (process.env.NEXT_RUNTIME === "nodejs") {
      await import("./sentry.server.config")
   }

   if (process.env.NEXT_RUNTIME === "edge") {
      await import("./sentry.edge.config")
   }
}

export const onRequestError = Sentry.captureRequestError
