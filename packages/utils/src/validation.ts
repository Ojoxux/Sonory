import { z } from 'zod'

interface Location {
   lat: number
   lng: number
   accuracy?: number
}

interface WeatherData {
   temperature: number
   condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'foggy' | 'windy'
   windSpeed?: number
   humidity?: number
}

/**
 * 位置情報の有効性をチェック
 */
export function validateLocation(location: unknown): location is Location {
   try {
      const LocationSchema = z.object({
         lat: z.number().min(-90).max(90),
         lng: z.number().min(-180).max(180),
         accuracy: z.number().positive().optional(),
      })

      LocationSchema.parse(location)
      return true
   } catch {
      return false
   }
}

/**
 * 音声ファイルの形式をチェック
 */
export function validateAudioFormat(file: File): boolean {
   const allowedTypes = ['audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/wav']
   return allowedTypes.includes(file.type)
}

/**
 * 音声ファイルのサイズをチェック（10MB制限）
 */
export function validateAudioSize(file: File): boolean {
   const maxSize = 10 * 1024 * 1024 // 10MB
   return file.size <= maxSize
}

/**
 * 音声ファイルの長さをチェック（10秒制限）
 */
export function validateAudioDuration(duration: number): boolean {
   return duration > 0 && duration <= 10
}

/**
 * 天気データの有効性をチェック
 */
export function validateWeatherData(weather: unknown): weather is WeatherData {
   try {
      const WeatherDataSchema = z.object({
         temperature: z.number(),
         condition: z.enum([
            'sunny',
            'cloudy',
            'rainy',
            'snowy',
            'foggy',
            'windy',
         ]),
         windSpeed: z.number().optional(),
         humidity: z.number().min(0).max(100).optional(),
      })

      WeatherDataSchema.parse(weather)
      return true
   } catch {
      return false
   }
}

/**
 * 時間タグを生成（6時間区切り）
 */
export function generateTimeTag(
   date: Date = new Date(),
): '朝' | '昼' | '夕' | '夜' {
   const hour = date.getHours()

   if (hour >= 6 && hour < 12) return '朝'
   if (hour >= 12 && hour < 18) return '昼'
   if (hour >= 18 && hour < 24) return '夕'
   return '夜'
}

/**
 * UUIDの有効性をチェック
 */
export function validateUUID(uuid: string): boolean {
   const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
   return uuidRegex.test(uuid)
}
