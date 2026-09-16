/**
 * ブラウザ用 Supabase クライアント
 *
 * Auth（匿名サインイン）と Realtime（`sound_pins` 購読）で共有する。
 * セッションは localStorage に永続化され、トークンは自動更新される。
 *
 * ⚠️ `SUPABASE_SERVICE_KEY` は RLS をバイパスするため、ここへ持ち込まないこと。
 * サーバー側のクライアントは `apps/api/src/services/supabase.ts` にある。
 */

import type { Session, SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@supabase/supabase-js"

let client: SupabaseClient | null = null

/**
 * 共有クライアントを取得する（シングルトン）
 *
 * @returns Supabase クライアント
 * @throws 環境変数が未設定の場合
 */
export function getSupabaseClient(): SupabaseClient {
   if (client) {
      return client
   }

   const url = process.env.NEXT_PUBLIC_SUPABASE_URL
   const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

   if (!url || !anonKey) {
      throw new Error(
         "NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY が未設定です",
      )
   }

   client = createClient(url, anonKey, {
      auth: {
         persistSession: true,
         autoRefreshToken: true,
         detectSessionInUrl: false,
      },
   })

   return client
}

/**
 * 匿名セッションを保証する
 *
 * ログイン画面は出さない。録音体験の前に壁を作らないための方針。
 *
 * @param force - true なら既存セッションを無視して作り直す（401 からの復帰用）
 * @returns 有効なセッション。作成に失敗した場合は `null`
 */
export async function ensureAnonymousSession(
   force = false,
): Promise<Session | null> {
   const supabase = getSupabaseClient()

   if (!force) {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
         return data.session
      }
   }

   const { data, error } = await supabase.auth.signInAnonymously()

   if (error) {
      console.error("匿名サインインに失敗しました:", error)
      return null
   }

   return data.session
}

/**
 * 現在のアクセストークンを取得する
 *
 * @returns アクセストークン。セッションが無い場合は `null`
 */
export async function getAccessToken(): Promise<string | null> {
   const { data } = await getSupabaseClient().auth.getSession()
   return data.session?.access_token ?? null
}

/**
 * 匿名サインインをやり直して新しいトークンを得る
 *
 * @returns 新しいアクセストークン。失敗した場合は `null`
 */
export async function reauthenticateAnonymously(): Promise<string | null> {
   const session = await ensureAnonymousSession(true)
   return session?.access_token ?? null
}
