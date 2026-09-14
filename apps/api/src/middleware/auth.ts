import { ERROR_CODES } from "@sonory/shared-types"
import { getSupabaseUserClient } from "../services/supabase"
import type { AppMiddleware } from "../types/api"
import { APIException } from "./error"

/**
 * 認証ミドルウェア
 *
 * `Authorization: Bearer <token>` を検証し、`userId` をコンテキストにセットする。
 * 検証用クライアントは `getSupabaseUserClient` 経由でリクエストごとに生成する
 * （Workers ではリクエスト毎に JWT が異なるためキャッシュ不可）。
 */

const BEARER_PREFIX = /^Bearer\s+/i

/** `Authorization` ヘッダーからトークンを取り出す。無い/不正なら null */
function extractBearerToken(header: string | undefined): string | null {
   if (!header || !BEARER_PREFIX.test(header)) {
      return null
   }

   const token = header.replace(BEARER_PREFIX, "").trim()
   return token.length > 0 ? token : null
}

/**
 * トークン必須。無い/不正なら `UNAUTHORIZED` で 401 を投げる。
 */
export const requireAuth: AppMiddleware = async (c, next) => {
   const token = extractBearerToken(c.req.header("Authorization"))

   if (!token) {
      throw new APIException(
         ERROR_CODES.UNAUTHORIZED,
         "認証トークンが必要です",
         401,
      )
   }

   const { data, error } = await getSupabaseUserClient(c).auth.getUser(token)

   if (error || !data.user) {
      throw new APIException(
         ERROR_CODES.UNAUTHORIZED,
         "認証トークンが無効です",
         401,
      )
   }

   c.set("userId", data.user.id)
   await next()
}

/**
 * トークンがあれば `userId` をセットし、無ければ未認証のまま続行する。
 */
export const optionalAuth: AppMiddleware = async (c, next) => {
   const token = extractBearerToken(c.req.header("Authorization"))

   if (token) {
      const { data, error } = await getSupabaseUserClient(c).auth.getUser(token)

      if (!error && data.user) {
         c.set("userId", data.user.id)
      }
   }

   await next()
}
