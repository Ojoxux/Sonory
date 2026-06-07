import {
   ERROR_CODES,
   type CreatePinRequest,
   type LocationCoordinates,
   type NearbyPinsQuery,
   type SearchPinsQuery,
   type SoundPinAPI,
   type UpdatePinRequest,
} from "@sonory/shared-types"
import type { Context } from "hono"
import { APIException } from "../middleware/error"
import { PinRepository } from "../repositories/pin.repository"
import type { SoundPinInsert, SoundPinUpdate } from "../types/database"
import { BaseService } from "./base.service"
import { getSupabaseAdmin } from "./supabase"

/**
 * Pin service for managing sound pins
 *
 * @description
 * Handles business logic for sound pin operations including:
 * - CRUD operations with validation
 * - Geospatial queries
 * - Batch operations
 * - Moderation features
 */
export class PinService extends BaseService {
   private repository: PinRepository

   constructor(ctx: Context) {
      super(ctx)
      const supabase = getSupabaseAdmin(this.env)
      this.repository = new PinRepository(supabase, this.requestId)
   }

   protected getServiceName(): string {
      return "PinService"
   }

   /**
    * Creates a new sound pin
    *
    * @param request - Pin creation request
    * @returns Created sound pin
    * @throws APIException on validation or creation error
    */
   async createPin(request: CreatePinRequest): Promise<SoundPinAPI> {
      this.log("info", "Creating new pin", {
         location: request.location,
         audio: request.audio,
         requestData: request,
      })

      try {
         // Validate location
         this.validateLocation(request.location)

         // Validate audio metadata (if audio object is provided)
         if (request.audio) {
            this.validateAudioMetadata(request.audio)
         } else if (!request.audio_file_path) {
            throw new APIException(
               ERROR_CODES.DATABASE_ERROR,
               "Either audio or audio_file_path must be provided",
               400,
            )
         }

         // Convert to database insert format
         const pinData = this.toDatabaseInsert(request)

         this.log("info", "Database insert data", { pinData })

         // Create pin in database
         const createdPin = await this.repository.create(pinData)

         this.log("info", "Pin created successfully", { pinId: createdPin.id })
         return createdPin
      } catch (error) {
         this.log("error", "Failed to create pin", {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
         })
         throw error
      }
   }

   /**
    * Gets a pin by ID
    *
    * @param id - Pin ID
    * @returns Pin if found, null otherwise
    * @throws APIException on database error
    */
   async getPinById(id: string): Promise<SoundPinAPI | null> {
      this.log("info", "Getting pin by ID", { pinId: id })

      try {
         const pin = await this.repository.findById(id)

         if (!pin) {
            this.log("info", "Pin not found", { pinId: id })
            return null
         }

         return pin
      } catch (error) {
         this.log("error", "Failed to get pin", {
            pinId: id,
            error: error instanceof Error ? error.message : String(error),
         })
         throw error
      }
   }

   /**
    * Updates a pin
    *
    * @param id - Pin ID
    * @param request - Update request
    * @returns Updated pin if found, null otherwise
    * @throws APIException on validation or update error
    */
   async updatePin(
      id: string,
      request: UpdatePinRequest,
   ): Promise<SoundPinAPI | null> {
      this.log("info", "Updating pin", { pinId: id })

      try {
         // Check if pin exists
         const existingPin = await this.repository.findById(id)
         if (!existingPin) {
            this.log("info", "Pin not found for update", { pinId: id })
            return null
         }

         // Validate status if provided
         if (request.status) {
            this.validateStatus(request.status)
         }

         // Validate AI analysis if provided
         if (request.aiAnalysis) {
            this.validateAIAnalysis(request.aiAnalysis)
         }

         // Convert to database update format
         const updateData = this.toDatabaseUpdate(request)

         // Update pin in database
         const updatedPin = await this.repository.update(id, updateData)

         if (updatedPin) {
            this.log("info", "Pin updated successfully", { pinId: id })
         }

         return updatedPin
      } catch (error) {
         this.log("error", "Failed to update pin", {
            pinId: id,
            error: error instanceof Error ? error.message : String(error),
         })
         throw error
      }
   }

   /**
    * Deletes a pin (soft delete)
    *
    * @param id - Pin ID
    * @returns True if deleted, false if not found
    * @throws APIException on deletion error
    */
   async deletePin(id: string): Promise<boolean> {
      this.log("info", "Deleting pin", { pinId: id })

      try {
         const deleted = await this.repository.delete(id)

         if (!deleted) {
            this.log("info", "Pin not found for deletion", { pinId: id })
         }

         return deleted
      } catch (error) {
         this.log("error", "Failed to delete pin", {
            pinId: id,
            error: error instanceof Error ? error.message : String(error),
         })
         throw error
      }
   }

   /**
    * Gets nearby pins within bounds
    *
    * @param query - Nearby pins query
    * @returns Array of pins within bounds
    * @throws APIException on query error
    */
   async getNearbyPins(query: NearbyPinsQuery): Promise<SoundPinAPI[]> {
      this.log("info", "Getting nearby pins", { bounds: query.bounds })

      try {
         // Validate bounds
         this.validateBounds(query.bounds)

         const pins = await this.repository.findWithinBounds(query)

         this.log("info", "Found nearby pins", { count: pins.length })
         return pins
      } catch (error) {
         this.log("error", "Failed to get nearby pins", {
            bounds: query.bounds,
            error: error instanceof Error ? error.message : String(error),
         })
         throw error
      }
   }

   /**
    * Searches pins with filters
    *
    * @param query - Search query
    * @returns Array of pins matching criteria
    * @throws APIException on search error
    */
   async searchPins(query: SearchPinsQuery): Promise<SoundPinAPI[]> {
      this.log("info", "Searching pins", { query })

      try {
         // TODO: Implement search logic
         throw new Error("Not implemented")
      } catch (error) {
         this.log("error", "Failed to search pins", {
            query,
            error: error instanceof Error ? error.message : String(error),
         })
         throw error
      }
   }

   /**
    * Gets all pins for a specific user
    *
    * @param userId - User ID
    * @returns Array of user's pins
    * @throws APIException on query error
    */
   async getUserPins(userId: string): Promise<SoundPinAPI[]> {
      this.log("info", "Getting user pins", { userId })

      try {
         // TODO: Implement user pins query
         throw new Error("Not implemented")
      } catch (error) {
         this.log("error", "Failed to get user pins", {
            userId,
            error: error instanceof Error ? error.message : String(error),
         })
         throw error
      }
   }

   /**
    * Creates multiple pins in batch
    *
    * @param requests - Array of pin creation requests
    * @returns Array of created pins
    * @throws APIException on batch creation error
    */
   async createPinsBatch(requests: CreatePinRequest[]): Promise<SoundPinAPI[]> {
      this.log("info", "Creating pins in batch", { count: requests.length })

      try {
         // TODO: Implement batch creation
         throw new Error("Not implemented")
      } catch (error) {
         this.log("error", "Failed to create pins batch", {
            count: requests.length,
            error: error instanceof Error ? error.message : String(error),
         })
         throw error
      }
   }

   /**
    * Reports a pin for inappropriate content
    *
    * @param id - Pin ID
    * @param reason - Report reason
    * @returns True if reported successfully
    * @throws APIException on report error
    */
   async reportPin(id: string, reason: string): Promise<boolean> {
      this.log("info", "Reporting pin", { pinId: id, reason })

      try {
         // TODO: Implement report logic
         throw new Error("Not implemented")
      } catch (error) {
         this.log("error", "Failed to report pin", {
            pinId: id,
            reason,
            error: error instanceof Error ? error.message : String(error),
         })
         throw error
      }
   }

   /**
    * Validates geographic bounds
    *
    * @param bounds - Bounds to validate
    * @throws APIException if bounds are invalid
    */
   private validateBounds(bounds: NearbyPinsQuery["bounds"]): void {
      if (bounds.north <= bounds.south) {
         throw new APIException(
            ERROR_CODES.INVALID_LOCATION,
            "Invalid bounds: north must be greater than south",
            400,
         )
      }

      if (
         bounds.east <= bounds.west &&
         bounds.east >= -180 &&
         bounds.west <= 180
      ) {
         throw new APIException(
            ERROR_CODES.INVALID_LOCATION,
            "Invalid bounds: east must be greater than west (except when crossing the dateline)",
            400,
         )
      }

      if (
         bounds.north > 90 ||
         bounds.south < -90 ||
         bounds.east > 180 ||
         bounds.west < -180
      ) {
         throw new APIException(
            ERROR_CODES.LOCATION_OUT_OF_BOUNDS,
            "Bounds exceed valid geographic coordinates",
            400,
         )
      }
   }

   /**
    * Validates location coordinates
    *
    * @param location - Location to validate
    * @throws APIException if location is invalid
    */
   private validateLocation(location: LocationCoordinates): void {
      if (location.lat < -90 || location.lat > 90) {
         throw new APIException(
            ERROR_CODES.INVALID_LOCATION,
            "Invalid latitude: must be between -90 and 90",
            400,
         )
      }

      if (location.lng < -180 || location.lng > 180) {
         throw new APIException(
            ERROR_CODES.INVALID_LOCATION,
            "Invalid longitude: must be between -180 and 180",
            400,
         )
      }

      if (location.accuracy && location.accuracy <= 0) {
         throw new APIException(
            ERROR_CODES.INVALID_LOCATION,
            "Invalid accuracy: must be positive",
            400,
         )
      }
   }

   /**
    * Validates audio metadata
    *
    * @param audio - Audio metadata to validate
    * @throws APIException if audio metadata is invalid
    */
   private validateAudioMetadata(audio: {
      url: string
      duration: number
      format: "webm" | "mp3" | "wav"
   }): void {
      if (!audio.url || audio.url.trim() === "") {
         throw new APIException(
            ERROR_CODES.INVALID_AUDIO_FORMAT,
            "Audio URL is required",
            400,
         )
      }

      if (audio.duration < 9.9 || audio.duration > 600) {
         throw new APIException(
            ERROR_CODES.AUDIO_DURATION_INVALID,
            "Audio duration must be between 9.9 and 600 seconds",
            400,
         )
      }

      const validFormats = ["webm", "mp3", "wav"] as const
      if (!validFormats.includes(audio.format)) {
         throw new APIException(
            ERROR_CODES.INVALID_AUDIO_FORMAT,
            `Invalid audio format: must be one of ${validFormats.join(", ")}`,
            400,
         )
      }
   }

   /**
    * Converts API request to database insert format
    *
    * @param request - API request
    * @returns Database insert format
    */
   private toDatabaseInsert(request: CreatePinRequest): SoundPinInsert {
      const userId = request.userId ?? null
      // PostGISのPOINT関数を使用してGeography型に変換
      const locationWKT = `POINT(${request.location.lng} ${request.location.lat})`

      // audio_file_pathが直接指定されている場合の処理
      if (request.audio_file_path) {
         // プレースホルダーURLを生成
         const placeholderUrl = `storage://sonory-audio/${request.audio_file_path}`

         return {
            // 必須フィールド
            user_id: userId,
            location: locationWKT,
            audio_url: placeholderUrl,
            audio_duration: request.metadata?.duration ?? 10,
            audio_format: "webm" as const, // デフォルト値
            audio_file_path: request.audio_file_path,
            status: "active" as const,

            // AI分析フィールド（初期値はnull、後で更新）
            ai_analysis_result: null,

            // 天気情報（metadataまたはトップレベルから）
            weather_temperature:
               request.metadata?.weather?.temperature ??
               request.weather?.temperature ??
               null,
            weather_condition:
               request.metadata?.weather?.condition ??
               request.weather?.condition ??
               null,
            weather_wind_speed:
               request.metadata?.weather?.windSpeed ??
               request.weather?.windSpeed ??
               null,
            weather_humidity:
               request.metadata?.weather?.humidity ??
               request.weather?.humidity ??
               null,

            // メタデータ（metadataまたはトップレベルから）
            time_tag: request.metadata?.timeTag ?? request.timeTag ?? null,
            title: request.metadata?.title ?? request.title ?? null,
            device_info:
               request.metadata?.deviceInfo ?? request.deviceInfo ?? null,
         }
      }

      // 従来のaudioオブジェクトを使用する場合
      if (!request.audio) {
         throw new APIException(
            ERROR_CODES.DATABASE_ERROR,
            "Either audio or audio_file_path must be provided",
            400,
         )
      }

      return {
         // 必須フィールド
         user_id: userId,
         location: locationWKT,
         audio_url: request.audio.url,
         audio_duration: request.audio.duration,
         audio_format: request.audio.format,
         audio_file_path: request.audio.filePath ?? null,
         status: "active" as const,

         // AI分析フィールド（初期値はnull、後で更新）
         ai_analysis_result: null,

         // 天気情報（任意）
         weather_temperature: request.weather?.temperature ?? null,
         weather_condition: request.weather?.condition ?? null,
         weather_wind_speed: request.weather?.windSpeed ?? null,
         weather_humidity: request.weather?.humidity ?? null,

         // メタデータ（任意）
         time_tag: request.timeTag || null,
         title: request.title || null,
         device_info: request.deviceInfo || null,
      }
   }

   /**
    * Validates pin status
    *
    * @param status - Status to validate
    * @throws APIException if status is invalid
    */
   private validateStatus(status: string): void {
      const validStatuses = [
         "active",
         "processing",
         "deleted",
         "reported",
      ] as const
      type ValidStatus = (typeof validStatuses)[number]

      if (!validStatuses.includes(status as ValidStatus)) {
         throw new APIException(
            ERROR_CODES.DATABASE_ERROR,
            `Invalid status: must be one of ${validStatuses.join(", ")}`,
            400,
         )
      }
   }

   /**
    * Validates AI analysis data
    *
    * @param aiAnalysis - AI analysis to validate
    * @throws APIException if AI analysis is invalid
    */
   private validateAIAnalysis(
      aiAnalysis: UpdatePinRequest["aiAnalysis"],
   ): void {
      if (!aiAnalysis) return

      if (!aiAnalysis.transcription || aiAnalysis.transcription.trim() === "") {
         throw new APIException(
            ERROR_CODES.AI_ANALYSIS_FAILED,
            "AI transcription is required",
            400,
         )
      }

      if (
         aiAnalysis.categories.confidence < 0 ||
         aiAnalysis.categories.confidence > 1
      ) {
         throw new APIException(
            ERROR_CODES.AI_ANALYSIS_FAILED,
            "AI confidence must be between 0 and 1",
            400,
         )
      }
   }

   /**
    * Converts API update request to database update format
    *
    * @param request - API update request
    * @returns Database update format
    */
   private toDatabaseUpdate(request: UpdatePinRequest): SoundPinUpdate {
      return {
         ...(request.title !== undefined ? { title: request.title } : {}),
         ...(request.status ? { status: request.status } : {}),
         ...(request.aiAnalysis
            ? {
                 ai_analysis_result: {
                    transcription: request.aiAnalysis.transcription,
                    emotion: request.aiAnalysis.categories.emotion,
                    topic: request.aiAnalysis.categories.topic,
                    language: request.aiAnalysis.categories.language,
                    confidence: request.aiAnalysis.categories.confidence,
                    ...(request.aiAnalysis.summary
                       ? { summary: request.aiAnalysis.summary }
                       : {}),
                    analyzed_at: new Date().toISOString(),
                 },
              }
            : {}),
      }
   }
}
