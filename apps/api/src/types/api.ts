import type { Context as HonoContext, MiddlewareHandler } from "hono"
import type { Env, Variables } from "../index"

export type { Env, Variables }

/**
 * アプリケーションコンテキストの型定義
 */
export type AppContext = HonoContext<{
   Bindings: Env
   Variables: Variables & { requestId: string }
}>

/**
 * ミドルウェアハンドラーの型定義
 * Honoの標準的なMiddlewareHandlerを使用
 */
export type AppMiddleware = MiddlewareHandler<{
   Bindings: Env
   Variables: Variables & { requestId: string }
}>

/**
 * ルートハンドラーの型定義
 */
export type AppHandler = (c: AppContext) => Response | Promise<Response>
