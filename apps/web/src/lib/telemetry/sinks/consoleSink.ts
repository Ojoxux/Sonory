import type { LogContext, LogLevel } from "@sonory/utils"

/**
 * 開発環境向けのコンソール出力シンク。
 */
export function createConsoleSink(): Readonly<
   Record<LogLevel, (message: string, context?: LogContext) => void>
> {
   const format = (message: string, context?: LogContext): string =>
      context === undefined ? message : `${message} ${JSON.stringify(context)}`

   return {
      debug: (message, context) => {
         console.debug(format(message, context))
      },
      info: (message, context) => {
         console.info(format(message, context))
      },
      warn: (message, context) => {
         console.warn(format(message, context))
      },
      error: (message, context) => {
         console.error(format(message, context))
      },
   }
}
