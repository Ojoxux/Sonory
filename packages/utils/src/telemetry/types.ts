/**
 * テレメトリで扱うログレベル。
 */
export type LogLevel = "debug" | "info" | "warn" | "error"

/**
 * 構造化ログに付与する追加コンテキスト。
 */
export type LogContext = Readonly<Record<string, unknown>>

/**
 * ログを外部サービスへ転送するためのシンク。
 *
 * @description
 * APM（Sentry 等）や開発用コンソール出力を差し替え可能にする。
 */
export interface LogSink {
   readonly debug?: (message: string, context?: LogContext) => void
   readonly info?: (message: string, context?: LogContext) => void
   readonly warn?: (message: string, context?: LogContext) => void
   readonly error?: (message: string, context?: LogContext) => void
}

/**
 * ロガー生成時の設定。
 */
export interface LoggerConfig {
   readonly namespace: string
   readonly minLevel: LogLevel
   readonly sinks: LogSink
}

/**
 * アプリケーション全体で利用するロガーインターフェース。
 */
export interface Logger {
   debug(message: string, context?: LogContext): void
   info(message: string, context?: LogContext): void
   warn(message: string, context?: LogContext): void
   error(message: string, context?: LogContext): void
}
