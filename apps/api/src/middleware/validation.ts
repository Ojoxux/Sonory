import type { Hook as ZodValidatorHook } from "@hono/zod-validator"
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
const throwValidationError = (result: { error?: unknown }): void => {
   const errorObj = result.error

   if (errorObj && typeof errorObj === "object" && "issues" in errorObj) {
      const fieldErrors: Record<string, unknown> = {}
      for (const issue of errorObj.issues as Array<{
         path?: Array<string | number>
         message: string
      }>) {
         const path = (issue.path ?? []).join(".") || "_root"
         const prev = fieldErrors[path]
         fieldErrors[path] = prev
            ? Array.isArray(prev)
               ? [...prev, issue.message]
               : [prev, issue.message]
            : issue.message
      }
      throw new APIException(
         BACKEND_ERROR_CODES.INVALID_REQUEST,
         formatValidationErrors(fieldErrors),
         400,
         { errors: fieldErrors },
      )
   }

   throw new APIException(
      BACKEND_ERROR_CODES.INVALID_REQUEST,
      "Validation failed",
      400,
   )
}

export const onZodValidationError: ZodValidatorHook<
   unknown,
   Env,
   string,
   keyof ValidationTargets
> = (result, _c) => {
   if (!result.success) {
      throwValidationError(result)
   }
}

type OpenAPIValidationResult =
   | { success: true }
   | { success: false; error: unknown }

export const onOpenAPIValidationError = (
   result: OpenAPIValidationResult,
): void => {
   if (!result.success) {
      throwValidationError(result)
   }
}
