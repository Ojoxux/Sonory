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
      // エラーをフィールドごとに集約
      const errorObj = result.error
      if ("issues" in errorObj) {
         const fieldErrors: Record<string, unknown> = {}
         for (const issue of errorObj.issues) {
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
      // 予備: issues が無い型でも安全に文字列化
      throw new APIException(
         BACKEND_ERROR_CODES.INVALID_REQUEST,
         "Validation failed",
         400,
      )
   }
}
