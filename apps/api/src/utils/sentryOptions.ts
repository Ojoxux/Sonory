import type { CloudflareOptions } from "@sentry/cloudflare"
import type { Env } from "../types/env"

/**
 * Workers 環境向け Sentry オプションを生成する。
 */
export function createSentryOptions(env: Env): CloudflareOptions {
   const isProduction = env.ENVIRONMENT === "production"

   return {
      dsn: env.SENTRY_DSN,
      enabled: Boolean(env.SENTRY_DSN),
      environment: env.ENVIRONMENT,
      tracesSampleRate: isProduction ? 0.1 : 1,
      sendDefaultPii: false,
   }
}
