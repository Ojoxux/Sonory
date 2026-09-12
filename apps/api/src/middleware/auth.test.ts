import { beforeEach, describe, expect, it, vi } from "vitest"
import { APIException } from "./error"

interface FakeSupabaseUser {
   id: string
}

interface FakeGetUserResult {
   data: { user: FakeSupabaseUser | null }
   error: { message: string } | null
}

const getUserMock = vi.fn<() => Promise<FakeGetUserResult>>()

vi.mock("../services/supabase", () => ({
   getSupabaseUserClient: () => ({
      auth: {
         getUser: getUserMock,
      },
   }),
}))

// vi.mock is hoisted, so importing after the mock declaration keeps the
// module under test wired to the mocked `getSupabaseUserClient`.
const { requireAuth, optionalAuth } = await import("./auth")

type AuthMiddleware = typeof requireAuth
type FakeContext = Parameters<AuthMiddleware>[0]
type FakeNext = Parameters<AuthMiddleware>[1]

/**
 * Minimal fake Hono context, just enough for the auth middleware:
 * - `req.header` to read the Authorization header
 * - `set`/`get` to store the resolved userId
 */
function createFakeContext(authorization?: string): FakeContext {
   const vars = new Map<string, unknown>()

   return {
      req: {
         header: (name: string) =>
            name.toLowerCase() === "authorization" ? authorization : undefined,
      },
      env: {},
      set: (key: string, value: unknown) => {
         vars.set(key, value)
      },
      get: (key: string) => vars.get(key),
   } as unknown as FakeContext
}

describe("requireAuth", () => {
   beforeEach(() => {
      getUserMock.mockReset()
   })

   it("Authorizationヘッダーが無い場合は401 UNAUTHORIZEDを投げる", async () => {
      const c = createFakeContext(undefined)
      const next: FakeNext = vi.fn<() => Promise<void>>()

      await expect(requireAuth(c, next)).rejects.toMatchObject({
         code: "UNAUTHORIZED",
         statusCode: 401,
      })
      expect(next).not.toHaveBeenCalled()
      expect(getUserMock).not.toHaveBeenCalled()
   })

   it("Bearer形式でないAuthorizationヘッダーは401 UNAUTHORIZEDを投げる", async () => {
      const c = createFakeContext("Basic abc123")
      const next: FakeNext = vi.fn<() => Promise<void>>()

      await expect(requireAuth(c, next)).rejects.toBeInstanceOf(APIException)
      expect(next).not.toHaveBeenCalled()
   })

   it("トークン検証に失敗した場合は401 UNAUTHORIZEDを投げる", async () => {
      getUserMock.mockResolvedValue({
         data: { user: null },
         error: { message: "invalid token" },
      })
      const c = createFakeContext("Bearer invalid-token")
      const next: FakeNext = vi.fn<() => Promise<void>>()

      await expect(requireAuth(c, next)).rejects.toMatchObject({
         code: "UNAUTHORIZED",
         statusCode: 401,
      })
      expect(next).not.toHaveBeenCalled()
   })

   it("有効なトークンならuserIdをセットしてnextを呼ぶ", async () => {
      getUserMock.mockResolvedValue({
         data: { user: { id: "user-123" } },
         error: null,
      })
      const c = createFakeContext("Bearer valid-token")
      const next: FakeNext = vi.fn<() => Promise<void>>()

      await requireAuth(c, next)

      expect(c.get("userId")).toBe("user-123")
      expect(next).toHaveBeenCalledOnce()
   })
})

describe("optionalAuth", () => {
   beforeEach(() => {
      getUserMock.mockReset()
   })

   it("Authorizationヘッダーが無くてもエラーにせずnextを呼ぶ", async () => {
      const c = createFakeContext(undefined)
      const next: FakeNext = vi.fn<() => Promise<void>>()

      await optionalAuth(c, next)

      expect(c.get("userId")).toBeUndefined()
      expect(next).toHaveBeenCalledOnce()
      expect(getUserMock).not.toHaveBeenCalled()
   })

   it("トークンが無効でもエラーにせずuserIdをセットしない", async () => {
      getUserMock.mockResolvedValue({
         data: { user: null },
         error: { message: "invalid token" },
      })
      const c = createFakeContext("Bearer invalid-token")
      const next: FakeNext = vi.fn<() => Promise<void>>()

      await optionalAuth(c, next)

      expect(c.get("userId")).toBeUndefined()
      expect(next).toHaveBeenCalledOnce()
   })

   it("有効なトークンならuserIdをセットする", async () => {
      getUserMock.mockResolvedValue({
         data: { user: { id: "user-456" } },
         error: null,
      })
      const c = createFakeContext("Bearer valid-token")
      const next: FakeNext = vi.fn<() => Promise<void>>()

      await optionalAuth(c, next)

      expect(c.get("userId")).toBe("user-456")
      expect(next).toHaveBeenCalledOnce()
   })
})
