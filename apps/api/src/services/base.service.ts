import type { Context } from 'hono'
import type { Env } from '../index'
import { logger } from '../utils/logger'

/**
 * 基底サービスクラス
 *
 * @description
 * すべてのサービスクラスが継承する基底クラス
 * 共通のログ機能、エラーハンドリング、環境変数アクセスを提供
 *
 * @example
 * ```ts
 * class UserService extends BaseService {
 *   async getUser(id: string) {
 *     this.log('info', 'Getting user', { id })
 *     // 実装
 *   }
 * }
 * ```
 */
export abstract class BaseService {
  protected readonly env: Env
  protected readonly ctx: Context<{ Bindings: Env }>
  protected readonly requestId: string

  constructor(ctx: Context<{ Bindings: Env }>) {
    this.ctx = ctx
    this.env = ctx.env
    this.requestId = ctx.get('requestId') || crypto.randomUUID()
  }

  /**
   * サービス名を取得（ログ用）
   */
  protected abstract getServiceName(): string

  /**
   * ログ出力
   *
   * @param level - ログレベル
   * @param message - メッセージ
   * @param data - 追加データ
   */
  protected log(
    level: 'info' | 'warn' | 'error' | 'debug',
    message: string,
    data?: Record<string, unknown>,
  ): void {
    logger[level](message, {
      service: this.getServiceName(),
      requestId: this.requestId,
      ...data,
    })
  }
}
