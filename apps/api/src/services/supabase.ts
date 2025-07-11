import { ERROR_CODES } from "@sonory/shared-types"
import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"
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
 * 環境変数からSupabase設定を取得
 *
 * @param env - Cloudflare Workers環境変数
 * @returns Supabase設定オブジェクト
 * @throws APIException 必須の環境変数が未設定の場合
 */
export function getSupabaseConfig(env: Env): SupabaseConfig {
   const url = env.SUPABASE_URL
   const anonKey = env.SUPABASE_ANON_KEY
   const serviceKey = env.SUPABASE_SERVICE_KEY

   if (!url || !anonKey) {
      throw new APIException(
         ERROR_CODES.INTERNAL_SERVER_ERROR,
         "Supabase configuration missing",
         500,
      )
   }

   return { url, anonKey, serviceKey } as const
}

/**
 * Supabaseクライアントを取得（通常用）
 *
 * @param env - Cloudflare Workers環境変数
 * @returns Supabaseクライアントインスタンス
 */
export function getSupabaseClient(env: Env): SupabaseClient {
   if (!supabaseClient) {
      const config = getSupabaseConfig(env)
      supabaseClient = createClient(config.url, config.anonKey, {
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
 * @param env - Cloudflare Workers環境変数
 * @returns Supabase管理クライアント
 */
export function getSupabaseAdmin(env: Env): SupabaseClient {
   if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
      console.error("❌ Supabase環境変数が設定されていません:", {
         hasUrl: !!env.SUPABASE_URL,
         hasKey: !!env.SUPABASE_SERVICE_KEY,
      })
      throw new Error("Supabase configuration is missing")
   }

   console.log("🔄 Supabase管理クライアントを初期化:", {
      url: env.SUPABASE_URL,
      keyLength: env.SUPABASE_SERVICE_KEY.length,
   })

   return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
      auth: {
         autoRefreshToken: false,
         persistSession: false,
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
