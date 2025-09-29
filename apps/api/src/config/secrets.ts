import { readFileSync } from "node:fs"
import { ERROR_CODES } from "@sonory/shared-types"
import { APIException } from "../middleware/error"

// シークレットキャッシュ（本番環境でのパフォーマンス向上）
const secretCache = new Map<string, string>()
const CACHE_TTL = 300000 // 5分
const secretCacheTimestamps = new Map<string, number>()

// ログレベル制御
const isDevelopment = process.env.NODE_ENV !== "production"
const isVerboseLogging = process.env.VERBOSE_SECRETS_LOGGING === "true"

/**
 * Docker Secretsまたは環境変数からシークレットを安全に読み取る
 *
 * @description
 * 本番環境ではDocker Secretsから、開発環境では環境変数からシークレットを読み取る
 * セキュリティ強化のため、シークレットファイルを優先して使用
 *
 * @example
 * ```ts
 * const serviceKey = getSecret('supabase_service_key');
 * ```
 */

/**
 * ログ出力を制御する関数
 */
function logSecretAction(
   level: "info" | "warn" | "error",
   message: string,
   ...args: unknown[]
) {
   if (level === "error" || isDevelopment || isVerboseLogging) {
      console[level](message, ...args)
   }
}

/**
 * シークレットキャッシュをチェック
 */
function getCachedSecret(cacheKey: string): string | null {
   const cached = secretCache.get(cacheKey)
   const timestamp = secretCacheTimestamps.get(cacheKey)

   if (cached && timestamp && Date.now() - timestamp < CACHE_TTL) {
      logSecretAction("info", `🔄 Secret loaded from cache: ${cacheKey}`)
      return cached
   }

   // 期限切れの場合はキャッシュから削除
   if (cached) {
      secretCache.delete(cacheKey)
      secretCacheTimestamps.delete(cacheKey)
   }

   return null
}

/**
 * シークレットをキャッシュに保存
 */
function setCachedSecret(cacheKey: string, value: string): void {
   secretCache.set(cacheKey, value)
   secretCacheTimestamps.set(cacheKey, Date.now())
}

/**
 * シークレットを安全に読み取る
 *
 * @param secretName - シークレット名（Docker Secretsのファイル名）
 * @param envVarName - フォールバック用の環境変数名（オプション）
 * @returns シークレット値
 * @throws APIException シークレットが見つからない場合
 */
export function getSecret(secretName: string, envVarName?: string): string {
   const cacheKey = `${secretName}:${envVarName || secretName.toUpperCase()}`

   // 1. キャッシュをチェック
   const cached = getCachedSecret(cacheKey)
   if (cached) {
      return cached
   }

   // 2. Docker Secretsから読み取りを試行
   try {
      const secretPath = `/run/secrets/${secretName}`
      const secret = readFileSync(secretPath, "utf8").trim()
      if (secret) {
         logSecretAction(
            "info",
            `✅ Secret loaded from Docker Secrets: ${secretName}`,
         )
         setCachedSecret(cacheKey, secret)
         return secret
      }
   } catch (error) {
      // ファイルが存在しない場合は環境変数にフォールバック
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
         logSecretAction(
            "warn",
            `⚠️ Error reading Docker Secret ${secretName}:`,
            error,
         )
      }
   }

   // 3. 環境変数からフォールバック
   const envVar = envVarName || secretName.toUpperCase()
   const envValue = process.env[envVar]
   if (envValue) {
      logSecretAction(
         "warn",
         `⚠️ Secret loaded from environment variable: ${envVar} (not secure for production)`,
      )
      setCachedSecret(cacheKey, envValue)
      return envValue
   }

   // 4. シークレットが見つからない場合はエラー
   logSecretAction(
      "error",
      `❌ Secret not found: ${secretName} (checked Docker Secrets and environment variable ${envVar})`,
   )
   throw new APIException(
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      `Secret not found: ${secretName} (checked Docker Secrets and environment variable ${envVar})`,
      500,
   )
}

/**
 * オプショナルなシークレットを読み取る
 *
 * @param secretName - シークレット名
 * @param envVarName - フォールバック用の環境変数名（オプション）
 * @returns シークレット値またはundefined
 */
export function getSecretOptional(
   secretName: string,
   envVarName?: string,
): string | undefined {
   try {
      return getSecret(secretName, envVarName)
   } catch {
      return undefined
   }
}

/**
 * Supabase設定をセキュアに取得
 */
export interface SecureSupabaseConfig {
   readonly url: string
   readonly anonKey: string
   readonly serviceKey?: string
}

export function getSecureSupabaseConfig(): SecureSupabaseConfig {
   // URLは機密性が低いため環境変数から取得
   const url = process.env.SUPABASE_URL
   if (!url) {
      logSecretAction(
         "error",
         "❌ SUPABASE_URL environment variable is required",
      )
      throw new APIException(
         ERROR_CODES.INTERNAL_SERVER_ERROR,
         "SUPABASE_URL environment variable is required",
         500,
      )
   }

   // キーはDocker Secretsから安全に取得
   const anonKey = getSecret("supabase_anon_key", "SUPABASE_ANON_KEY")
   const serviceKey = getSecretOptional(
      "supabase_service_key",
      "SUPABASE_SERVICE_KEY",
   )

   logSecretAction("info", "✅ Supabase設定を正常に取得しました", {
      url: `${url.substring(0, 30)}...`,
      hasAnonKey: !!anonKey,
      hasServiceKey: !!serviceKey,
   })

   return {
      url,
      anonKey,
      ...(serviceKey && { serviceKey }),
   }
}

/**
 * シークレットキャッシュをクリア（テスト用）
 */
export function clearSecretCache(): void {
   secretCache.clear()
   secretCacheTimestamps.clear()
   logSecretAction("info", "🧹 Secret cache cleared")
}
