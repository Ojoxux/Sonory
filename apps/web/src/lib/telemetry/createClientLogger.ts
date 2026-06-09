import { createLogger, type Logger } from "@sonory/utils"

import { createConsoleSink } from "./sinks/consoleSink"
import { createSentrySink } from "./sinks/sentrySink"

const isDevelopment = process.env.NODE_ENV === "development"

/**
 * ブラウザ向けロガーを生成する。
 *
 * @description
 * - `debug` / `info`: 開発環境のみコンソール出力
 * - `warn` / `error`: 本番では Sentry へ転送（DSN 設定時）
 * - 位置情報・音声 URL など PII は context に載せないこと
 *
 * @param namespace - ログの発生元（例: `"SoundPinMarkers"`）
 * @returns 名前空間付きロガー
 *
 * @example
 * ```ts
 * const log = createClientLogger("recording")
 * log.debug("Recorder started")
 * log.error("Upload failed", { code: "NETWORK_ERROR" })
 * ```
 */
export function createClientLogger(namespace: string): Logger {
   const consoleSink = createConsoleSink()
   const sentrySink = createSentrySink(namespace)

   return createLogger({
      namespace,
      minLevel: isDevelopment ? "debug" : "warn",
      sinks: {
         debug: isDevelopment ? consoleSink.debug : undefined,
         info: isDevelopment ? consoleSink.info : sentrySink.info,
         warn: (message, context) => {
            if (isDevelopment) {
               consoleSink.warn(message, context)
            }
            sentrySink.warn(message, context)
         },
         error: (message, context) => {
            if (isDevelopment) {
               consoleSink.error(message, context)
            }
            sentrySink.error(message, context)
         },
      },
   })
}
