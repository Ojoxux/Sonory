import type { LogContext, LogLevel, Logger, LoggerConfig } from "./types.js"

const LOG_LEVEL_ORDER: Readonly<Record<LogLevel, number>> = {
   debug: 0,
   info: 1,
   warn: 2,
   error: 3,
}

/**
 * 指定レベル以上のログのみを出力するロガーを生成する。
 *
 * @param config - 名前空間・最小レベル・出力先シンク
 * @returns 構造化ログ用ロガー
 *
 * @example
 * ```ts
 * const logger = createLogger({
 *   namespace: "map",
 *   minLevel: "info",
 *   sinks: { info: (message) => console.info(message) },
 * })
 * logger.info("Map initialized", { zoom: 12 })
 * ```
 */
export function createLogger(config: LoggerConfig): Logger {
   const shouldLog = (level: LogLevel): boolean =>
      LOG_LEVEL_ORDER[level] >= LOG_LEVEL_ORDER[config.minLevel]

   const emit = (
      level: LogLevel,
      message: string,
      context?: LogContext,
   ): void => {
      if (!shouldLog(level)) {
         return
      }

      const sink = config.sinks[level]
      if (!sink) {
         return
      }

      const payload =
         context === undefined
            ? { namespace: config.namespace, message }
            : { namespace: config.namespace, message, ...context }

      sink(message, payload)
   }

   return {
      debug: (message, context) => {
         emit("debug", message, context)
      },
      info: (message, context) => {
         emit("info", message, context)
      },
      warn: (message, context) => {
         emit("warn", message, context)
      },
      error: (message, context) => {
         emit("error", message, context)
      },
   }
}
