import { z } from "zod"
import { AudioFormatSchema, PythonAnalysisResultSchema } from "./audio.js"
import {
   LocationCoordinatesSchema,
   MapBoundsSchema,
   TimeTagSchema,
} from "./location.js"

export const ApiWeatherDataSchema = z.object({
   temperature: z.number(),
   condition: z.string().optional().nullable(),
   windSpeed: z.number().optional().nullable(),
   humidity: z.number().min(0).max(100).optional().nullable(),
})

export const AiAnalysisSchema = z.object({
   transcription: z.string(),
   categories: z.object({
      emotion: z.string(),
      topic: z.string(),
      language: z.string(),
      confidence: z.number().min(0).max(1),
   }),
   summary: z.string().optional(),
})

export const SoundPinAudioSchema = z.object({
   url: z.string(),
   duration: z.number(),
   format: AudioFormatSchema,
})

export const ApiErrorSchema = z.object({
   code: z.string(),
   message: z.string(),
   details: z.unknown().optional(),
   timestamp: z.string(),
   requestId: z.string(),
})

export const ApiErrorResponseSchema = z.object({
   success: z.literal(false),
   error: ApiErrorSchema,
})

export const ApiSuccessResponseSchema = <T extends z.ZodType>(data: T) =>
   z.object({
      success: z.literal(true),
      data,
   })

export const ApiSuccessWithMetaResponseSchema = <T extends z.ZodType>(
   data: T,
) =>
   z.object({
      success: z.literal(true),
      data,
      meta: z.record(z.string(), z.unknown()).optional(),
   })

export const SoundPinApiSchema = z.object({
   id: z.string(),
   userId: z.string().optional(),
   location: LocationCoordinatesSchema,
   audio: SoundPinAudioSchema,
   weather: ApiWeatherDataSchema.optional(),
   timeTag: TimeTagSchema.optional(),
   aiAnalysis: AiAnalysisSchema.optional(),
   status: z.enum(["active", "processing", "deleted", "reported"]),
   title: z.string().optional(),
   metadata: z
      .object({
         deviceInfo: z.string().optional(),
      })
      .optional(),
   createdAt: z.string(),
   updatedAt: z.string(),
})

export const CreatePinRequestSchema = z.object({
   location: LocationCoordinatesSchema,
   audio: z
      .object({
         url: z.string().url(),
         duration: z.number().min(9.9).max(600),
         format: z.enum(["webm", "mp3", "wav"]),
         filePath: z.string().optional(),
      })
      .optional(),
   audio_file_path: z.string().optional(),
   metadata: z
      .object({
         duration: z.number().positive().optional(),
         timeTag: TimeTagSchema.optional(),
         title: z.string().max(200).optional(),
         deviceInfo: z.string().optional(),
         weather: ApiWeatherDataSchema.optional(),
      })
      .optional(),
   weather: ApiWeatherDataSchema.optional(),
   timeTag: TimeTagSchema.optional(),
   title: z.string().max(200).optional(),
   deviceInfo: z.string().optional(),
})

export const UpdatePinRequestSchema = z.object({
   title: z.string().max(200).optional(),
   status: z.enum(["active", "processing", "deleted", "reported"]).optional(),
   aiAnalysis: AiAnalysisSchema.optional(),
})

export const NearbyPinsQueryParamsSchema = z.object({
   north: z.coerce.number().min(-90).max(90),
   south: z.coerce.number().min(-90).max(90),
   east: z.coerce.number().min(-180).max(180),
   west: z.coerce.number().min(-180).max(180),
   limit: z.coerce.number().positive().max(100).optional(),
   categories: z.array(z.string()).optional(),
})

export const SearchPinsQueryParamsSchema = z.object({
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

export const NearbyPinsQuerySchema = z.object({
   bounds: MapBoundsSchema,
   limit: z.number().positive().max(100).default(50),
   categories: z.array(z.string()).optional(),
})

export const SearchPinsQuerySchema = z.object({
   location: z
      .object({
         lat: z.number(),
         lng: z.number(),
         radius: z.number().positive(),
      })
      .optional(),
   timeRange: z
      .object({
         start: z.string().datetime(),
         end: z.string().datetime(),
      })
      .optional(),
   categories: z.array(z.string()).optional(),
   weather: z.array(z.string()).optional(),
   limit: z.number().positive().max(100).default(50),
   offset: z.number().nonnegative().default(0),
})

export const ReportPinRequestSchema = z.object({
   reason: z.string().min(10).max(1000),
})

export const AudioMetadataSchema = z.object({
   id: z.string(),
   filename: z.string(),
   size: z.number(),
   format: AudioFormatSchema,
   duration: z.number(),
   url: z.string().optional(),
   uploadedAt: z.string(),
})

export const AudioUploadResultSchema = z.object({
   audioId: z.string(),
   audioUrl: z.string(),
   audioFilePath: z.string(),
   metadata: AudioMetadataSchema,
})

export const UploadUrlDataSchema = z.object({
   uploadUrl: z.string(),
   filePath: z.string(),
   expiresAt: z.string(),
   maxFileSize: z.number(),
})

export const AnalysisJobResultSchema = z.object({
   jobId: z.string(),
   status: z.enum(["queued", "processing", "completed", "failed"]),
   estimatedDuration: z.string().optional(),
   statusUrl: z.string(),
})

export const AnalysisStatusSchema = z.object({
   jobId: z.string(),
   status: z.enum(["queued", "processing", "completed", "failed"]),
   result: PythonAnalysisResultSchema.optional(),
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

export type ApiWeatherData = z.infer<typeof ApiWeatherDataSchema>
export type ApiError = z.infer<typeof ApiErrorSchema>
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>
export type CreatePinRequest = z.infer<typeof CreatePinRequestSchema>
export type UpdatePinRequest = z.infer<typeof UpdatePinRequestSchema>
export type NearbyPinsQuery = z.infer<typeof NearbyPinsQuerySchema>
export type SearchPinsQuery = z.infer<typeof SearchPinsQuerySchema>
