import { beforeEach, describe, expect, it, vi } from "vitest"
import { APIException } from "../middleware/error"

interface FakeAudioSource {
   userId: string | null
   status: "active" | "processing" | "deleted" | "reported"
   filePath: string | null
}

const findAudioSourceMock = vi.fn<() => Promise<FakeAudioSource | null>>()
const createAudioSignedUrlMock =
   vi.fn<() => Promise<{ url: string; expiresAt: string }>>()

vi.mock("../repositories/pin.repository", () => ({
   PinRepository: class {
      findAudioSource = findAudioSourceMock
      createAudioSignedUrl = createAudioSignedUrlMock
   },
}))

vi.mock("./supabase", () => ({
   getSupabaseAdmin: () => ({}),
   getSupabaseUserClient: () => ({}),
}))

// vi.mock is hoisted, so importing after the mock declarations keeps the
// module under test wired to the mocked PinRepository/supabase clients.
const { PinService } = await import("./pin.service")

type ServiceContext = ConstructorParameters<typeof PinService>[0]

/** userId をセットした最小限の fake Hono context */
function createFakeContext(userId?: string): ServiceContext {
   const vars = new Map<string, unknown>()
   if (userId !== undefined) {
      vars.set("userId", userId)
   }

   return {
      env: {},
      get: (key: string) => vars.get(key),
      set: (key: string, value: unknown) => vars.set(key, value),
      req: { header: () => undefined },
   } as unknown as ServiceContext
}

describe("PinService.getAudioUrl", () => {
   beforeEach(() => {
      findAudioSourceMock.mockReset()
      createAudioSignedUrlMock.mockReset()
   })

   it("公開中のピンはURLを返す", async () => {
      findAudioSourceMock.mockResolvedValue({
         userId: null,
         status: "active",
         filePath: "pins/pin-1/audio.webm",
      })
      createAudioSignedUrlMock.mockResolvedValue({
         url: "https://storage.example.com/signed",
         expiresAt: "2026-01-01T00:00:00.000Z",
      })

      const service = new PinService(createFakeContext())
      const result = await service.getAudioUrl("pin-1")

      expect(result).toEqual({
         url: "https://storage.example.com/signed",
         expiresAt: "2026-01-01T00:00:00.000Z",
      })
      expect(findAudioSourceMock).toHaveBeenCalledWith("pin-1")
      expect(createAudioSignedUrlMock).toHaveBeenCalledWith(
         "pins/pin-1/audio.webm",
      )
   })

   it("所有者が非公開ピンにアクセスするとURLを返す", async () => {
      findAudioSourceMock.mockResolvedValue({
         userId: "owner-1",
         status: "processing",
         filePath: "pins/pin-2/audio.webm",
      })
      createAudioSignedUrlMock.mockResolvedValue({
         url: "https://storage.example.com/signed-2",
         expiresAt: "2026-01-01T01:00:00.000Z",
      })

      const service = new PinService(createFakeContext("owner-1"))
      const result = await service.getAudioUrl("pin-2")

      expect(result.url).toBe("https://storage.example.com/signed-2")
   })

   it("他人の非公開ピンは404を投げる", async () => {
      findAudioSourceMock.mockResolvedValue({
         userId: "owner-1",
         status: "processing",
         filePath: "pins/pin-2/audio.webm",
      })

      const service = new PinService(createFakeContext("someone-else"))

      await expect(service.getAudioUrl("pin-2")).rejects.toMatchObject({
         statusCode: 404,
      })
      expect(createAudioSignedUrlMock).not.toHaveBeenCalled()
   })

   it("存在しないピンは404を投げる", async () => {
      findAudioSourceMock.mockResolvedValue(null)

      const service = new PinService(createFakeContext())

      await expect(service.getAudioUrl("missing")).rejects.toBeInstanceOf(
         APIException,
      )
      await expect(service.getAudioUrl("missing")).rejects.toMatchObject({
         statusCode: 404,
      })
      expect(createAudioSignedUrlMock).not.toHaveBeenCalled()
   })

   it("ファイルパスが求まらない場合は500を投げる", async () => {
      findAudioSourceMock.mockResolvedValue({
         userId: null,
         status: "active",
         filePath: null,
      })

      const service = new PinService(createFakeContext())

      await expect(service.getAudioUrl("pin-3")).rejects.toMatchObject({
         statusCode: 500,
      })
      expect(createAudioSignedUrlMock).not.toHaveBeenCalled()
   })
})
