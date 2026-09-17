const ERROR_PARAMS = ["error", "error_code", "error_description"] as const

/**
 * OAuth から戻った URL に付いたエラーを、ユーザー向けの文言に変換する
 *
 * Supabase はエラーをクエリかハッシュのどちらかに付ける。
 *
 * @param href - 現在の URL
 * @returns 表示する文言。エラーが無ければ `null`
 */
export function getOAuthRedirectErrorMessage(href: string): string | null {
   const url = new URL(href)
   const params = new URLSearchParams(url.hash.slice(1))
   for (const [key, value] of url.searchParams) {
      params.set(key, value)
   }

   if (!ERROR_PARAMS.some((key) => params.has(key))) {
      return null
   }

   if (params.get("error_code") === "identity_already_exists") {
      return "この Google アカウントは既に別のユーザーに連携されています。「連携済みのアカウントでログイン」を使ってください"
   }

   return "Google アカウントでの認証に失敗しました"
}

/**
 * URL から OAuth のエラーパラメータを取り除く
 *
 * @param href - 現在の URL
 * @returns エラーパラメータを除いた URL
 */
export function stripOAuthRedirectError(href: string): string {
   const url = new URL(href)
   for (const key of ERROR_PARAMS) {
      url.searchParams.delete(key)
   }
   if (ERROR_PARAMS.some((key) => url.hash.includes(`${key}=`))) {
      url.hash = ""
   }
   return url.toString()
}
