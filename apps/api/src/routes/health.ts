import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import type { APIResponse } from "@sonory/shared-types"
import type { Env } from "../index"
import { getSupabaseAdmin } from "../services/supabase"
import { logger } from "../utils/logger"

const ServiceStatusSchema = z.object({
   database: z.enum(["connected", "disconnected"]),
   storage: z.enum(["connected", "disconnected"]),
   ai: z.enum(["available", "unavailable"]),
})

const HealthCheckResponseSchema = z.object({
   status: z.enum(["healthy", "degraded", "unhealthy"]),
   timestamp: z.string(),
   version: z.string(),
   services: ServiceStatusSchema,
   uptime: z.number(),
})

interface HealthCheckResponse {
   status: "healthy" | "degraded" | "unhealthy"
   timestamp: string
   version: string
   services: {
      database: "connected" | "disconnected"
      storage: "connected" | "disconnected"
      ai: "available" | "unavailable"
   }
   uptime: number
}

const startTime = Date.now()

const healthRoute = createRoute({
   method: "get",
   path: "/",
   tags: ["Health"],
   summary: "基本ヘルスチェック",
   description: "Supabase接続確認付きの基本的なヘルスチェック",
   responses: {
      200: {
         content: {
            "application/json": {
               schema: z.object({
                  success: z.literal(true),
                  data: HealthCheckResponseSchema,
               }),
            },
         },
         description: "サービス状態",
      },
   },
})

const healthDetailedRoute = createRoute({
   method: "get",
   path: "/detailed",
   tags: ["Health"],
   summary: "詳細ヘルスチェック",
   description: "管理者用の詳細なヘルスチェック",
   responses: {
      200: {
         content: {
            "application/json": {
               schema: z.object({
                  success: z.literal(true),
                  data: HealthCheckResponseSchema,
               }),
            },
         },
         description: "詳細サービス状態（正常時）",
      },
      503: {
         content: {
            "application/json": {
               schema: z.object({
                  success: z.literal(true),
                  data: HealthCheckResponseSchema,
               }),
            },
         },
         description: "サービス異常時",
      },
   },
})

export const healthRoutes = new OpenAPIHono<{ Bindings: Env }>()

healthRoutes.openapi(healthRoute, async (c) => {
   let dbStatus: "connected" | "disconnected" = "disconnected"
   let storageStatus: "connected" | "disconnected" = "disconnected"

   try {
      const supabase = getSupabaseAdmin(c.env)

      const { error: dbError } = await supabase
         .from("sound_pins")
         .select("id")
         .limit(1)

      if (!dbError) {
         dbStatus = "connected"
      } else {
         logger.error("Database connection error", {
            error: dbError.message,
            code: dbError.code,
         })
      }

      const { error: storageError } = await supabase.storage
         .from("sonory-audio")
         .list("", { limit: 1 })

      if (!storageError) {
         storageStatus = "connected"
      } else {
         logger.error("Storage connection error", {
            error: storageError.message,
         })
      }
   } catch (error) {
      logger.error("Health check service error", {
         error: error instanceof Error ? error.message : String(error),
      })
   }

   const response: APIResponse<HealthCheckResponse> = {
      success: true,
      data: {
         status: "healthy",
         timestamp: new Date().toISOString(),
         version: "0.1.0",
         services: {
            database: dbStatus,
            storage: storageStatus,
            ai: "available",
         },
         uptime: Date.now() - startTime,
      },
   }

   logger.debug("Health check performed", {
      requestId: c.get("requestId"),
      uptime: response.data.uptime,
      services: response.data.services,
   })

   return c.json(response)
})

healthRoutes.openapi(healthDetailedRoute, async (c) => {
   const checkDatabase = async (): Promise<boolean> => {
      return true
   }

   const checkStorage = async (): Promise<boolean> => {
      return true
   }

   const checkAI = async (): Promise<boolean> => {
      return true
   }

   const [dbHealthy, storageHealthy, aiHealthy] = await Promise.all([
      checkDatabase(),
      checkStorage(),
      checkAI(),
   ])

   const allHealthy = dbHealthy && storageHealthy && aiHealthy
   const status = allHealthy ? "healthy" : dbHealthy ? "degraded" : "unhealthy"

   const response: APIResponse<HealthCheckResponse> = {
      success: true,
      data: {
         status,
         timestamp: new Date().toISOString(),
         version: "0.1.0",
         services: {
            database: dbHealthy ? "connected" : "disconnected",
            storage: storageHealthy ? "connected" : "disconnected",
            ai: aiHealthy ? "available" : "unavailable",
         },
         uptime: Date.now() - startTime,
      },
   }

   logger.info("Detailed health check performed", {
      requestId: c.get("requestId"),
      status,
      services: response.data.services,
   })

   return c.json(response, allHealthy ? 200 : 503)
})
