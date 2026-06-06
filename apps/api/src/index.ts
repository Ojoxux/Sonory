import { app } from "./app"
import type { Env } from "./types/env"
import { logger } from "./utils/logger"

export type { Env } from "./types/env"

/**
 * Cloudflare Workers エクスポート。
 */
export default {
   async fetch(request: Request, env: Env, ctx: ExecutionContext) {
      return app.fetch(request, env, ctx)
   },
   async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
      const environment = env.ENVIRONMENT ?? "production"

      if (environment === "development") {
         logger.debug("Scheduled queue processing skipped", {
            environment,
         })
         return
      }

      const request = new Request(
         "https://scheduled.sonory.internal/api/audio/internal/process-queue",
         {
            method: "POST",
            headers: {
               "x-sonory-scheduled": "true",
               "x-sonory-cron": event.cron ?? "",
               "x-sonory-scheduled-time": new Date(
                  event.scheduledTime,
               ).toISOString(),
            },
         },
      )

      ctx.waitUntil(
         (async () => {
            try {
               const response = await app.fetch(request, env, ctx)

               if (!response.ok) {
                  const errorBody = await response
                     .text()
                     .catch(() => "<unavailable>")

                  logger.error("Scheduled queue processing failed", {
                     environment,
                     status: response.status,
                     errorBody,
                  })
                  return
               }

               const result = (await response.json().catch(() => null)) as {
                  data?: {
                     processedCount?: number
                  }
               } | null
               const processedCount = result?.data?.processedCount

               logger.info("Scheduled queue processing completed", {
                  environment,
                  processedCount,
               })
            } catch (error) {
               logger.error("Scheduled queue processing threw an error", {
                  environment,
                  error:
                     error instanceof Error
                        ? {
                             message: error.message,
                             stack: error.stack,
                          }
                        : String(error),
               })
            }
         })(),
      )
   },
}
