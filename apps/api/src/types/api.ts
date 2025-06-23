import type { Env } from "@/index";
import type { Context as HonoContext, MiddlewareHandler } from "hono";

/**
 * アプリケーションコンテキストの型定義
 */
export type AppContext = HonoContext<{
	Bindings: Env;
	Variables: {
		requestId: string;
		userId?: string;
	};
}>;

/**
 * ミドルウェアハンドラーの型定義
 * Honoの標準的なMiddlewareHandlerを使用
 */
export type AppMiddleware = MiddlewareHandler<{
	Bindings: Env;
	Variables: {
		requestId: string;
		userId?: string;
	};
}>;

/**
 * ルートハンドラーの型定義
 */
export type AppHandler = (c: AppContext) => Response | Promise<Response>;
