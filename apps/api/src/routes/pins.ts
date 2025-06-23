import {
   ERROR_CODES,
   type NearbyPinsQuery,
   type SearchPinsQuery,
} from '@sonory/shared-types'
import { Hono } from 'hono'
import { z } from 'zod'
import { APIException } from '../middleware/error'
import { validate } from '../middleware/validation'
import { PinService } from '../services/pin.service'
import type { Env } from '../types/api'

const app = new Hono<{ Bindings: Env }>()

/**
 * Request validation schemas
 */
const createPinSchema = z.object({
   userId: z.string().uuid().optional(),
   location: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      accuracy: z.number().positive().optional(),
   }),
   audio: z.object({
      url: z.string().url(),
      duration: z.number().positive().max(600),
      format: z.enum(['webm', 'mp3', 'wav']),
   }),
   weather: z
      .object({
         temperature: z.number(),
         condition: z.string().optional(),
         windSpeed: z.number().optional(),
         humidity: z.number().min(0).max(100).optional(),
      })
      .optional(),
   timeTag: z.enum(['朝', '昼', '夕', '夜']).optional(),
   title: z.string().max(200).optional(),
   deviceInfo: z.string().optional(),
})

const updatePinSchema = z.object({
   title: z.string().max(200).optional(),
   status: z.enum(['active', 'processing', 'deleted', 'reported']).optional(),
   aiAnalysis: z
      .object({
         transcription: z.string(),
         categories: z.object({
            emotion: z.string(),
            topic: z.string(),
            language: z.string(),
            confidence: z.number().min(0).max(1),
         }),
         summary: z.string().optional(),
      })
      .optional(),
})

const nearbyPinsSchema = z.object({
   north: z.coerce.number().min(-90).max(90),
   south: z.coerce.number().min(-90).max(90),
   east: z.coerce.number().min(-180).max(180),
   west: z.coerce.number().min(-180).max(180),
   limit: z.coerce.number().positive().max(100).optional(),
   categories: z.array(z.string()).optional(),
})

const searchPinsSchema = z.object({
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

const reportPinSchema = z.object({
   reason: z.string().min(10).max(1000),
})

/**
 * POST /api/pins - Create a new pin
 */
app.post('/', validate('json', createPinSchema), async (c) => {
   const service = new PinService(c)
   const data = await c.req.json()

   const pin = await service.createPin(data)

   return c.json({
      success: true,
      data: pin,
   })
})

/**
 * GET /api/pins/:id - Get pin by ID
 */
app.get('/:id', async (c) => {
   const service = new PinService(c)
   const id = c.req.param('id')

   const pin = await service.getPinById(id)

   if (!pin) {
      throw new APIException(ERROR_CODES.DATABASE_ERROR, 'Pin not found', 404)
   }

   return c.json({
      success: true,
      data: pin,
   })
})

/**
 * PUT /api/pins/:id - Update pin
 */
app.put('/:id', validate('json', updatePinSchema), async (c) => {
   const service = new PinService(c)
   const id = c.req.param('id')
   const data = await c.req.json()

   const pin = await service.updatePin(id, data)

   if (!pin) {
      throw new APIException(ERROR_CODES.DATABASE_ERROR, 'Pin not found', 404)
   }

   return c.json({
      success: true,
      data: pin,
   })
})

/**
 * DELETE /api/pins/:id - Delete pin
 */
app.delete('/:id', async (c) => {
   const service = new PinService(c)
   const id = c.req.param('id')

   const deleted = await service.deletePin(id)

   if (!deleted) {
      throw new APIException(ERROR_CODES.DATABASE_ERROR, 'Pin not found', 404)
   }

   return c.json({
      success: true,
      data: { deleted: true },
   })
})

/**
 * GET /api/pins/nearby - Get nearby pins
 */
app.get('/nearby', validate('query', nearbyPinsSchema), async (c) => {
   const service = new PinService(c)
   const validated = c.req.valid('query')

   const nearbyQuery: NearbyPinsQuery = {
      bounds: {
         north: validated.north,
         south: validated.south,
         east: validated.east,
         west: validated.west,
      },
      limit: validated.limit ?? 50,
      categories: validated.categories,
   }

   const pins = await service.getNearbyPins(nearbyQuery)

   return c.json({
      success: true,
      data: pins,
   })
})

/**
 * GET /api/pins/search - Search pins with filters
 */
app.get('/search', validate('query', searchPinsSchema), async (c) => {
   const service = new PinService(c)
   const validated = c.req.valid('query')

   const searchQuery: SearchPinsQuery = {
      ...(validated.lat && validated.lng && validated.radius
         ? {
              location: {
                 lat: validated.lat,
                 lng: validated.lng,
                 radius: validated.radius,
              },
           }
         : {}),
      ...(validated.startTime && validated.endTime
         ? {
              timeRange: {
                 start: validated.startTime,
                 end: validated.endTime,
              },
           }
         : {}),
      categories: validated.categories,
      weather: validated.weather,
      limit: validated.limit ?? 50,
      offset: validated.offset ?? 0,
   }

   const pins = await service.searchPins(searchQuery)

   return c.json({
      success: true,
      data: pins,
   })
})

/**
 * GET /api/pins/user/:userId - Get user's pins
 */
app.get('/user/:userId', async (c) => {
   const service = new PinService(c)
   const userId = c.req.param('userId')

   const pins = await service.getUserPins(userId)

   return c.json({
      success: true,
      data: pins,
   })
})

/**
 * POST /api/pins/batch - Create multiple pins
 */
app.post('/batch', validate('json', z.array(createPinSchema)), async (c) => {
   const service = new PinService(c)
   const data = await c.req.json()

   const pins = await service.createPinsBatch(data)

   return c.json({
      success: true,
      data: pins,
      meta: {
         requested: data.length,
         created: pins.length,
      },
   })
})

/**
 * POST /api/pins/:id/report - Report a pin
 */
app.post('/:id/report', validate('json', reportPinSchema), async (c) => {
   const service = new PinService(c)
   const id = c.req.param('id')
   const { reason } = await c.req.json()

   const reported = await service.reportPin(id, reason)

   if (!reported) {
      throw new APIException(ERROR_CODES.DATABASE_ERROR, 'Pin not found', 404)
   }

   return c.json({
      success: true,
      data: { reported: true },
   })
})

export default app
