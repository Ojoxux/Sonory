import type { ZodTypeAny } from "zod"
import type { Hook } from "@hono/zod-validator"
import type { Env, ValidationTargets } from "hono"
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
/**
 * zValidator 用の共通エラーハンドラ
 */
export const onZodValidationError: Hook<
   unknown,
   Env,
   string,
   keyof ValidationTargets
> = (result, _c) => {
   if (!result.success) {
      const errors = result.error.flatten().fieldErrors
      throw new APIException(
         BACKEND_ERROR_CODES.INVALID_REQUEST,
         formatValidationErrors(errors),
         400,
         { errors },
      )
   }
}
