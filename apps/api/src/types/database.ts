/**
 * Database record types for Supabase tables
 */

/**
 * Raw database record for sound_pins table
 */
export interface SoundPinRecord {
   id: string
   user_id: string | null
   location: string // PostGIS geography stored as WKT or GeoJSON string
   audio_url: string
   audio_duration: number
   audio_format: "webm" | "mp3" | "wav"
   weather_temperature: number | null
   weather_condition: string | null
   weather_wind_speed: number | null
   weather_humidity: number | null
   time_tag: "朝" | "昼" | "夕" | "夜" | null
   status: "active" | "processing" | "deleted" | "reported"
   title: string | null
   device_info: string | null
   created_at: string
   updated_at: string
   deleted_at: string | null
   ai_analysis_result: {
      transcription?: string
      emotion?: string
      topic?: string
      language?: string
      confidence?: number
      summary?: string
      classifications?: string[]
      analyzed_at?: string
   } | null
}

/**
 * PostGIS Point type
 */
export interface PostGISPoint {
   type: "Point"
   coordinates: [number, number] // [longitude, latitude]
}

/**
 * Insert data for sound_pins table
 */
export type SoundPinInsert = Omit<
   SoundPinRecord,
   "id" | "created_at" | "updated_at" | "deleted_at"
>

/**
 * Update data for sound_pins table
 */
export type SoundPinUpdate = Partial<
   Omit<SoundPinRecord, "id" | "created_at" | "updated_at">
>
