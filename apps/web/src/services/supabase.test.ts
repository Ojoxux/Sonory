import { beforeEach, describe, expect, it, vi } from "vitest"

type FakeSession = { access_token: string; user: { is_anonymous: boolean } }
type SessionResult = { data: { session: FakeSession | null } }
type AuthResult = SessionResult & { error: Error | null }

const auth = {
   getSession: vi.fn<() => Promise<SessionResult>>(),
   refreshSession: vi.fn<() => Promise<AuthResult>>(),
   signInAnonymously: vi.fn<() => Promise<AuthResult>>(),
   signOut:
      vi.fn<
         (options?: { scope: string }) => Promise<{ error: Error | null }>
      >(),
}

vi.mock("@supabase/supabase-js", () => ({
   createClient: () => ({ auth }),
}))

function session(token: string, isAnonymous: boolean): FakeSession {
   return { access_token: token, user: { is_anonymous: isAnonymous } }
}

async function loadSupabase() {
   vi.resetModules()
   vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co")
   vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key")
   return import("./supabase")
}

async function loadReauthenticate() {
   vi.resetModules()
   vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co")
   vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key")
   const { reauthenticate } = await import("./supabase")
   return reauthenticate
}

describe("reauthenticate", () => {
   beforeEach(() => {
      vi.clearAllMocks()
      auth.signInAnonymously.mockResolvedValue({
         data: { session: session("new-anonymous", true) },
         error: null,
      })
   })

   it("refresh に成功したらそのトークンを返し、匿名ユーザーを作り直さない", async () => {
      auth.getSession.mockResolvedValue({
         data: { session: session("old", false) },
      })
      auth.refreshSession.mockResolvedValue({
         data: { session: session("refreshed", false) },
         error: null,
      })

      const reauthenticate = await loadReauthenticate()

      expect(await reauthenticate()).toBe("refreshed")
      expect(auth.signInAnonymously).not.toHaveBeenCalled()
   })

   it("連携済みユーザーは refresh に失敗しても匿名ユーザーに差し替えない", async () => {
      auth.getSession.mockResolvedValue({
         data: { session: session("old", false) },
      })
      auth.refreshSession.mockResolvedValue({
         data: { session: null },
         error: new Error("invalid refresh token"),
      })

      const reauthenticate = await loadReauthenticate()

      expect(await reauthenticate()).toBeNull()
      expect(auth.signInAnonymously).not.toHaveBeenCalled()
   })

   it("匿名ユーザーは refresh に失敗したら作り直す", async () => {
      auth.getSession.mockResolvedValue({
         data: { session: session("old", true) },
      })
      auth.refreshSession.mockResolvedValue({
         data: { session: null },
         error: new Error("invalid refresh token"),
      })

      const reauthenticate = await loadReauthenticate()

      expect(await reauthenticate()).toBe("new-anonymous")
      expect(auth.signInAnonymously).toHaveBeenCalledOnce()
   })

   it("セッションが無ければ匿名ユーザーを作る", async () => {
      auth.getSession.mockResolvedValue({ data: { session: null } })
      auth.refreshSession.mockResolvedValue({
         data: { session: null },
         error: new Error("no session"),
      })

      const reauthenticate = await loadReauthenticate()

      expect(await reauthenticate()).toBe("new-anonymous")
   })
})

describe("signOutToAnonymous", () => {
   beforeEach(() => {
      vi.clearAllMocks()
      auth.signOut.mockResolvedValue({ error: null })
      auth.getSession.mockResolvedValue({ data: { session: null } })
      auth.signInAnonymously.mockResolvedValue({
         data: { session: session("new-anonymous", true) },
         error: null,
      })
   })

   it("この端末だけログアウトし、他の端末のセッションは残す", async () => {
      const { signOutToAnonymous } = await loadSupabase()

      await signOutToAnonymous()

      expect(auth.signOut).toHaveBeenCalledWith({ scope: "local" })
   })

   it("ログアウト後に匿名セッションを作り直す", async () => {
      const { signOutToAnonymous } = await loadSupabase()

      const result = await signOutToAnonymous()

      expect(result?.access_token).toBe("new-anonymous")
   })
})
