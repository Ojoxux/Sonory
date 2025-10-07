import { zValidator } from "@hono/zod-validator"
import * as z from "zod"
import { APIException, BACKEND_ERROR_CODES } from "./error"

/**
 * バリデーションエラーのフォーマット
 */
export const formatValidationErrors = (
   errors: Record<string, unknown>,
): string => {
   const messages = Object.entries(errors)
      .map(([field, error]) => `${field}: ${error}`)
      .join(", ")
   return `Validation failed: ${messages}`
}

/**
 * カスタムバリデーションミドルウェア
 * @description Zodスキーマを使用してリクエストをバリデート
 */
export const validate = <T extends z.ZodTypeAny>(
   target: "json" | "query" | "param",
   schema: T,
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
