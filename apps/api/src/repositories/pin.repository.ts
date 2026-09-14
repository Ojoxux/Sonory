import {
   ERROR_CODES,
   type LocationCoordinates,
   type NearbyPinsQuery,
   type SearchPinsQuery,
   type SoundPinAPI,
} from "@sonory/shared-types"
import type { SupabaseClient } from "@supabase/supabase-js"
import { APIException } from "../middleware/error"
import type {
   PostGISPoint,
   SoundPinInsert,
   SoundPinRecord,
   SoundPinUpdate,
} from "../types/database"
import { Logger } from "../utils/logger"

/**
 * Repository for sound pins data access
 * Handles all database operations for sound pins
 */
export class PinRepository {
   private logger: Logger

   /**
    * Creates a new PinRepository instance
    *
    * @param adminClient - service_role client, used for read-only queries that are
    *    already scoped by an explicit `status = 'active'` filter (RLS bypass is safe here
    *    because no owner-restricted data can leak through these code paths)
    * @param userClient - request-scoped client that forwards the caller's JWT, used for
    *    mutations (create/update/delete) so that RLS (`auth.uid() = user_id`) is actually
    *    enforced. Must never be cached/reused across requests (see `getSupabaseUserClient`).
    * @param requestId - Request ID for logging
    */
   constructor(
      private adminClient: SupabaseClient,
      private userClient: SupabaseClient,
      private requestId?: string,
   ) {
      this.logger = new Logger("INFO")
   }

   /**
    * Extract file path from storage URL or placeholder URL
    * @param url - Storage URL or placeholder URL
    * @returns File path or null
    */
   private extractFilePathFromUrl(url: string): string | null {
      if (!url) return null

      // Handle placeholder URLs (storage://bucket/path)
      if (url.startsWith("storage://")) {
         const match = url.match(/^storage:\/\/[^/]+\/(.+)$/)
         return match?.[1] ?? null
      }

      // Handle signed URLs or public URLs
      // Example: https://...supabase.co/storage/v1/object/sign/sonory-audio/path/to/file.webm?token=...
      // Extract: path/to/file.webm
      const match = url.match(/\/sonory-audio\/(.+?)(?:\?|$)/)
      return match?.[1] ?? null
   }

   /**
    * Parses location data from either WKT, GeoJSON, or PostGIS binary format
    * @param locationData - Location data in various formats
    * @returns Parsed coordinates
    */
   private parseLocationData(locationData: string): {
      lat: number
      lng: number
   } {
      // PostGIS WKB format (binary) - parse directly
      if (locationData.startsWith("0101000020")) {
         return this.parsePostGISBinary(locationData)
      }

      if (locationData.startsWith("POINT(")) {
         // WKT format: POINT(lng lat)
         const locationMatch = locationData.match(/POINT\(([^)]+)\)/)
         if (!locationMatch || !locationMatch[1]) {
            throw new Error(`Invalid WKT location format: ${locationData}`)
         }
         const [lngStr, latStr] = locationMatch[1].split(" ")
         return {
            lng: Number(lngStr),
            lat: Number(latStr),
         }
      }

      // GeoJSON format
      try {
         const location = JSON.parse(locationData) as PostGISPoint
         return {
            lat: location.coordinates[1],
            lng: location.coordinates[0],
         }
      } catch (_error) {
         throw new Error(`Invalid location format: ${locationData}`)
      }
   }

   /**
    * Parses PostGIS binary format (WKB) to extract coordinates
    * @param wkbHex - PostGIS binary data as hex string
    * @returns Parsed coordinates
    */
   private parsePostGISBinary(wkbHex: string): { lat: number; lng: number } {
      try {
         this.logger.info("Parsing PostGIS binary", {
            wkbHex: `${wkbHex.slice(0, 50)}...`,
            length: wkbHex.length,
            fullHex: wkbHex,
            requestId: this.requestId,
         })

         if (wkbHex.length < 48) {
            throw new Error(
               `WKB hex too short: ${wkbHex.length} chars, expected at least 48`,
            )
         }

         // PostGIS WKB format for POINT with SRID:
         // Bytes 0: 01 (little endian) - 2 hex chars
         // Bytes 1-4: 01000020 (POINT with SRID) - 8 hex chars
         // Bytes 5-8: E6100000 (SRID 4326 in little endian) - 8 hex chars
         // Total header: 18 hex chars (9 bytes)
         // Bytes 9-16: X coordinate (longitude) as 8-byte double - 16 hex chars
         // Bytes 17-24: Y coordinate (latitude) as 8-byte double - 16 hex chars

         // Verify WKB header format
         if (!wkbHex.startsWith("0101000020E6100000")) {
            throw new Error(`Invalid WKB header: ${wkbHex.slice(0, 18)}`)
         }

         // Try different header lengths and coordinate orders to find the correct one
         const headerLengths = [16, 18, 20] // 8, 9, 10 bytes
         let bestResult: { lat: number; lng: number } | null = null

         for (const headerLength of headerLengths) {
            try {
               const coordsHex = wkbHex.slice(headerLength)

               if (coordsHex.length < 32) {
                  continue
               }

               // Extract coordinates - first 8 bytes = 16 hex chars, next 8 bytes = 16 hex chars
               const coord1Hex = coordsHex.slice(0, 16)
               const coord2Hex = coordsHex.slice(16, 32)

               // デバッグモードでのみログ出力
               if (isDevelopment) {
                  this.logger.info(`Trying header length ${headerLength}`, {
                     headerLength,
                     coordsHex: coordsHex.slice(0, 32),
                     coord1Hex,
                     coord2Hex,
                     requestId: this.requestId,
                  })
               }

               // Try both coordinate orders: (lng, lat) and (lat, lng)
               const coord1 = this.parseIEEE754Double(coord1Hex)
               const coord2 = this.parseIEEE754Double(coord2Hex)

               // Try order 1: coord1=lng, coord2=lat
               if (
                  !Number.isNaN(coord1) &&
                  !Number.isNaN(coord2) &&
                  coord2 >= -90 &&
                  coord2 <= 90 &&
                  coord1 >= -180 &&
                  coord1 <= 180
               ) {
                  bestResult = { lat: coord2, lng: coord1 }
                  if (isDevelopment) {
                     this.logger.info(
                        `Found valid coordinates (lng,lat) with header length ${headerLength}`,
                        {
                           headerLength,
                           lat: coord2,
                           lng: coord1,
                           requestId: this.requestId,
                        },
                     )
                  }
                  break
               }

               // Try order 2: coord1=lat, coord2=lng
               if (
                  !Number.isNaN(coord1) &&
                  !Number.isNaN(coord2) &&
                  coord1 >= -90 &&
                  coord1 <= 90 &&
                  coord2 >= -180 &&
                  coord2 <= 180
               ) {
                  bestResult = { lat: coord1, lng: coord2 }
                  if (isDevelopment) {
                     this.logger.info(
                        `Found valid coordinates (lat,lng) with header length ${headerLength}`,
                        {
                           headerLength,
                           lat: coord1,
                           lng: coord2,
                           requestId: this.requestId,
                        },
                     )
                  }
                  break
               }
            } catch (error) {
               if (isDevelopment) {
                  this.logger.warn(`Header length ${headerLength} failed`, {
                     headerLength,
                     error:
                        error instanceof Error ? error.message : String(error),
                     requestId: this.requestId,
                  })
               }
            }
         }

         if (!bestResult) {
            throw new Error(
               "Could not parse coordinates with any header length",
            )
         }

         const { lat, lng } = bestResult

         // Validate coordinates
         if (Number.isNaN(lat) || Number.isNaN(lng)) {
            throw new Error(`Invalid coordinates: lat=${lat}, lng=${lng}`)
         }

         if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            throw new Error(`Coordinates out of range: lat=${lat}, lng=${lng}`)
         }

         if (isDevelopment) {
            this.logger.info("Successfully parsed WKB coordinates", {
               lat,
               lng,
               requestId: this.requestId,
            })
         }

         return { lat, lng }
      } catch (error) {
         this.logger.error("Failed to parse PostGIS binary", {
            wkbHex: wkbHex.slice(0, 100),
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            requestId: this.requestId,
         })
         throw new Error(
            `Failed to parse PostGIS binary: ${error instanceof Error ? error.message : String(error)}`,
         )
      }
   }

   /**
    * Converts hex string to double (little-endian)
    * @param hex - Hex string (16 characters)
    * @returns Double value
    */
   private hexToDouble(hex: string): number {
      try {
         if (hex.length !== 16) {
            throw new Error(`Invalid hex length: ${hex.length}, expected 16`)
         }

         // Convert hex pairs to bytes (little-endian)
         const bytes = new Uint8Array(8)
         for (let i = 0; i < 8; i++) {
            const hexPair = hex.slice(i * 2, i * 2 + 2)
            const byteValue = Number.parseInt(hexPair, 16)
            if (Number.isNaN(byteValue)) {
               throw new Error(`Invalid hex pair: ${hexPair} at position ${i}`)
            }
            bytes[i] = byteValue
         }

         this.logger.info("Hex to double conversion", {
            hex,
            bytes: Array.from(bytes),
            requestId: this.requestId,
         })

         // Create DataView and read as little-endian double
         const view = new DataView(bytes.buffer)
         const result = view.getFloat64(0, true) // true = little-endian

         this.logger.info("Double conversion result", {
            hex,
            result,
            requestId: this.requestId,
         })

         return result
      } catch (error) {
         this.logger.error("Failed to convert hex to double", {
            hex,
            error: error instanceof Error ? error.message : String(error),
            requestId: this.requestId,
         })
         throw error
      }
   }

   /**
    * Converts hex string to little-endian double with proper byte order
    * @param hex - 16 character hex string representing 8 bytes
    * @returns Double value
    */
   private hexToLittleEndianDouble(hex: string): number {
      try {
         if (hex.length !== 16) {
            throw new Error(`Invalid hex length: ${hex.length}, expected 16`)
         }

         // Convert hex string to bytes in the exact order they appear
         const bytes = new Uint8Array(8)
         for (let i = 0; i < 8; i++) {
            const hexPair = hex.slice(i * 2, i * 2 + 2)
            const byteValue = Number.parseInt(hexPair, 16)
            if (Number.isNaN(byteValue)) {
               throw new Error(`Invalid hex pair: ${hexPair} at position ${i}`)
            }
            bytes[i] = byteValue
         }

         this.logger.info("Little-endian hex to double conversion", {
            hex,
            bytes: Array.from(bytes),
            requestId: this.requestId,
         })

         // Create DataView and read as little-endian double
         const view = new DataView(bytes.buffer)
         const result = view.getFloat64(0, true) // true = little-endian

         // Check if result is reasonable for geographic coordinates
         if (Math.abs(result) > 180) {
            this.logger.warn("Coordinate value seems out of range", {
               hex,
               result,
               requestId: this.requestId,
            })
         }

         this.logger.info("Little-endian double conversion result", {
            hex,
            result,
            requestId: this.requestId,
         })

         return result
      } catch (error) {
         this.logger.error("Failed to convert hex to little-endian double", {
            hex,
            error: error instanceof Error ? error.message : String(error),
            requestId: this.requestId,
         })
         throw error
      }
   }

   /**
    * Parses IEEE 754 double precision number from hex string (little-endian)
    * @param hex - 16 character hex string representing 8 bytes
    * @returns Double value
    */
   private parseIEEE754Double(hex: string): number {
      try {
         if (hex.length !== 16) {
            throw new Error(`Invalid hex length: ${hex.length}, expected 16`)
         }

         // Convert hex string to bytes (little-endian format)
         const bytes = new Uint8Array(8)
         for (let i = 0; i < 8; i++) {
            const hexPair = hex.slice(i * 2, i * 2 + 2)
            const byteValue = Number.parseInt(hexPair, 16)
            if (Number.isNaN(byteValue)) {
               throw new Error(`Invalid hex pair: ${hexPair} at position ${i}`)
            }
            bytes[i] = byteValue
         }

         this.logger.info("IEEE 754 double parsing", {
            hex,
            bytes: Array.from(bytes),
            requestId: this.requestId,
         })

         // Create DataView and read as little-endian double
         const view = new DataView(bytes.buffer)
         const result = view.getFloat64(0, true) // true = little-endian

         this.logger.info("IEEE 754 double result", {
            hex,
            result,
            requestId: this.requestId,
         })

         return result
      } catch (error) {
         this.logger.error("Failed to parse IEEE 754 double", {
            hex,
            error: error instanceof Error ? error.message : String(error),
            requestId: this.requestId,
         })
         throw error
      }
   }

   /**
    * Converts database record to domain model
    * @param record - Database record
    * @returns Domain model
    */
   private async toDomainModel(record: SoundPinRecord): Promise<SoundPinAPI> {
      const { lat, lng } = this.parseLocationData(record.location)

      // AI分析結果を新しいスキーマから取得
      const aiAnalysis = record.ai_analysis_result || {}

      // DEBUG: データベースから取得したレコードの内容をログ出力
      if (isDevelopment) {
         this.logger.info("Database record to domain model conversion", {
            recordId: record.id,
            title: record.title,
            aiTopic: aiAnalysis.topic,
            aiEmotion: aiAnalysis.emotion,
            aiConfidence: aiAnalysis.confidence,
            status: record.status,
            requestId: this.requestId,
         })
      }

      // Generate signed URL from audio_file_path
      // audio_file_pathがない場合は、audio_urlからファイルパスを抽出して署名付きURLを生成
      let audioUrl = record.audio_url

      const filePathToUse =
         record.audio_file_path || this.extractFilePathFromUrl(record.audio_url)

      if (filePathToUse) {
         try {
            const { data: signedData, error: signedError } =
               await this.adminClient.storage
                  .from("sonory-audio")
                  .createSignedUrl(filePathToUse, 604800) // 7 days

            if (!signedError && signedData) {
               audioUrl = signedData.signedUrl
               this.logger.info("Generated signed URL from file path", {
                  recordId: record.id,
                  filePath: filePathToUse,
                  requestId: this.requestId,
               })
            } else {
               this.logger.warn("Failed to generate signed URL", {
                  error: signedError?.message,
                  recordId: record.id,
                  requestId: this.requestId,
               })
            }
         } catch (error) {
            this.logger.error("Error generating signed URL", {
               error: error instanceof Error ? error.message : String(error),
               recordId: record.id,
               requestId: this.requestId,
            })
         }
      }

      return {
         id: record.id,
         // user_id は API レスポンスに含めない（api-contract.ts の SoundPinApiSchema 参照）。
         // DB には保存され、RLS の所有者判定に使われるが、クライアントへは渡さない。
         location: {
            lat,
            lng,
         },
         audio: {
            url: audioUrl,
            duration: record.audio_duration,
            format: record.audio_format,
         },
         ...(record.weather_temperature
            ? {
                 weather: {
                    temperature: record.weather_temperature,
                    ...(record.weather_condition
                       ? { condition: record.weather_condition }
                       : {}),
                    ...(record.weather_wind_speed
                       ? { windSpeed: record.weather_wind_speed }
                       : {}),
                    ...(record.weather_humidity
                       ? { humidity: record.weather_humidity }
                       : {}),
                 },
              }
            : {}),
         ...(record.time_tag ? { timeTag: record.time_tag } : {}),
         // AI分析結果を新しいJSONスキーマから取得
         aiAnalysis: {
            transcription: aiAnalysis.transcription || "",
            categories: {
               emotion: aiAnalysis.emotion || "neutral",
               topic: aiAnalysis.topic || "unknown",
               language: aiAnalysis.language || "ja",
               confidence: aiAnalysis.confidence || 0,
            },
            ...(aiAnalysis.summary ? { summary: aiAnalysis.summary } : {}),
         },
         status: record.status,
         ...(record.title ? { title: record.title } : {}),
         ...(record.device_info
            ? {
                 metadata: {
                    deviceInfo: record.device_info,
                 },
              }
            : {}),
         createdAt: record.created_at,
         updatedAt: record.updated_at,
      }
   }

   /**
    * Creates a new sound pin
    * @param data - Pin data to create
    * @returns Created pin
    * @throws APIException on database error
    */
   async create(data: SoundPinInsert): Promise<SoundPinAPI> {
      try {
         this.logger.info("Creating pin with data", {
            data,
            requestId: this.requestId,
         })

         // Parse location from WKT format to get coordinates
         const locationMatch = data.location.match(/POINT\(([^)]+)\)/)
         if (!locationMatch || !locationMatch[1]) {
            throw new Error("Invalid location format")
         }

         const [lng, lat] = locationMatch[1].split(" ").map(Number)

         const rpcParams = {
            p_user_id: data.user_id,
            p_lat: lat,
            p_lng: lng,
            p_audio_url: data.audio_url,
            p_audio_file_path: data.audio_file_path,
            p_audio_duration: data.audio_duration,
            p_audio_format: data.audio_format,
            p_weather_temperature: data.weather_temperature,
            p_weather_condition: data.weather_condition,
            p_weather_wind_speed: data.weather_wind_speed,
            p_weather_humidity: data.weather_humidity,
            p_time_tag: data.time_tag,
            p_title: data.title,
            p_device_info: data.device_info,
            p_ai_analysis_result: data.ai_analysis_result,
         }

         this.logger.info("Calling RPC function with params", {
            rpcParams,
            requestId: this.requestId,
         })

         const { data: record, error } = await this.userClient
            .rpc("create_sound_pin", rpcParams)
            .single()

         if (error) {
            this.logger.error("RPC function error", {
               error,
               requestId: this.requestId,
            })
            throw error
         }

         if (!record) {
            throw new Error("No record returned from RPC function")
         }

         this.logger.info("RPC function returned record", {
            record,
            requestId: this.requestId,
         })

         const pinRecord = record as SoundPinRecord
         this.logger.info("Pin created", {
            pinId: pinRecord.id,
            requestId: this.requestId,
         })
         return await this.toDomainModel(pinRecord)
      } catch (error) {
         this.logger.error("Failed to create pin", {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            requestId: this.requestId,
         })
         throw new APIException(
            ERROR_CODES.DATABASE_ERROR,
            "Failed to create pin",
            500,
            error instanceof Error ? { message: error.message } : undefined,
         )
      }
   }

   /**
    * Finds a pin by ID
    * @param id - Pin ID
    * @returns Pin if found, null otherwise
    * @throws APIException on database error
    */
   async findById(id: string): Promise<SoundPinAPI | null> {
      try {
         const { data: record, error } = await this.adminClient
            .from("sound_pins")
            .select()
            .eq("id", id)
            .single()

         if (error) {
            if (error.code === "PGRST116") {
               return null // Not found
            }
            throw error
         }

         return await this.toDomainModel(record)
      } catch (error) {
         this.logger.error("Failed to find pin by ID", {
            error: error instanceof Error ? error.message : String(error),
            pinId: id,
            requestId: this.requestId,
         })
         throw new APIException(
            ERROR_CODES.DATABASE_ERROR,
            "Failed to find pin",
            500,
            error instanceof Error ? { message: error.message } : undefined,
         )
      }
   }

   /**
    * Updates a pin
    * @param id - Pin ID
    * @param data - Update data
    * @returns Updated pin if found, null otherwise
    * @throws APIException on database error
    */
   async update(id: string, data: SoundPinUpdate): Promise<SoundPinAPI | null> {
      try {
         const { data: record, error } = await this.userClient
            .from("sound_pins")
            .update(data)
            .eq("id", id)
            // user_id は列権限で authenticated から SELECT できないため、
            // ワイルドカードは使えない（AGENTS.md「DB アクセス」参照）
            .select(
               "id, location, audio_url, audio_file_path, audio_duration, audio_format, weather_temperature, weather_condition, weather_wind_speed, weather_humidity, time_tag, ai_analysis_result, status, title, device_info, created_at, updated_at, deleted_at",
            )
            .single()

         if (error) {
            if (error.code === "PGRST116") {
               return null // Not found
            }
            throw error
         }

         this.logger.info("Pin updated", {
            pinId: id,
            requestId: this.requestId,
         })
         return await this.toDomainModel(record)
      } catch (error) {
         this.logger.error("Failed to update pin", {
            error: error instanceof Error ? error.message : String(error),
            pinId: id,
            requestId: this.requestId,
         })
         throw new APIException(
            ERROR_CODES.DATABASE_ERROR,
            "Failed to update pin",
            500,
            error instanceof Error ? { message: error.message } : undefined,
         )
      }
   }

   /**
    * Soft deletes a pin
    * @param id - Pin ID
    * @returns True if deleted, false if not found
    * @throws APIException on database error
    */
   async delete(id: string): Promise<boolean> {
      try {
         const { data, error } = await this.userClient
            .from("sound_pins")
            .update({
               status: "deleted" as const,
               deleted_at: new Date().toISOString(),
            })
            .eq("id", id)
            // ワイルドカード不可（user_id の列権限）。件数判定だけなので id で足りる
            .select("id")

         if (error) {
            throw error
         }

         const deleted = data.length > 0
         if (deleted) {
            this.logger.info("Pin deleted", {
               pinId: id,
               requestId: this.requestId,
            })
         }

         return deleted
      } catch (error) {
         this.logger.error("Failed to delete pin", {
            error: error instanceof Error ? error.message : String(error),
            pinId: id,
            requestId: this.requestId,
         })
         throw new APIException(
            ERROR_CODES.DATABASE_ERROR,
            "Failed to delete pin",
            500,
            error instanceof Error ? { message: error.message } : undefined,
         )
      }
   }

   /**
    * Finds pins within specified bounds using PostGIS spatial index
    * @param query - Query parameters
    * @returns Array of pins
    * @throws APIException on database error
    */
   async findWithinBounds(query: NearbyPinsQuery): Promise<SoundPinAPI[]> {
      try {
         this.logger.info("Finding pins within bounds", {
            bounds: query.bounds,
            limit: query.limit,
            requestId: this.requestId,
         })

         // Use optimized PostGIS RPC function for maximum performance
         const { data: records, error } = await this.adminClient.rpc(
            "find_pins_within_bounds",
            {
               north: query.bounds.north,
               south: query.bounds.south,
               east: query.bounds.east,
               west: query.bounds.west,
               max_results: query.limit ?? 50,
               categories: query.categories || null,
            },
         )

         if (error) {
            this.logger.error("Database query error", {
               error: error.message,
               requestId: this.requestId,
            })
            throw error
         }

         if (!records || records.length === 0) {
            return []
         }

         this.logger.info("Query completed", {
            resultCount: records.length,
            requestId: this.requestId,
         })

         // Convert to domain models efficiently
         return await Promise.all(
            records.map((record: SoundPinRecord) => this.toDomainModel(record)),
         )
      } catch (error) {
         this.logger.error("Failed to find pins within bounds", {
            error: error instanceof Error ? error.message : String(error),
            bounds: query.bounds,
            requestId: this.requestId,
         })
         throw new APIException(
            ERROR_CODES.DATABASE_ERROR,
            "Failed to find pins",
            500,
            error instanceof Error ? { message: error.message } : undefined,
         )
      }
   }

   /**
    * Finds nearby pins within a radius
    * @param center - Center location
    * @param radiusKm - Radius in kilometers
    * @param limit - Maximum number of results
    * @returns Array of pins sorted by distance
    * @throws APIException on database error
    */
   async findNearby(
      center: LocationCoordinates,
      radiusKm: number,
      limit = 50,
   ): Promise<SoundPinAPI[]> {
      try {
         // Use ST_DWithin for efficient radius search
         const { data: records, error } = await this.adminClient.rpc(
            "find_nearby_pins",
            {
               lat: center.lat,
               lng: center.lng,
               radius_meters: radiusKm * 1000,
               max_results: limit,
            },
         )

         if (error) {
            throw error
         }

         return await Promise.all(
            records.map((record: SoundPinRecord) => this.toDomainModel(record)),
         )
      } catch (error) {
         this.logger.error("Failed to find nearby pins", {
            error: error instanceof Error ? error.message : String(error),
            center,
            radiusKm,
            requestId: this.requestId,
         })
         throw new APIException(
            ERROR_CODES.DATABASE_ERROR,
            "Failed to find nearby pins",
            500,
            error instanceof Error ? { message: error.message } : undefined,
         )
      }
   }

   /**
    * Finds all non-deleted pins owned by a user
    * @param userId - Owner's user ID
    * @returns Array of pins, most recent first
    * @throws APIException on database error
    */
   async findByUserId(userId: string): Promise<SoundPinAPI[]> {
      try {
         const { data: records, error } = await this.adminClient
            .from("sound_pins")
            .select()
            .eq("user_id", userId)
            .neq("status", "deleted")
            .order("created_at", { ascending: false })
            .limit(100)

         if (error) {
            throw error
         }

         if (!records || records.length === 0) {
            return []
         }

         return await Promise.all(
            records.map((record: SoundPinRecord) => this.toDomainModel(record)),
         )
      } catch (error) {
         this.logger.error("Failed to find pins by user ID", {
            error: error instanceof Error ? error.message : String(error),
            userId,
            requestId: this.requestId,
         })
         throw new APIException(
            ERROR_CODES.DATABASE_ERROR,
            "Failed to find user pins",
            500,
            error instanceof Error ? { message: error.message } : undefined,
         )
      }
   }

   /**
    * Searches active pins with optional geo/time/category/weather filters
    *
    * @description
    * `location` があれば `find_nearby_pins` RPC で半径検索した上で残りの条件を
    * アプリ側で絞り込む（RPCは半径検索のみ対応のため）。無ければテーブルを
    * 直接クエリし、`categories` は `ai_analysis_result->>topic` で絞り込む
    * （GINインデックスあり）。
    *
    * @param query - Search filters
    * @returns Array of pins matching all provided criteria
    * @throws APIException on database error
    */
   async search(query: SearchPinsQuery): Promise<SoundPinAPI[]> {
      try {
         if (query.location) {
            return await this.searchByLocation(query)
         }
         return await this.searchByFilters(query)
      } catch (error) {
         this.logger.error("Failed to search pins", {
            error: error instanceof Error ? error.message : String(error),
            query,
            requestId: this.requestId,
         })
         throw new APIException(
            ERROR_CODES.DATABASE_ERROR,
            "Failed to search pins",
            500,
            error instanceof Error ? { message: error.message } : undefined,
         )
      }
   }

   /**
    * 通報を pin_reports に記録する。
    *
    * ピンの status は変更しない。status を 'reported' にすると SELECT ポリシー
    * （status='active'）を外れて即座に非表示になり、匿名アカウントを作れば
    * 誰でも任意のピンを取り下げられてしまうため。非表示の判断は別途行う。
    *
    * 通報は非所有者が行うため RLS を迂回する必要があり、adminClient を使う。
    *
    *  id - Pin ID
    *  reporterId - 通報者の UUID
    *  reason - 通報理由
    *  記録できたら true。対象ピンが存在しない場合は false
    *  APIException on database error
    */
   async report(
      id: string,
      reporterId: string | undefined,
      reason: string,
   ): Promise<boolean> {
      try {
         const { data: pin } = await this.adminClient
            .from("sound_pins")
            .select("id")
            .eq("id", id)
            .neq("status", "deleted")
            .maybeSingle()

         if (!pin) {
            return false
         }

         const { data, error } = await this.adminClient
            .from("pin_reports")
            .upsert(
               { pin_id: id, reporter_id: reporterId ?? null, reason },
               { onConflict: "pin_id,reporter_id" },
            )
            .select("id")

         if (error) {
            throw error
         }

         return (data?.length ?? 0) > 0
      } catch (error) {
         this.logger.error("Failed to report pin", {
            error: error instanceof Error ? error.message : String(error),
            pinId: id,
            requestId: this.requestId,
         })
         throw new APIException(
            ERROR_CODES.DATABASE_ERROR,
            "Failed to report pin",
            500,
            error instanceof Error ? { message: error.message } : undefined,
         )
      }
   }

   /**
    * `location` 指定時の検索: RPCで半径検索した後、残りの条件を絞り込む
    */
   private async searchByLocation(
      query: SearchPinsQuery,
   ): Promise<SoundPinAPI[]> {
      const location = query.location
      if (!location) {
         throw new Error("searchByLocation called without query.location")
      }

      const { data: records, error } = await this.adminClient.rpc(
         "find_nearby_pins",
         {
            lat: location.lat,
            lng: location.lng,
            radius_meters: Math.round(location.radius * 1000),
            max_results: 200,
         },
      )

      if (error) {
         throw error
      }

      const pins = await Promise.all(
         (records ?? []).map((record: SoundPinRecord) =>
            this.toDomainModel(record),
         ),
      )

      return this.applyPostFilters(pins, query)
   }

   /**
    * `location` 未指定時の検索: テーブルを直接クエリする
    */
   private async searchByFilters(
      query: SearchPinsQuery,
   ): Promise<SoundPinAPI[]> {
      let dbQuery = this.adminClient
         .from("sound_pins")
         .select()
         .eq("status", "active")

      if (query.timeRange) {
         dbQuery = dbQuery
            .gte("created_at", query.timeRange.start)
            .lte("created_at", query.timeRange.end)
      }

      if (query.categories && query.categories.length > 0) {
         dbQuery = dbQuery.in("ai_analysis_result->>topic", query.categories)
      }

      if (query.weather && query.weather.length > 0) {
         dbQuery = dbQuery.in("weather_condition", query.weather)
      }

      const { data: records, error } = await dbQuery
         .order("created_at", { ascending: false })
         .range(query.offset, query.offset + query.limit - 1)

      if (error) {
         throw error
      }

      return await Promise.all(
         (records ?? []).map((record: SoundPinRecord) =>
            this.toDomainModel(record),
         ),
      )
   }

   /**
    * RPCではカバーできない条件（時間帯・カテゴリ・天気）をアプリ側で絞り込み、
    * limit/offsetを適用する
    */
   private applyPostFilters(
      pins: SoundPinAPI[],
      query: SearchPinsQuery,
   ): SoundPinAPI[] {
      let filtered = pins

      if (query.timeRange) {
         const start = new Date(query.timeRange.start).getTime()
         const end = new Date(query.timeRange.end).getTime()
         filtered = filtered.filter((pin) => {
            const createdAt = new Date(pin.createdAt).getTime()
            return createdAt >= start && createdAt <= end
         })
      }

      if (query.categories && query.categories.length > 0) {
         const categories = query.categories
         filtered = filtered.filter((pin) => {
            const topic = pin.aiAnalysis?.categories.topic
            return topic !== undefined && categories.includes(topic)
         })
      }

      if (query.weather && query.weather.length > 0) {
         const weather = query.weather
         filtered = filtered.filter((pin) => {
            const condition = pin.weather?.condition
            return condition != null && weather.includes(condition)
         })
      }

      return filtered.slice(query.offset, query.offset + query.limit)
   }
}

// 環境変数の型安全なアクセス
const isDevelopment = process.env["NODE_ENV"] === "development"
