import { z } from "zod"

/**
 * 天気情報のスキーマ
 *
 * condition は自由文字列（日本語の天気表現にも対応: "晴れ", "曇り" 等）
 * DBでnull許容のため optional
 */
export const WeatherDataSchema = z.object({
   temperature: z.number(),
   condition: z.string().optional(),
   windSpeed: z.number().optional(),
   humidity: z.number().min(0).max(100).optional(),
})
export type WeatherData = z.infer<typeof WeatherDataSchema>
