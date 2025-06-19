import type { Context } from 'hono'

/**
 * ログレベル定義
 */
export const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
} as const

export type LogLevel = keyof typeof LOG_LEVELS

/**
 * ログエントリーの型定義
 */
interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  requestId?: string
  userId?: string
  metadata?: Record<string, unknown>
}

/**
 * ロガークラス
 * @description Cloudflare Workersでのログ出力を管理
 */
export class Logger {
  private readonly minLevel: LogLevel

  constructor(minLevel: LogLevel = 'INFO') {
    this.minLevel = minLevel
  }

  /**
   * ログエントリーを作成
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>,
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...metadata,
    }
  }

  /**
   * ログを出力すべきかチェック
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel]
  }

  /**
   * ログを出力
   */
  private log(
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>,
  ): void {
    if (!this.shouldLog(level)) return

    const entry = this.createLogEntry(level, message, metadata)

    switch (level) {
      case 'ERROR':
        console.error(JSON.stringify(entry))
        break
      case 'WARN':
        console.warn(JSON.stringify(entry))
        break
      default:
        console.log(JSON.stringify(entry))
    }
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log('DEBUG', message, metadata)
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.log('INFO', message, metadata)
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log('WARN', message, metadata)
  }

  error(message: string, metadata?: Record<string, unknown>): void {
    this.log('ERROR', message, metadata)
  }

  /**
   * Honoコンテキストから情報を含めてログ出力
   */
  logWithContext(
    c: Context,
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>,
  ): void {
    const requestId = c.get('requestId')
    const userId = c.get('userId')

    this.log(level, message, {
      requestId,
      userId,
      ...metadata,
    })
  }
}

// デフォルトのロガーインスタンス
export const logger = new Logger()
