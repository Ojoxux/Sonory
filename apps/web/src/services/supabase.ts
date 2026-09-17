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
         // Google から戻ったときの認証結果（code）をURLから受け取るために必要
         flowType: "pkce",
         detectSessionInUrl: true,
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
 * Google アカウントとの連携を開始する（現在の匿名ユーザーに紐付け）
 *
 * @returns エラーメッセージ。成功時（ブラウザがリダイレクトされる）は `null`
 */
export async function linkGoogleAccount(): Promise<string | null> {
   const { error } = await getSupabaseClient().auth.linkIdentity({
      provider: "google",
      options: { redirectTo: window.location.origin },
   })

   if (error) {
      console.error("Google連携の開始に失敗しました:", error)
      return error.message
   }

   return null
}

/**
 * 連携済みの Google アカウントでサインインする（別端末からのログイン用）
 *
 * @returns エラーメッセージ。成功時（ブラウザがリダイレクトされる）は `null`
 */
export async function signInWithGoogle(): Promise<string | null> {
   const { error } = await getSupabaseClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
   })

   if (error) {
      console.error("Googleサインインの開始に失敗しました:", error)
      return error.message
   }

   return null
}

/**
 * サインアウトし、新しい匿名セッションに戻す
 *
 * @returns 新しい匿名セッション。作成に失敗した場合は `null`
 */
export async function signOutToAnonymous(): Promise<Session | null> {
   await getSupabaseClient().auth.signOut()
   return ensureAnonymousSession()
}

/**
 * 401 からの再認証
 *
 * @description
 * まず `refreshSession` を試す。失敗した場合、現在のユーザーが匿名か
 * セッションが無いときだけ新しい匿名ユーザーを作る。Google 連携済みの
 * ユーザーで refresh が失敗しても、黙って別ユーザーに差し替えない。
 *
 * @returns 新しいアクセストークン。作り直さない/失敗した場合は `null`
 */
export async function reauthenticate(): Promise<string | null> {
   const supabase = getSupabaseClient()

   // refresh に失敗するとセッションが消えるため、判定用のユーザーは先に取っておく
   const { data: before } = await supabase.auth.getSession()
   const userBefore = before.session?.user ?? null

   const { data, error } = await supabase.auth.refreshSession()
   if (!error && data.session) {
      return data.session.access_token
   }

   if (userBefore === null || userBefore.is_anonymous === true) {
      const session = await ensureAnonymousSession(true)
      return session?.access_token ?? null
   }

   return null
}
