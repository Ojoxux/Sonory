import { z } from "zod";

/**
 * 位置情報のスキーマ
 */
export const LocationSchema = z.object({
	lat: z.number().min(-90).max(90),
	lng: z.number().min(-180).max(180),
	accuracy: z.number().positive().optional(),
});

/**
 * 天気情報のスキーマ
 */
export const WeatherDataSchema = z.object({
	temperature: z.number(),
	condition: z.enum(["sunny", "cloudy", "rainy", "snowy", "foggy", "windy"]),
	windSpeed: z.number().optional(),
	humidity: z.number().min(0).max(100).optional(),
});

/**
 * 音声ピン作成リクエストのスキーマ
 */
export const SoundPinCreateRequestSchema = z.object({
	location: LocationSchema,
	audio: z.object({
		file: z.instanceof(File),
		duration: z.number().positive(),
		format: z.enum(["webm", "mp3", "wav"]),
	}),
	context: z
		.object({
			weather: WeatherDataSchema.optional(),
			timeTag: z.enum(["朝", "昼", "夕", "夜"]),
			deviceInfo: z.string().optional(),
		})
		.optional(),
});

/**
 * AI分析結果のスキーマ
 */
export const AIAnalysisResultSchema = z.object({
	transcription: z.string(),
	categories: z.object({
		emotion: z.string(),
		topic: z.string(),
		language: z.string(),
		confidence: z.number().min(0).max(1),
	}),
	summary: z.string().optional(),
});

/**
 * 音声ピンのスキーマ
 */
export const SoundPinSchema = z.object({
	id: z.string().uuid(),
	latitude: z.number(),
	longitude: z.number(),
	primaryLabel: z.string(),
	primaryConfidence: z.number().min(0).max(1),
	recordedAt: z.string().datetime(),
	audioFilePath: z.string().optional(),
	classificationResults: z.array(z.unknown()).optional(),
	weatherData: WeatherDataSchema.optional(),
	timeTag: z.string().optional(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

/**
 * 近隣ピン検索クエリのスキーマ
 */
export const NearbyPinsQuerySchema = z.object({
	bounds: z.object({
		north: z.number(),
		south: z.number(),
		east: z.number(),
		west: z.number(),
	}),
	limit: z.number().positive().max(100).default(50),
	categories: z.array(z.string()).optional(),
});

/**
 * ピン検索クエリのスキーマ
 */
export const SearchPinsQuerySchema = z.object({
	location: z
		.object({
			lat: z.number(),
			lng: z.number(),
			radius: z.number().positive(), // km
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
});

/**
 * APIエラーレスポンスのスキーマ
 */
export const APIErrorSchema = z.object({
	code: z.string(),
	message: z.string(),
	details: z.unknown().optional(),
	timestamp: z.string().datetime(),
	requestId: z.string(),
});

/**
 * API成功レスポンスの型定義
 */
export interface APIResponse<T = unknown> {
	success: true;
	data: T;
}

/**
 * APIエラーレスポンスの型定義
 */
export interface APIErrorResponse {
	success: false;
	error: APIError;
}

// 型エクスポート
export type Location = z.infer<typeof LocationSchema>;
export type WeatherData = z.infer<typeof WeatherDataSchema>;
export type SoundPinCreateRequest = z.infer<typeof SoundPinCreateRequestSchema>;
export type AIAnalysisResult = z.infer<typeof AIAnalysisResultSchema>;
export type SoundPin = z.infer<typeof SoundPinSchema>;
export type NearbyPinsQuery = z.infer<typeof NearbyPinsQuerySchema>;
export type SearchPinsQuery = z.infer<typeof SearchPinsQuerySchema>;
export type APIError = z.infer<typeof APIErrorSchema>;

/**
 * 標準エラーコード定数
 */
export const ERROR_CODES = {
	// 音声関連
	AUDIO_TOO_LARGE: "AUDIO_TOO_LARGE",
	INVALID_AUDIO_FORMAT: "INVALID_AUDIO_FORMAT",
	AUDIO_DURATION_INVALID: "AUDIO_DURATION_INVALID",

	// 位置関連
	INVALID_LOCATION: "INVALID_LOCATION",
	LOCATION_OUT_OF_BOUNDS: "LOCATION_OUT_OF_BOUNDS",

	// AI分析関連
	AI_ANALYSIS_FAILED: "AI_ANALYSIS_FAILED",
	AI_SERVICE_UNAVAILABLE: "AI_SERVICE_UNAVAILABLE",

	// システム関連
	RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
	INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
	DATABASE_ERROR: "DATABASE_ERROR",
	STORAGE_ERROR: "STORAGE_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
