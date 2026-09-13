import { ERROR_CODES } from "@sonory/shared-types"
import type { AppMiddleware } from "../types/api"
import { APIException } from "./error"

/** scheduled() が内部ディスパッチに使うホスト名 */
const INTERNAL_HOST = "scheduled.sonory.internal"

/**
 * 内部ディスパッチ専用ルートのガード
 *
 * scheduled() は app.fetch() に内部ホスト名の Request を渡す（ワーカー外に出ない）。
 * 公開URLにこのホスト名はルーティングされないため、外部からは到達できない。
 * ヘッダーは単体では偽装可能だが、ホスト名と組み合わせることで意図を明示する。
 */
export const requireInternalDispatch: AppMiddleware = async (c, next) => {
   const isInternalHost = new URL(c.req.url).hostname === INTERNAL_HOST
   const hasScheduledHeader = c.req.header("x-sonory-scheduled") === "true"

   if (!isInternalHost || !hasScheduledHeader) {
      throw new APIException(
         ERROR_CODES.FORBIDDEN,
         "このエンドポイントは内部処理専用です",
         403,
      )
   }

   await next()
}
