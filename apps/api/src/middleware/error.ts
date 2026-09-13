import type { APIError } from "@sonory/shared-types"
import { ERROR_CODES } from "@sonory/shared-types"
import type { Context } from "hono"
import { HTTPException } from "hono/http-exception"

// ERROR_CODESを再エクスポート
export { ERROR_CODES }

// 追加のエラーコード（バックエンド固有）
// 認証関連のコード（UNAUTHORIZED / FORBIDDEN）は @sonory/shared-types の
// ERROR_CODES に統合済み。こちらにはバックエンド固有のコードのみを残す。
export const BACKEND_ERROR_CODES = {
   // バリデーション関連
   INVALID_REQUEST: "INVALID_REQUEST",
} as const

/**
 * カスタムAPIエラークラス
 */
export class APIException extends Error {
   constructor(
      public code: string,
      public message: string,
      public statusCode = 400,
      public details?: unknown,
   ) {
      super(message)
      this.name = "APIException"
   }
}

/**
 * エラーハンドラ
 *
 * すべてのエラーを統一フォーマットの JSON で返す。
 *
 * ⚠️ ミドルウェア (`app.use`) として登録してはいけない。Hono の compose は
 * ハンドラが投げた例外をアプリの onError に回すため、外側ミドルウェアの
 * try/catch には届かず、既定の平文 "Internal Server Error" が返ってしまう。
 * 必ず `app.onError(errorHandler)` で登録すること。
 */
export const errorHandler = (error: Error, c: Context): Response => {
   const requestId = c.get("requestId") || crypto.randomUUID()
   const timestamp = new Date().toISOString()

   if (error instanceof APIException) {
      const apiError: APIError = {
         code: error.code,
         message: error.message,
         details: error.details,
         timestamp,
         requestId,
      }

      return new Response(JSON.stringify({ success: false, error: apiError }), {
         status: error.statusCode,
         headers: { "Content-Type": "application/json" },
      })
   }

   if (error instanceof HTTPException) {
      const apiError: APIError = {
         code: "HTTP_ERROR",
         message: error.message,
         timestamp,
         requestId,
      }

      return new Response(JSON.stringify({ success: false, error: apiError }), {
         status: error.status,
         headers: { "Content-Type": "application/json" },
      })
   }

   console.error("Unhandled error:", error)

   const apiError: APIError = {
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      message: "An unexpected error occurred",
      timestamp,
      requestId,
   }

   return new Response(JSON.stringify({ success: false, error: apiError }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
   })
}
