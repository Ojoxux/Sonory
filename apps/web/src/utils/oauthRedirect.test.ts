import { describe, expect, it } from "vitest"
import {
   getOAuthRedirectErrorMessage,
   stripOAuthRedirectError,
} from "./oauthRedirect"

describe("getOAuthRedirectErrorMessage", () => {
   it("エラーが無ければ null", () => {
      expect(getOAuthRedirectErrorMessage("http://localhost:3000/")).toBeNull()
   })

   it("連携済みのアカウントは専用の文言", () => {
      const message = getOAuthRedirectErrorMessage(
         "http://localhost:3000/?error=server_error&error_code=identity_already_exists",
      )
      expect(message).toContain("既に連携済みです")
   })

   it("ハッシュに付いたエラーも拾う", () => {
      expect(
         getOAuthRedirectErrorMessage(
            "http://localhost:3000/#error=access_denied&error_description=denied",
         ),
      ).toBe("Google アカウントでの認証に失敗しました")
   })
})

describe("stripOAuthRedirectError", () => {
   it("エラーパラメータだけを取り除く", () => {
      expect(
         stripOAuthRedirectError(
            "http://localhost:3000/?lat=1&error=x&error_code=y&error_description=z",
         ),
      ).toBe("http://localhost:3000/?lat=1")
   })

   it("エラーの入ったハッシュを取り除く", () => {
      expect(
         stripOAuthRedirectError("http://localhost:3000/#error=access_denied"),
      ).toBe("http://localhost:3000/")
   })
})
