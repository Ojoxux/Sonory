import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import {
   ApiErrorResponseSchema,
   ApiSuccessResponseSchema,
   ApiSuccessWithMetaResponseSchema,
   CreatePinRequestSchema,
   ERROR_CODES,
   type NearbyPinsQuery,
   NearbyPinsQueryParamsSchema,
   ReportPinRequestSchema,
   type SearchPinsQuery,
   SearchPinsQueryParamsSchema,
   SoundPinApiSchema,
   UpdatePinRequestSchema,
} from "@sonory/shared-types"
import { APIException } from "../middleware/error"
import { onOpenAPIValidationError } from "../middleware/validation"
import { AudioService } from "../services/audio.service"
import { PinService } from "../services/pin.service"
import type { Env } from "../types/api"

type CreatePinRequest = Parameters<PinService["createPin"]>[0]
type UpdatePinRequest = Parameters<PinService["updatePin"]>[1]

const app = new OpenAPIHono<{ Bindings: Env }>({
   defaultHook: onOpenAPIValidationError,
})

const standardErrorResponses = {
   400: {
      content: { "application/json": { schema: ApiErrorResponseSchema } },
      description: "リクエスト不正",
   },
   404: {
      content: { "application/json": { schema: ApiErrorResponseSchema } },
      description: "対象が見つからない",
   },
   500: {
      content: { "application/json": { schema: ApiErrorResponseSchema } },
      description: "サーバーエラー",
   },
}

// HACK: 複雑な配列スキーマは事前に定義して型推論の深さを抑える
const createPinsBatchSchema: z.ZodTypeAny = z.array(CreatePinRequestSchema)

/**
 * Route definitions
 */
const createPinRoute = createRoute({
   method: "post",
   path: "/",
   tags: ["Pins"],
   summary: "ピン作成",
   description: "新しい音声ピンを作成",
   request: {
      body: {
         required: true,
         content: {
            "application/json": { schema: CreatePinRequestSchema },
         },
      },
   },
   responses: {
      200: {
         content: {
            "application/json": {
               schema: ApiSuccessResponseSchema(SoundPinApiSchema),
            },
         },
         description: "作成されたピン",
      },
      ...standardErrorResponses,
   },
})

const uploadPinRoute = createRoute({
   method: "post",
   path: "/upload",
   tags: ["Pins"],
   summary: "音声アップロード付きピン作成",
   description: "音声ファイルをアップロードしてピンを作成",
   request: {
      body: {
         required: true,
         content: {
            "multipart/form-data": {
               schema: z.object({
                  audio: z.any(),
                  location: z.string(),
                  metadata: z.string().optional(),
               }),
            },
         },
      },
   },
   responses: {
      200: {
         content: {
            "application/json": {
               schema: ApiSuccessResponseSchema(SoundPinApiSchema),
            },
         },
         description: "作成されたピン",
      },
      ...standardErrorResponses,
   },
})

const nearbyPinsRoute = createRoute({
   method: "get",
   path: "/nearby",
   tags: ["Pins"],
   summary: "周辺ピン取得",
   description: "指定された境界内のピンを取得",
   request: {
      query: NearbyPinsQueryParamsSchema,
   },
   responses: {
      200: {
         content: {
            "application/json": {
               schema: ApiSuccessWithMetaResponseSchema(
                  z.array(SoundPinApiSchema),
               ),
            },
         },
         description: "周辺ピン一覧",
      },
      ...standardErrorResponses,
   },
})

const searchPinsRoute = createRoute({
   method: "get",
   path: "/search",
   tags: ["Pins"],
   summary: "ピン検索",
   description: "条件を指定してピンを検索",
   request: {
      query: SearchPinsQueryParamsSchema,
   },
   responses: {
      200: {
         content: {
            "application/json": {
               schema: ApiSuccessResponseSchema(z.array(SoundPinApiSchema)),
            },
         },
         description: "検索結果",
      },
      ...standardErrorResponses,
   },
})

const getUserPinsRoute = createRoute({
   method: "get",
   path: "/user/{userId}",
   tags: ["Pins"],
   summary: "ユーザーのピン取得",
   description: "指定ユーザーのピン一覧を取得",
   request: {
      params: z.object({
         userId: z.string(),
      }),
   },
   responses: {
      200: {
         content: {
            "application/json": {
               schema: ApiSuccessResponseSchema(z.array(SoundPinApiSchema)),
            },
         },
         description: "ユーザーのピン一覧",
      },
      ...standardErrorResponses,
   },
})

const batchCreatePinsRoute = createRoute({
   method: "post",
   path: "/batch",
   tags: ["Pins"],
   summary: "複数ピン一括作成",
   description: "複数のピンを一括で作成",
   request: {
      body: {
         required: true,
         content: {
            "application/json": {
               schema: createPinsBatchSchema,
            },
         },
      },
   },
   responses: {
      200: {
         content: {
            "application/json": {
               schema: ApiSuccessWithMetaResponseSchema(
                  z.array(SoundPinApiSchema),
               ),
            },
         },
         description: "作成されたピン一覧",
      },
      ...standardErrorResponses,
   },
})

const getPinByIdRoute = createRoute({
   method: "get",
   path: "/{id}",
   tags: ["Pins"],
   summary: "ピン詳細取得",
   description: "IDでピンを取得",
   request: {
      params: z.object({
         id: z.string(),
      }),
   },
   responses: {
      200: {
         content: {
            "application/json": {
               schema: ApiSuccessResponseSchema(SoundPinApiSchema),
            },
         },
         description: "ピン詳細",
      },
      ...standardErrorResponses,
   },
})

const updatePinRoute = createRoute({
   method: "put",
   path: "/{id}",
   tags: ["Pins"],
   summary: "ピン更新",
   description: "ピンの情報を更新",
   request: {
      params: z.object({
         id: z.string(),
      }),
      body: {
         required: true,
         content: {
            "application/json": { schema: UpdatePinRequestSchema },
         },
      },
   },
   responses: {
      200: {
         content: {
            "application/json": {
               schema: ApiSuccessResponseSchema(SoundPinApiSchema),
            },
         },
         description: "更新されたピン",
      },
      ...standardErrorResponses,
   },
})

const deletePinRoute = createRoute({
   method: "delete",
   path: "/{id}",
   tags: ["Pins"],
   summary: "ピン削除",
   description: "ピンを削除",
   request: {
      params: z.object({
         id: z.string(),
      }),
   },
   responses: {
      200: {
         content: {
            "application/json": {
               schema: ApiSuccessResponseSchema(
                  z.object({ deleted: z.boolean() }),
               ),
            },
         },
         description: "削除結果",
      },
      ...standardErrorResponses,
   },
})

const reportPinRoute = createRoute({
   method: "post",
   path: "/{id}/report",
   tags: ["Pins"],
   summary: "ピン報告",
   description: "不適切なピンを報告",
   request: {
      params: z.object({
         id: z.string(),
      }),
      body: {
         required: true,
         content: {
            "application/json": { schema: ReportPinRequestSchema },
         },
      },
   },
   responses: {
      200: {
         content: {
            "application/json": {
               schema: ApiSuccessResponseSchema(
                  z.object({ reported: z.boolean() }),
               ),
            },
         },
         description: "報告結果",
      },
      ...standardErrorResponses,
   },
})

/**
 * Route handlers
 */

app.openapi(createPinRoute, async (c) => {
   const service = new PinService(c)
   const data = c.req.valid("json") as CreatePinRequest

   const pin = await service.createPin(data)

   return c.json(
      {
         success: true as const,
         data: pin,
      },
      200,
   )
})

app.openapi(uploadPinRoute, async (c) => {
   const service = new PinService(c)
   const audioService = new AudioService(c)

   try {
      const formData = c.req.valid("form") as {
         audio?: File | string
         location?: string
         metadata?: string
      }
      const audioFile = formData.audio as unknown as File
      const locationStr = formData.location
      const metadataStr = formData.metadata

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

      console.log("音声ファイルアップロード開始:", {
         fileName: audioFile.name,
         fileSize: audioFile.size,
         fileType: audioFile.type,
      })

      const uploadResult = await audioService.uploadAudio(audioFile)

      console.log("音声ファイルアップロード完了:", {
         audioId: uploadResult.audioId,
         audioUrl: uploadResult.audioUrl,
      })

      let audioFormat: "webm" | "mp3" | "wav" = "webm"
      if (audioFile.type.includes("mp3")) {
         audioFormat = "mp3"
      } else if (audioFile.type.includes("wav")) {
         audioFormat = "wav"
      }

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
         weather: metadata.weather,
         timeTag: metadata.timeTag,
         title: metadata.title,
         deviceInfo: metadata.deviceInfo,
      }

      const pin = await service.createPin(pinData)

      console.log("AI分析ジョブをキューに投入:", pin.id)

      c.executionCtx.waitUntil(
         (async (): Promise<void> => {
            try {
               await audioService.scheduleAnalysis(
                  uploadResult.audioId,
                  uploadResult.audioUrl,
               )

               console.log("AI分析ジョブ投入完了:", {
                  audioId: uploadResult.audioId,
                  pinId: pin.id,
               })

               const isDevelopment =
                  c.env.ENVIRONMENT === "development" || !c.env.ENVIRONMENT

               if (isDevelopment) {
                  console.log("開発環境: キュー処理を同期的に実行")
                  await new Promise((resolve) => setTimeout(resolve, 500))
                  const processedCount =
                     await audioService.processAnalysisQueue()
                  console.log("キュー処理完了:", { processedCount })
               }
            } catch (error) {
               console.error("AI分析ジョブ投入エラー:", error)
            }
         })(),
      )

      return c.json(
         {
            success: true as const,
            data: pin,
         },
         200,
      )
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

app.openapi(nearbyPinsRoute, async (c) => {
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

   c.header("Cache-Control", "public, s-maxage=120, stale-while-revalidate=300")
   c.header("X-API-Version", "1.0")
   c.header("X-Response-Time", Date.now().toString())

   return c.json(
      {
         success: true as const,
         data: pins,
         meta: {
            count: pins.length,
            bounds: nearbyQuery.bounds,
            limit: nearbyQuery.limit,
         },
      },
      200,
   )
})

app.openapi(searchPinsRoute, async (c) => {
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

   return c.json(
      {
         success: true as const,
         data: pins,
      },
      200,
   )
})

app.openapi(getUserPinsRoute, async (c) => {
   const service = new PinService(c)
   const { userId } = c.req.valid("param")

   const pins = await service.getUserPins(userId)

   return c.json(
      {
         success: true as const,
         data: pins,
      },
      200,
   )
})

app.openapi(batchCreatePinsRoute, async (c) => {
   const service = new PinService(c)
   const data = c.req.valid("json") as CreatePinRequest[]

   const pins = await service.createPinsBatch(data)

   return c.json(
      {
         success: true as const,
         data: pins,
         meta: {
            requested: data.length,
            created: pins.length,
         },
      },
      200,
   )
})

app.openapi(getPinByIdRoute, async (c) => {
   const service = new PinService(c)
   const { id } = c.req.valid("param")

   const pin = await service.getPinById(id)

   if (!pin) {
      throw new APIException(ERROR_CODES.DATABASE_ERROR, "Pin not found", 404)
   }

   return c.json(
      {
         success: true as const,
         data: pin,
      },
      200,
   )
})

app.openapi(updatePinRoute, async (c) => {
   const service = new PinService(c)
   const { id } = c.req.valid("param")
   const validated = c.req.valid("json")
   const data = {
      ...(validated.title !== undefined ? { title: validated.title } : {}),
      ...(validated.status !== undefined ? { status: validated.status } : {}),
      ...(validated.aiAnalysis !== undefined
         ? { aiAnalysis: validated.aiAnalysis }
         : {}),
   } as UpdatePinRequest

   const pin = await service.updatePin(id, data)

   if (!pin) {
      throw new APIException(ERROR_CODES.DATABASE_ERROR, "Pin not found", 404)
   }

   return c.json(
      {
         success: true as const,
         data: pin,
      },
      200,
   )
})

app.openapi(deletePinRoute, async (c) => {
   const service = new PinService(c)
   const { id } = c.req.valid("param")

   const deleted = await service.deletePin(id)

   if (!deleted) {
      throw new APIException(ERROR_CODES.DATABASE_ERROR, "Pin not found", 404)
   }

   return c.json(
      {
         success: true as const,
         data: { deleted: true },
      },
      200,
   )
})

app.openapi(reportPinRoute, async (c) => {
   const service = new PinService(c)
   const { id } = c.req.valid("param")
   const { reason } = c.req.valid("json")

   const reported = await service.reportPin(id, reason)

   if (!reported) {
      throw new APIException(ERROR_CODES.DATABASE_ERROR, "Pin not found", 404)
   }

   return c.json(
      {
         success: true as const,
         data: { reported: true },
      },
      200,
   )
})

export default app
