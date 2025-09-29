import {
   ERROR_CODES,
   type NearbyPinsQuery,
   type SearchPinsQuery,
} from "@sonory/shared-types"
import { Hono } from "hono"
import { z } from "zod"
import { APIException } from "../middleware/error"
import { validate } from "../middleware/validation"
import { AudioService } from "../services/audio.service"
import { PinService } from "../services/pin.service"
import type { Env } from "../types/api"

const app = new Hono<{ Bindings: Env }>()

/**
 * Request validation schemas
 */
const createPinSchema = z.object({
   userId: z.string().uuid().optional(),
   location: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      accuracy: z.number().positive().optional(),
   }),
   audio: z.object({
      url: z.string().url(),
      duration: z.number().min(9.9).max(600), // タイマー精度を考慮して9.9秒以上
      format: z.enum(["webm", "mp3", "wav"]),
   }),
   weather: z
      .object({
         temperature: z.number(),
         condition: z.string().optional(),
         windSpeed: z.number().optional(),
         humidity: z.number().min(0).max(100).optional(),
      })
      .optional(),
   timeTag: z.enum(["朝", "昼", "夕", "夜"]).optional(),
   title: z.string().max(200).optional(),
   deviceInfo: z.string().optional(),
})

const updatePinSchema = z.object({
   title: z.string().max(200).optional(),
   status: z.enum(["active", "processing", "deleted", "reported"]).optional(),
   aiAnalysis: z
      .object({
         transcription: z.string(),
         categories: z.object({
            emotion: z.string(),
            topic: z.string(),
            language: z.string(),
            confidence: z.number().min(0).max(1),
         }),
         summary: z.string().optional(),
      })
      .optional(),
})

const nearbyPinsSchema = z.object({
   north: z.coerce.number().min(-90).max(90),
   south: z.coerce.number().min(-90).max(90),
   east: z.coerce.number().min(-180).max(180),
   west: z.coerce.number().min(-180).max(180),
   limit: z.coerce.number().positive().max(100).optional(),
   categories: z.array(z.string()).optional(),
})

const searchPinsSchema = z.object({
   lat: z.coerce.number().min(-90).max(90).optional(),
   lng: z.coerce.number().min(-180).max(180).optional(),
   radius: z.coerce.number().positive().optional(),
   startTime: z.string().datetime().optional(),
   endTime: z.string().datetime().optional(),
   categories: z.array(z.string()).optional(),
   weather: z.array(z.string()).optional(),
   limit: z.coerce.number().positive().max(100).optional(),
   offset: z.coerce.number().nonnegative().optional(),
})

const reportPinSchema = z.object({
   reason: z.string().min(10).max(1000),
})

/**
 * POST /api/pins - Create a new pin
 */
app.post("/", validate("json", createPinSchema), async (c) => {
   const service = new PinService(c)
   const data = await c.req.json()

   const pin = await service.createPin(data)

   return c.json({
      success: true,
      data: pin,
   })
})

/**
 * POST /api/pins/upload - Create a new pin with audio upload
 */
app.post("/upload", async (c) => {
   const service = new PinService(c)
   const audioService = new AudioService(c)

   try {
      // FormDataから音声ファイルと位置情報を取得
      const formData = await c.req.formData()
      const audioFile = formData.get("audio") as unknown as File
      const locationStr = formData.get("location") as string
      const metadataStr = formData.get("metadata") as string

      if (!audioFile || !(audioFile instanceof File)) {
         throw new APIException(
            ERROR_CODES.INVALID_AUDIO_FORMAT,
            "音声ファイルが必要です",
         )
      }

      if (!locationStr) {
         throw new APIException(
            ERROR_CODES.INVALID_LOCATION,
            "位置情報が必要です",
         )
      }

      const location = JSON.parse(locationStr)
      const metadata = metadataStr ? JSON.parse(metadataStr) : {}

      if (!location || !location.lat || !location.lng) {
         throw new APIException(
            ERROR_CODES.INVALID_LOCATION,
            "位置情報が必要です",
         )
      }

      // 音声ファイルをSupabase Storageにアップロード
      console.log("🔄 音声ファイルアップロード開始:", {
         fileName: audioFile.name,
         fileSize: audioFile.size,
         fileType: audioFile.type,
      })

      const uploadResult = await audioService.uploadAudio(audioFile)

      console.log("✅ 音声ファイルアップロード完了:", {
         audioId: uploadResult.audioId,
         audioUrl: uploadResult.audioUrl,
      })

      // 音声フォーマットを決定
      let audioFormat: "webm" | "mp3" | "wav" = "webm"
      if (audioFile.type.includes("mp3")) {
         audioFormat = "mp3"
      } else if (audioFile.type.includes("wav")) {
         audioFormat = "wav"
      }

      // ピンデータを作成
      const pinData = {
         location: {
            lat: location.lat,
            lng: location.lng,
            accuracy: location.accuracy,
         },
         audio: {
            url: uploadResult.audioUrl,
            duration: metadata.duration || 10,
            format: audioFormat,
         },
         weather: metadata.weather, // 天気情報を追加
         timeTag: metadata.timeTag,
         title: metadata.title,
         deviceInfo: metadata.deviceInfo,
      }

      const pin = await service.createPin(pinData)

      // 非同期でAI分析を実行（Node.js環境）
      console.log("🤖 AI分析を非同期で開始:", pin.id)
      ;(async (): Promise<void> => {
         try {
            // 少し待機してからAI分析を実行
            await new Promise((resolve) => setTimeout(resolve, 1000))

            const analysisResponse = await fetch(
               `http://localhost:8787/api/audio/${uploadResult.audioId}/analyze`,
               {
                  method: "POST",
                  headers: {
                     "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                     audioUrl: uploadResult.audioUrl,
                     topK: 5,
                  }),
               },
            )

            if (analysisResponse.ok) {
               const analysisResult = (await analysisResponse.json()) as {
                  success: boolean
                  data?: {
                     transcription: string
                     categories: {
                        emotion: string
                        topic: string
                        language: string
                        confidence: number
                     }
                     summary?: string
                  }
               }

               if (analysisResult.success && analysisResult.data) {
                  // 分析結果でピンを更新
                  await service.updatePin(pin.id, {
                     aiAnalysis: analysisResult.data,
                  })

                  console.log("✅ AI分析完了・ピン更新:", {
                     pinId: pin.id,
                     analysis: analysisResult.data,
                  })
               }
            }
         } catch (error) {
            console.error("❌ AI分析エラー:", error)
         }
      })()

      return c.json({
         success: true,
         data: pin,
      })
   } catch (error) {
      if (error instanceof APIException) {
         throw error
      }

      throw new APIException(
         ERROR_CODES.INTERNAL_SERVER_ERROR,
         error instanceof Error ? error.message : "ピン作成に失敗しました",
      )
   }
})

/**
 * GET /api/pins/nearby - Get nearby pins
 */
app.get("/nearby", validate("query", nearbyPinsSchema), async (c) => {
   const service = new PinService(c)
   const validated = c.req.valid("query")

   const nearbyQuery: NearbyPinsQuery = {
      bounds: {
         north: validated.north,
         south: validated.south,
         east: validated.east,
         west: validated.west,
      },
      limit: validated.limit ?? 50,
      categories: validated.categories,
   }

   const pins = await service.getNearbyPins(nearbyQuery)

   // 積極的なキャッシュヘッダーを設定
   c.header("Cache-Control", "public, s-maxage=120, stale-while-revalidate=300")
   c.header("X-API-Version", "1.0")
   c.header("X-Response-Time", Date.now().toString())

   return c.json({
      success: true,
      data: pins,
      meta: {
         count: pins.length,
         bounds: nearbyQuery.bounds,
         limit: nearbyQuery.limit,
      },
   })
})

/**
 * GET /api/pins/search - Search pins with filters
 */
app.get("/search", validate("query", searchPinsSchema), async (c) => {
   const service = new PinService(c)
   const validated = c.req.valid("query")

   const searchQuery: SearchPinsQuery = {
      ...(validated.lat && validated.lng && validated.radius
         ? {
              location: {
                 lat: validated.lat,
                 lng: validated.lng,
                 radius: validated.radius,
              },
           }
         : {}),
      ...(validated.startTime && validated.endTime
         ? {
              timeRange: {
                 start: validated.startTime,
                 end: validated.endTime,
              },
           }
         : {}),
      categories: validated.categories,
      weather: validated.weather,
      limit: validated.limit ?? 50,
      offset: validated.offset ?? 0,
   }

   const pins = await service.searchPins(searchQuery)

   return c.json({
      success: true,
      data: pins,
   })
})

/**
 * GET /api/pins/user/:userId - Get user's pins
 */
app.get("/user/:userId", async (c) => {
   const service = new PinService(c)
   const userId = c.req.param("userId")

   const pins = await service.getUserPins(userId)

   return c.json({
      success: true,
      data: pins,
   })
})

/**
 * POST /api/pins/batch - Create multiple pins
 */
app.post("/batch", validate("json", z.array(createPinSchema)), async (c) => {
   const service = new PinService(c)
   const data = await c.req.json()

   const pins = await service.createPinsBatch(data)

   return c.json({
      success: true,
      data: pins,
      meta: {
         requested: data.length,
         created: pins.length,
      },
   })
})

/**
 * GET /api/pins/:id - Get pin by ID
 */
app.get("/:id", async (c) => {
   const service = new PinService(c)
   const id = c.req.param("id")

   const pin = await service.getPinById(id)

   if (!pin) {
      throw new APIException(ERROR_CODES.DATABASE_ERROR, "Pin not found", 404)
   }

   return c.json({
      success: true,
      data: pin,
   })
})

/**
 * PUT /api/pins/:id - Update pin
 */
app.put("/:id", validate("json", updatePinSchema), async (c) => {
   const service = new PinService(c)
   const id = c.req.param("id")
   const data = await c.req.json()

   const pin = await service.updatePin(id, data)

   if (!pin) {
      throw new APIException(ERROR_CODES.DATABASE_ERROR, "Pin not found", 404)
   }

   return c.json({
      success: true,
      data: pin,
   })
})

/**
 * DELETE /api/pins/:id - Delete pin
 */
app.delete("/:id", async (c) => {
   const service = new PinService(c)
   const id = c.req.param("id")

   const deleted = await service.deletePin(id)

   if (!deleted) {
      throw new APIException(ERROR_CODES.DATABASE_ERROR, "Pin not found", 404)
   }

   return c.json({
      success: true,
      data: { deleted: true },
   })
})

/**
 * POST /api/pins/:id/report - Report a pin
 */
app.post("/:id/report", validate("json", reportPinSchema), async (c) => {
   const service = new PinService(c)
   const id = c.req.param("id")
   const { reason } = await c.req.json()

   const reported = await service.reportPin(id, reason)

   if (!reported) {
      throw new APIException(ERROR_CODES.DATABASE_ERROR, "Pin not found", 404)
   }

   return c.json({
      success: true,
      data: { reported: true },
   })
})

export default app
