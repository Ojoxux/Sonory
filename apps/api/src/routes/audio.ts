import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { ERROR_CODES } from "@sonory/shared-types"
import type { Context } from "hono"
import type { Env } from "../index"
import { APIException } from "../middleware/error"
import { rateLimits } from "../middleware/rateLimit"
import { onOpenAPIValidationError } from "../middleware/validation"
import { AudioService } from "../services/audio.service"

const app = new OpenAPIHono<{ Bindings: Env }>({
   defaultHook: onOpenAPIValidationError,
})

const audioFormatSchema = z.enum([
   "webm",
   "mp3",
   "wav",
   "mp4",
   "m4a",
   "flac",
   "ogg",
])

const audioMetadataSchema = z.object({
   id: z.string(),
   filename: z.string(),
   size: z.number(),
   format: audioFormatSchema,
   duration: z.number(),
   url: z.string().optional(),
   uploadedAt: z.string(),
})

const uploadUrlDataSchema = z.object({
   uploadUrl: z.string(),
   filePath: z.string(),
   expiresAt: z.string(),
   maxFileSize: z.number(),
})

const audioUploadResultSchema = z.object({
   audioId: z.string(),
   audioUrl: z.string(),
   audioFilePath: z.string(),
   metadata: audioMetadataSchema,
})

const analysisJobResultSchema = z.object({
   jobId: z.string(),
   status: z.enum(["queued", "processing", "completed", "failed"]),
   estimatedDuration: z.string().optional(),
   statusUrl: z.string(),
})

const pythonAnalysisResultSchema = z.object({
   classifications: z.array(
      z.object({
         label: z.string(),
         confidence: z.number(),
      }),
   ),
   environment: z
      .object({
         primary_type: z.string(),
         type_scores: z.record(z.string(), z.number()),
         description: z.string(),
      })
      .optional(),
   performance_metrics: z
      .object({
         yamnet_inference_time: z.number(),
         total_time: z.number(),
         processing_ratio: z.number(),
      })
      .optional(),
})

const analysisStatusSchema = z.object({
   jobId: z.string(),
   status: z.enum(["queued", "processing", "completed", "failed"]),
   result: pythonAnalysisResultSchema.optional(),
   error: z
      .object({
         message: z.string(),
         code: z.string().optional(),
      })
      .optional(),
   createdAt: z.string(),
   startedAt: z.string().optional(),
   completedAt: z.string().optional(),
   retryCount: z.number(),
})

const errorResponseSchema = z.object({
   success: z.literal(false),
   error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.unknown().optional(),
      timestamp: z.string(),
      requestId: z.string(),
   }),
})

const standardErrorResponses = {
   400: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "リクエスト不正",
   },
   500: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "サーバーエラー",
   },
}

const successResponseSchema = <T extends z.ZodType>(data: T) =>
   z.object({
      success: z.literal(true),
      data,
   })

const deleteAudioData = async (
   c: Context<{ Bindings: Env }>,
   encodedFilePath?: string,
) => {
   const audioService = new AudioService(c)

   try {
      if (!encodedFilePath) {
         throw new APIException(
            ERROR_CODES.INVALID_AUDIO_FORMAT,
            "File path is required",
            400,
         )
      }

      const filePath = decodeURIComponent(encodedFilePath)
      const success = await audioService.deleteAudio(filePath)

      return {
         deleted: success,
         deletedPath: filePath,
      }
   } catch (error) {
      if (error instanceof APIException) {
         throw error
      }

      throw new APIException(
         ERROR_CODES.STORAGE_ERROR,
         "Failed to delete audio file",
         500,
         error instanceof Error ? { message: error.message } : undefined,
      )
   }
}

/**
 * Route definitions
 */
const uploadUrlRoute = createRoute({
   method: "post",
   path: "/upload-url",
   tags: ["Audio"],
   summary: "Presigned URL生成",
   description: "Supabase Storageへの直接アップロード用Presigned URLを生成",
   middleware: [rateLimits.default],
   request: {
      body: {
         required: true,
         content: {
            "application/json": {
               schema: z.object({
                  fileName: z.string(),
                  userId: z.string().optional(),
               }),
            },
         },
      },
   },
   responses: {
      200: {
         content: {
            "application/json": {
               schema: successResponseSchema(uploadUrlDataSchema),
            },
         },
         description: "Presigned URLと関連情報",
      },
      ...standardErrorResponses,
   },
})

const uploadRoute = createRoute({
   method: "post",
   path: "/upload",
   tags: ["Audio"],
   summary: "音声ファイルアップロード",
   description: "音声ファイルを直接アップロード（FormData）",
   middleware: [rateLimits.audioUpload],
   request: {
      body: {
         required: true,
         content: {
            "multipart/form-data": {
               schema: z.object({
                  audio: z.any(),
                  userId: z.string().optional(),
               }),
            },
         },
      },
   },
   responses: {
      200: {
         content: {
            "application/json": {
               schema: successResponseSchema(audioUploadResultSchema),
            },
         },
         description: "アップロード結果",
      },
      ...standardErrorResponses,
   },
})

const deleteAudioRoute = createRoute({
   method: "delete",
   path: "/{filePath}",
   tags: ["Audio"],
   summary: "音声ファイル削除",
   description: "音声ファイルを削除",
   middleware: [rateLimits.default],
   request: {
      params: z.object({
         filePath: z.string(),
      }),
   },
   responses: {
      200: {
         content: {
            "application/json": {
               schema: successResponseSchema(
                  z.object({
                     deleted: z.boolean(),
                     deletedPath: z.string(),
                  }),
               ),
            },
         },
         description: "削除結果",
      },
      ...standardErrorResponses,
   },
})

const getAudioMetadataRoute = createRoute({
   method: "get",
   path: "/{audioId}/metadata",
   tags: ["Audio"],
   summary: "音声メタデータ取得",
   description: "音声ファイルのメタデータを取得",
   middleware: [rateLimits.default],
   request: {
      params: z.object({
         audioId: z.string(),
      }),
   },
   responses: {
      200: {
         content: {
            "application/json": {
               schema: successResponseSchema(audioMetadataSchema),
            },
         },
         description: "メタデータ",
      },
      ...standardErrorResponses,
   },
})

const analyzeAudioRoute = createRoute({
   method: "post",
   path: "/{audioId}/analyze",
   tags: ["Audio"],
   summary: "音声分析ジョブ投入",
   description:
      "音声分析ジョブを非同期で投入（Cloudflare Workers 30秒制限対応）",
   middleware: [rateLimits.default],
   request: {
      params: z.object({
         audioId: z.string(),
      }),
      body: {
         required: true,
         content: {
            "application/json": {
               schema: z.object({
                  audioUrl: z.string().url(),
                  topK: z.number().optional(),
               }),
            },
         },
      },
   },
   responses: {
      200: {
         content: {
            "application/json": {
               schema: successResponseSchema(analysisJobResultSchema),
            },
         },
         description: "ジョブ投入結果とステータスURL",
      },
      ...standardErrorResponses,
   },
})

const analysisStatusRoute = createRoute({
   method: "get",
   path: "/{audioId}/analysis/{jobId}/status",
   tags: ["Audio"],
   summary: "分析ステータス取得",
   description: "分析ジョブのステータスと結果を取得",
   middleware: [rateLimits.default],
   request: {
      params: z.object({
         audioId: z.string(),
         jobId: z.string(),
      }),
   },
   responses: {
      200: {
         content: {
            "application/json": {
               schema: successResponseSchema(analysisStatusSchema),
            },
         },
         description: "ジョブステータスと分析結果",
      },
      ...standardErrorResponses,
   },
})

const processQueueRoute = createRoute({
   method: "post",
   path: "/internal/process-queue",
   tags: ["Internal"],
   summary: "キュー処理",
   description: "キューから分析ジョブを取得して処理（内部用・Cron Trigger用）",
   responses: {
      200: {
         content: {
            "application/json": {
               schema: successResponseSchema(
                  z.object({
                     processedCount: z.number(),
                     message: z.string(),
                  }),
               ),
            },
         },
         description: "処理結果",
      },
      ...standardErrorResponses,
   },
})

/**
 * Route handlers
 */

app.openapi(uploadUrlRoute, async (c) => {
   const audioService = new AudioService(
      c as unknown as Context<{ Bindings: Env }>,
   )

   try {
      const { fileName, userId } = c.req.valid("json")

      if (!fileName) {
         throw new APIException(
            ERROR_CODES.INVALID_AUDIO_FORMAT,
            "File name is required",
            400,
         )
      }

      const result = await audioService.generateUploadUrl(fileName, userId)

      return c.json(
         {
            success: true as const,
            data: result,
         },
         200,
      )
   } catch (error) {
      if (error instanceof APIException) {
         throw error
      }

      throw new APIException(
         ERROR_CODES.STORAGE_ERROR,
         "Failed to generate upload URL",
         500,
         error instanceof Error ? { message: error.message } : undefined,
      )
   }
})

app.openapi(uploadRoute, async (c) => {
   const audioService = new AudioService(
      c as unknown as Context<{ Bindings: Env }>,
   )

   try {
      const formData = c.req.valid("form") as {
         audio?: File | string
         userId?: string
      }
      const fileEntry = formData.audio
      const userIdEntry = formData.userId

      const file =
         fileEntry && typeof fileEntry === "object" && "name" in fileEntry
            ? (fileEntry as File)
            : null
      const userId = typeof userIdEntry === "string" ? userIdEntry : null

      if (!file) {
         throw new APIException(
            ERROR_CODES.INVALID_AUDIO_FORMAT,
            "Audio file is required",
            400,
         )
      }

      if (file.size === 0) {
         throw new APIException(
            ERROR_CODES.INVALID_AUDIO_FORMAT,
            "Audio file cannot be empty",
            400,
         )
      }

      const result = await audioService.uploadAudio(file, userId || undefined)

      return c.json(
         {
            success: true as const,
            data: result,
         },
         200,
      )
   } catch (error) {
      if (error instanceof APIException) {
         throw error
      }

      throw new APIException(
         ERROR_CODES.STORAGE_ERROR,
         "Failed to upload audio file",
         500,
         error instanceof Error ? { message: error.message } : undefined,
      )
   }
})

app.openapi(deleteAudioRoute, async (c) => {
   const { filePath: encodedFilePath } = c.req.valid("param")
   const data = await deleteAudioData(
      c as unknown as Context<{ Bindings: Env }>,
      encodedFilePath,
   )

   return c.json(
      {
         success: true as const,
         data,
      },
      200,
   )
})

app.delete("/:filePath{.+}", rateLimits.default, async (c) => {
   const data = await deleteAudioData(
      c as unknown as Context<{ Bindings: Env }>,
      c.req.param("filePath"),
   )

   return c.json(
      {
         success: true as const,
         data,
      },
      200,
   )
})

app.openapi(getAudioMetadataRoute, async (c) => {
   const { audioId } = c.req.valid("param")

   try {
      if (!audioId) {
         throw new APIException(
            ERROR_CODES.INVALID_AUDIO_FORMAT,
            "Audio ID is required",
            400,
         )
      }

      const metadata = {
         id: audioId,
         filename: `audio-${audioId}`,
         size: 0,
         format: "webm" as const,
         duration: 0,
         uploadedAt: new Date().toISOString(),
      }

      return c.json(
         {
            success: true as const,
            data: metadata,
         },
         200,
      )
   } catch (error) {
      if (error instanceof APIException) {
         throw error
      }

      throw new APIException(
         ERROR_CODES.DATABASE_ERROR,
         "Failed to get audio metadata",
         500,
         error instanceof Error ? { message: error.message } : undefined,
      )
   }
})

app.openapi(analyzeAudioRoute, async (c) => {
   const audioService = new AudioService(
      c as unknown as Context<{ Bindings: Env }>,
   )
   const { audioId } = c.req.valid("param")

   try {
      if (!audioId) {
         throw new APIException(
            ERROR_CODES.INVALID_AUDIO_FORMAT,
            "Audio ID is required",
            400,
         )
      }

      const body = c.req.valid("json")
      const audioUrl = body.audioUrl

      if (!audioUrl) {
         throw new APIException(
            ERROR_CODES.INVALID_AUDIO_FORMAT,
            "Audio URL is required for analysis",
            400,
         )
      }

      const jobResult = await audioService.scheduleAnalysis(audioId, audioUrl)

      const env = c.env as Env
      const isDevelopment =
         env.ENVIRONMENT === "development" || !env.ENVIRONMENT

      if (isDevelopment) {
         console.log("🔧 開発環境: 同期的にキュー処理を実行します")
         await new Promise((resolve) => setTimeout(resolve, 500))
         try {
            const processedCount = await audioService.processAnalysisQueue()
            console.log("✅ キュー処理完了", { processedCount })
         } catch (error) {
            console.error("❌ 自動キュー処理エラー:", error)
         }
      }

      return c.json(
         {
            success: true as const,
            data: jobResult,
         },
         200,
      )
   } catch (error) {
      if (error instanceof APIException) {
         throw error
      }

      throw new APIException(
         ERROR_CODES.AI_ANALYSIS_FAILED,
         "Failed to schedule audio analysis",
         500,
         error instanceof Error ? { message: error.message } : undefined,
      )
   }
})

app.openapi(analysisStatusRoute, async (c) => {
   const audioService = new AudioService(
      c as unknown as Context<{ Bindings: Env }>,
   )
   const { audioId, jobId } = c.req.valid("param")

   try {
      if (!audioId) {
         throw new APIException(
            ERROR_CODES.INVALID_AUDIO_FORMAT,
            "Audio ID is required",
            400,
         )
      }

      if (!jobId) {
         throw new APIException(
            ERROR_CODES.INVALID_AUDIO_FORMAT,
            "Job ID is required",
            400,
         )
      }

      const jobStatus = await audioService.getAnalysisStatus(jobId)

      return c.json(
         {
            success: true as const,
            data: jobStatus,
         },
         200,
      )
   } catch (error) {
      if (error instanceof APIException) {
         throw error
      }

      throw new APIException(
         ERROR_CODES.AI_ANALYSIS_FAILED,
         "Failed to get analysis status",
         500,
         error instanceof Error ? { message: error.message } : undefined,
      )
   }
})

app.openapi(processQueueRoute, async (c) => {
   const audioService = new AudioService(
      c as unknown as Context<{ Bindings: Env }>,
   )

   try {
      const processedCount = await audioService.processAnalysisQueue()

      return c.json(
         {
            success: true as const,
            data: {
               processedCount,
               message: `Processed ${processedCount} analysis jobs`,
            },
         },
         200,
      )
   } catch (error) {
      if (error instanceof APIException) {
         throw error
      }

      throw new APIException(
         ERROR_CODES.AI_ANALYSIS_FAILED,
         "Failed to process analysis queue",
         500,
         error instanceof Error ? { message: error.message } : undefined,
      )
   }
})

export default app
