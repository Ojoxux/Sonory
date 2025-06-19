import { logger } from '@/utils/logger'
import type { APIResponse } from '@sonory/shared-types'
import { Hono } from 'hono'

interface HealthCheckResponse {
   status: 'healthy' | 'degraded' | 'unhealthy'
   timestamp: string
   version: string
   services: {
      database: 'connected' | 'disconnected'
      storage: 'connected' | 'disconnected'
      ai: 'available' | 'unavailable'
   }
   uptime: number
}

// 起動時刻を記録
const startTime = Date.now()

/**
 * ヘルスチェックルート
 * @description システムの健全性を確認するエンドポイント
 */
export const healthRoutes = new Hono()

/**
 * GET /health
 * @description 基本的なヘルスチェック
 */
healthRoutes.get('/', (c) => {
   const response: APIResponse<HealthCheckResponse> = {
      success: true,
      data: {
         status: 'healthy',
         timestamp: new Date().toISOString(),
         version: '0.1.0',
         services: {
            database: 'connected',
            storage: 'connected',
            ai: 'available',
         },
         uptime: Date.now() - startTime,
      },
   }

   logger.debug('Health check performed', {
      requestId: c.get('requestId'),
      uptime: response.data.uptime,
   })

   return c.json(response)
})

/**
 * GET /health/detailed
 * @description 詳細なヘルスチェック（管理者用）
 */
healthRoutes.get('/detailed', async (c) => {
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
   const status = allHealthy ? 'healthy' : dbHealthy ? 'degraded' : 'unhealthy'

   const response: APIResponse<HealthCheckResponse> = {
      success: true,
      data: {
         status,
         timestamp: new Date().toISOString(),
         version: '0.1.0',
         services: {
            database: dbHealthy ? 'connected' : 'disconnected',
            storage: storageHealthy ? 'connected' : 'disconnected',
            ai: aiHealthy ? 'available' : 'unavailable',
         },
         uptime: Date.now() - startTime,
      },
   }

   logger.info('Detailed health check performed', {
      requestId: c.get('requestId'),
      status,
      services: response.data.services,
   })

   return c.json(response, allHealthy ? 200 : 503)
})
