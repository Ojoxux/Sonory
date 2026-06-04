import { z } from "zod"

/**
 * 時間タグスキーマ（6時間区切り）
 */
export const TimeTagSchema = z.enum(["朝", "昼", "夕", "夜"])
export type TimeTag = z.infer<typeof TimeTagSchema>

/**
 * API用位置情報のスキーマ（lat/lng形式）
 */
export const LocationCoordinatesSchema = z.object({
   lat: z.number().min(-90).max(90),
   lng: z.number().min(-180).max(180),
   accuracy: z.number().positive().optional(),
})
export type LocationCoordinates = z.infer<typeof LocationCoordinatesSchema>

/**
 * 地図境界のスキーマ
 */
export const MapBoundsSchema = z.object({
   north: z.number().min(-90).max(90),
   south: z.number().min(-90).max(90),
   east: z.number().min(-180).max(180),
   west: z.number().min(-180).max(180),
})
export type MapBounds = z.infer<typeof MapBoundsSchema>
