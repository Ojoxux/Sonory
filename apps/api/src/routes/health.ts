import type { APIResponse } from "@sonory/shared-types"
import { Hono } from "hono"
import type { Env } from "../index"
import { getSupabaseAdmin } from "../services/supabase"
import { logger } from "../utils/logger"

interface HealthCheckResponse {
   status: "healthy" | "degraded" | "unhealthy" // healthy: 正常, degraded: 警告, unhealthy: 異常
   timestamp: string
   version: string
   services: {
      database: "connected" | "disconnected" // connected: 接続済み, disconnected: 未接続
      storage: "connected" | "disconnected" // connected: 接続済み, disconnected: 未接続
      ai: "available" | "unavailable" // available: 利用可能, unavailable: 利用不可
   }
   uptime: number
}

// 起動時刻を記録
const startTime = Date.now()

/**
 * ヘルスチェックルート
 * @description システムの健全性を確認するエンドポイント
 */
export const healthRoutes = new Hono<{ Bindings: Env }>()

/**
 * GET /health
 * @description 基本的なヘルスチェック（実際のSupabase接続確認付き）
 */
healthRoutes.get("/", async (c) => {
   // Supabase接続確認
   let dbStatus: "connected" | "disconnected" = "disconnected"
   let storageStatus: "connected" | "disconnected" = "disconnected"

   try {
      const supabase = getSupabaseAdmin(c.env)

      // データベース接続確認（シンプルなクエリ）
      const { error: dbError } = await supabase
         .from("sound_pins")
         .select("id")
         .limit(1)

      if (!dbError) {
         dbStatus = "connected"
      }

      // ストレージ接続確認
      const { error: storageError } = await supabase.storage
         .from("sonory-audio")
         .list("", { limit: 1 })

      if (!storageError) {
         storageStatus = "connected"
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

/**
 * GET /health/detailed
 * @description 詳細なヘルスチェック（管理者用）
 */
healthRoutes.get("/detailed", async (c) => {
   // TODO: 実際のサービスチェックを実装
   const checkDatabase = async (): Promise<boolean> => {
      // Supabaseへの接続チェック
      return true
   }

   const checkStorage = async (): Promise<boolean> => {
      // ストレージへの接続チェック
      return true
   }

   const checkAI = async (): Promise<boolean> => {
      // AI APIの可用性チェック
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
