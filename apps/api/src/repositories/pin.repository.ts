import {
	ERROR_CODES,
	type LocationCoordinates,
	type NearbyPinsQuery,
	type SoundPinAPI,
} from "@sonory/shared-types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { APIException } from "../middleware/error";
import type {
	PostGISPoint,
	SoundPinInsert,
	SoundPinRecord,
	SoundPinUpdate,
} from "../types/database";
import { Logger } from "../utils/logger";

/**
 * Repository for sound pins data access
 * Handles all database operations for sound pins
 */
export class PinRepository {
	private logger: Logger;

	/**
	 * Creates a new PinRepository instance
	 * @param supabase - Supabase client instance
	 * @param requestId - Request ID for logging
	 */
	constructor(
		private supabase: SupabaseClient,
		private requestId?: string,
	) {
		this.logger = new Logger("INFO");
	}

	/**
	 * Converts database record to domain model
	 * @param record - Database record
	 * @returns Domain model
	 */
	private toDomainModel(record: SoundPinRecord): SoundPinAPI {
		const location = JSON.parse(record.location) as PostGISPoint;

		return {
			id: record.id,
			...(record.user_id ? { userId: record.user_id } : {}),
			location: {
				lat: location.coordinates[1],
				lng: location.coordinates[0],
			},
			audio: {
				url: record.audio_url,
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
			...(record.ai_transcription
				? {
						aiAnalysis: {
							transcription: record.ai_transcription,
							categories: {
								emotion: record.ai_emotion || "",
								topic: record.ai_topic || "",
								language: record.ai_language || "",
								confidence: record.ai_confidence || 0,
							},
							...(record.ai_summary ? { summary: record.ai_summary } : {}),
						},
					}
				: {}),
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
		};
	}

	/**
	 * Creates a new sound pin
	 * @param data - Pin data to create
	 * @returns Created pin
	 * @throws APIException on database error
	 */
	async create(data: SoundPinInsert): Promise<SoundPinAPI> {
		try {
			const { data: record, error } = await this.supabase
				.from("sound_pins")
				.insert(data)
				.select()
				.single();

			if (error) {
				throw error;
			}

			this.logger.info("Pin created", {
				pinId: record.id,
				requestId: this.requestId,
			});
			return this.toDomainModel(record);
		} catch (error) {
			this.logger.error("Failed to create pin", {
				error: error instanceof Error ? error.message : String(error),
				requestId: this.requestId,
			});
			throw new APIException(
				ERROR_CODES.DATABASE_ERROR,
				"Failed to create pin",
				500,
				error instanceof Error ? { message: error.message } : undefined,
			);
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
			const { data: record, error } = await this.supabase
				.from("sound_pins")
				.select()
				.eq("id", id)
				.single();

			if (error) {
				if (error.code === "PGRST116") {
					return null; // Not found
				}
				throw error;
			}

			return this.toDomainModel(record);
		} catch (error) {
			this.logger.error("Failed to find pin by ID", {
				error: error instanceof Error ? error.message : String(error),
				pinId: id,
				requestId: this.requestId,
			});
			throw new APIException(
				ERROR_CODES.DATABASE_ERROR,
				"Failed to find pin",
				500,
				error instanceof Error ? { message: error.message } : undefined,
			);
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
			const { data: record, error } = await this.supabase
				.from("sound_pins")
				.update(data)
				.eq("id", id)
				.select()
				.single();

			if (error) {
				if (error.code === "PGRST116") {
					return null; // Not found
				}
				throw error;
			}

			this.logger.info("Pin updated", {
				pinId: id,
				requestId: this.requestId,
			});
			return this.toDomainModel(record);
		} catch (error) {
			this.logger.error("Failed to update pin", {
				error: error instanceof Error ? error.message : String(error),
				pinId: id,
				requestId: this.requestId,
			});
			throw new APIException(
				ERROR_CODES.DATABASE_ERROR,
				"Failed to update pin",
				500,
				error instanceof Error ? { message: error.message } : undefined,
			);
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
			const { data, error } = await this.supabase
				.from("sound_pins")
				.update({
					status: "deleted" as const,
					deleted_at: new Date().toISOString(),
				})
				.eq("id", id)
				.select();

			if (error) {
				throw error;
			}

			const deleted = data.length > 0;
			if (deleted) {
				this.logger.info("Pin deleted", {
					pinId: id,
					requestId: this.requestId,
				});
			}

			return deleted;
		} catch (error) {
			this.logger.error("Failed to delete pin", {
				error: error instanceof Error ? error.message : String(error),
				pinId: id,
				requestId: this.requestId,
			});
			throw new APIException(
				ERROR_CODES.DATABASE_ERROR,
				"Failed to delete pin",
				500,
				error instanceof Error ? { message: error.message } : undefined,
			);
		}
	}

	/**
	 * Finds pins within specified bounds
	 * @param query - Query parameters
	 * @returns Array of pins
	 * @throws APIException on database error
	 */
	async findWithinBounds(query: NearbyPinsQuery): Promise<SoundPinAPI[]> {
		try {
			// Build PostGIS query using ST_Within
			const boundsWKT = `POLYGON((
        ${query.bounds.west} ${query.bounds.south},
        ${query.bounds.east} ${query.bounds.south},
        ${query.bounds.east} ${query.bounds.north},
        ${query.bounds.west} ${query.bounds.north},
        ${query.bounds.west} ${query.bounds.south}
      ))`;

			let queryBuilder = this.supabase
				.from("sound_pins")
				.select()
				.eq("status", "active")
				.filter("location", "cd", {
					type: "within",
					args: { geojson: boundsWKT },
				});

			// Apply category filter if provided
			if (query.categories && query.categories.length > 0) {
				queryBuilder = queryBuilder.in("ai_topic", query.categories);
			}

			// Apply limit
			queryBuilder = queryBuilder.limit(query.limit ?? 50);

			const { data: records, error } = await queryBuilder;

			if (error) {
				throw error;
			}

			return records.map((record) => this.toDomainModel(record));
		} catch (error) {
			this.logger.error("Failed to find pins within bounds", {
				error: error instanceof Error ? error.message : String(error),
				bounds: query.bounds,
				requestId: this.requestId,
			});
			throw new APIException(
				ERROR_CODES.DATABASE_ERROR,
				"Failed to find pins",
				500,
				error instanceof Error ? { message: error.message } : undefined,
			);
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
			const { data: records, error } = await this.supabase.rpc(
				"find_nearby_pins",
				{
					lat: center.lat,
					lng: center.lng,
					radius_meters: radiusKm * 1000,
					max_results: limit,
				},
			);

			if (error) {
				throw error;
			}

			return records.map((record: SoundPinRecord) =>
				this.toDomainModel(record),
			);
		} catch (error) {
			this.logger.error("Failed to find nearby pins", {
				error: error instanceof Error ? error.message : String(error),
				center,
				radiusKm,
				requestId: this.requestId,
			});
			throw new APIException(
				ERROR_CODES.DATABASE_ERROR,
				"Failed to find nearby pins",
				500,
				error instanceof Error ? { message: error.message } : undefined,
			);
		}
	}
}
