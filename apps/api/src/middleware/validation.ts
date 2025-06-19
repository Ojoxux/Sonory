import { APIException, BACKEND_ERROR_CODES } from '@/middleware/error'
import { zValidator } from '@hono/zod-validator'
import type { ZodSchema } from 'zod'

/**
 * バリデーションエラーのフォーマット
 */
export const formatValidationErrors = (
   errors: Record<string, unknown>,
): string => {
   const messages = Object.entries(errors)
      .map(([field, error]) => `${field}: ${error}`)
      .join(', ')
   return `Validation failed: ${messages}`
}

/**
 * カスタムバリデーションミドルウェア
 * @description Zodスキーマを使用してリクエストをバリデート
 */
export const validate = <T>(
   target: 'json' | 'query' | 'param',
   schema: ZodSchema<T>,
) => {
   return zValidator(target, schema, (result, _c) => {
      if (!result.success) {
         const errors = result.error.flatten().fieldErrors
         throw new APIException(
            BACKEND_ERROR_CODES.INVALID_REQUEST,
            formatValidationErrors(errors),
            400,
            { errors },
         )
      }
   })
}
