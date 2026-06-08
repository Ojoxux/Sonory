import { ERROR_CODES } from "@sonory/shared-types"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@supabase/supabase-js"
import { getSecureSupabaseConfig } from "../config/secrets"
import type { Env } from "../index"
import { APIException } from "../middleware/error"

/**
 * Supabaseクライアントの管理
 *
 * @description
 * Cloudflare Workers環境でSupabaseクライアントを初期化・管理する
 * シングルトンパターンでクライアントのインスタンスを管理
 *
 * @example
 * ```ts
 * const client = getSupabaseClient(env)
 * const { data, error } = await client.from('sound_pins').select()
 * ```
 */

/** Supabase設定の型定義 */
export interface SupabaseConfig {
   readonly url: string
   readonly anonKey: string
   readonly serviceKey?: string | undefined
}

/** クライアントキャッシュ */
let supabaseClient: SupabaseClient | null = null
let _adminClient: SupabaseClient | null = null

/**
 * セキュアなSupabase設定を取得
 *
 * @param env - Cloudflare Workers環境変数（フォールバック用）
 * @returns Supabase設定オブジェクト
 * @throws APIException 必須の設定が未設定の場合
 */
export function getSupabaseConfig(env?: Env): SupabaseConfig {
   // Cloudflare Workers環境（navigatorが存在する）では環境変数から直接取得
   if (typeof navigator !== "undefined") {
      const url = env?.SUPABASE_URL
      const anonKey = env?.SUPABASE_ANON_KEY
      const serviceKey = env?.SUPABASE_SERVICE_KEY

      if (!url || !anonKey) {
         throw new APIException(
            ERROR_CODES.INTERNAL_SERVER_ERROR,
            "Supabase configuration missing: SUPABASE_URL and SUPABASE_ANON_KEY are required",
            500,
         )
      }

      console.log("✅ Supabase設定をWorkers環境変数から取得しました")
      return { url, anonKey, serviceKey } as const
   }

   // Node.js環境ではDocker Secretsを優先使用
   if (typeof process !== "undefined" && process.env) {
      try {
         const secureConfig = getSecureSupabaseConfig()
         console.log("✅ Supabase設定をDocker Secretsから取得しました")
         return secureConfig
      } catch (error) {
         console.warn(
            "⚠️ Docker Secretsからの読み取りに失敗、フォールバックを使用:",
            error,
         )
      }
   }

   // フォールバック: 環境変数
   const url = env?.SUPABASE_URL ?? process?.env.SUPABASE_URL
   const anonKey = env?.SUPABASE_ANON_KEY ?? process?.env.SUPABASE_ANON_KEY
   const serviceKey =
      env?.SUPABASE_SERVICE_KEY ?? process?.env.SUPABASE_SERVICE_KEY

   if (!url || !anonKey) {
      throw new APIException(
         ERROR_CODES.INTERNAL_SERVER_ERROR,
         "Supabase configuration missing: SUPABASE_URL and SUPABASE_ANON_KEY are required",
         500,
      )
   }

   console.log(
      "⚠️ Supabase設定を環境変数から取得しました（本番環境では非推奨）",
   )
   return { url, anonKey, serviceKey } as const
}

/**
 * Supabaseクライアントを取得（通常用）
 *
 * @param env - Cloudflare Workers環境変数
 * @returns Supabaseクライアントインスタンス
 */
export function getSupabaseClient(env?: Env): SupabaseClient {
   if (!supabaseClient) {
      const config = getSupabaseConfig(env)
      // サーバーサイドではservice_roleキーを使用してRPC関数にアクセス
      const key = config.serviceKey || config.anonKey
      supabaseClient = createClient(config.url, key, {
         auth: {
            persistSession: false, // Workers環境ではセッション永続化不可
            autoRefreshToken: false,
         },
         global: {
            fetch: fetch.bind(globalThis), // Workers環境のfetchを使用
         },
      })
   }

   return supabaseClient
}

/**
 * Supabase管理クライアントを取得
 *
 * @param env - Cloudflare Workers環境変数（フォールバック用）
 * @returns Supabase管理クライアント
 */
export function getSupabaseAdmin(env?: Env): SupabaseClient {
   // まずセキュアな設定取得を試行
   const config = getSupabaseConfig(env)

   if (!config.serviceKey) {
      throw new APIException(
         ERROR_CODES.INTERNAL_SERVER_ERROR,
         "Service key is required for admin client but not available",
         500,
      )
   }

   console.log("🔄 Supabase管理クライアントを初期化:", {
      url: config.url,
      keyLength: config.serviceKey.length,
      source:
         typeof process !== "undefined"
            ? "Docker Secrets/Environment"
            : "Cloudflare Workers",
   })

   return createClient(config.url, config.serviceKey, {
      auth: {
         autoRefreshToken: false,
         persistSession: false,
      },
      global: {
         fetch: fetch.bind(globalThis),
      },
   })
}

/**
 * クライアントインスタンスをリセット（テスト用）
 */
export function resetClients(): void {
   supabaseClient = null
   _adminClient = null
}
