import type { APIError } from '@sonory/shared-types'
import { ERROR_CODES } from '@sonory/shared-types'
import type { Context, Next } from 'hono'
import { HTTPException } from 'hono/http-exception'

// ERROR_CODESを再エクスポート
export { ERROR_CODES }

// 追加のエラーコード（バックエンド固有）
export const BACKEND_ERROR_CODES = {
  // バリデーション関連
  INVALID_REQUEST: 'INVALID_REQUEST',
  // 認証関連
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
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
    this.name = 'APIException'
  }
}

/**
 * エラーハンドリングミドルウェア
 * @description すべてのエラーを統一フォーマットで返す
 */
export const errorHandler = async (c: Context, next: Next) => {
  try {
    await next()
  } catch (error) {
    const requestId = c.get('requestId') || crypto.randomUUID()
    const timestamp = new Date().toISOString()

    // APIExceptionの場合
    if (error instanceof APIException) {
      const apiError: APIError = {
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp,
        requestId,
      }

      // カスタムレスポンスを作成
      return new Response(JSON.stringify({ success: false, error: apiError }), {
        status: error.statusCode,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    // HTTPExceptionの場合
    if (error instanceof HTTPException) {
      const apiError: APIError = {
        code: 'HTTP_ERROR',
        message: error.message,
        timestamp,
        requestId,
      }

      return new Response(JSON.stringify({ success: false, error: apiError }), {
        status: error.status,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    // その他のエラー
    console.error('Unhandled error:', error)
    const apiError: APIError = {
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred',
      timestamp,
      requestId,
    }

    return new Response(JSON.stringify({ success: false, error: apiError }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
}
