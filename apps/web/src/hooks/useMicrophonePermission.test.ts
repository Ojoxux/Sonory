import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { useMicrophonePermission } from "./useMicrophonePermission"

function stubMicrophone(): { stop: ReturnType<typeof vi.fn> } {
   const stop = vi.fn()
   const track = { readyState: "live", stop }
   const stream = {
      getAudioTracks: () => [track],
      getTracks: () => [track],
   }
   vi.stubGlobal("navigator", {
      mediaDevices: { getUserMedia: vi.fn(async () => stream) },
   })
   return { stop }
}

afterEach(() => {
   vi.unstubAllGlobals()
})

describe("useMicrophonePermission", () => {
   it("許可したストリームを保持し、録音側へ渡せる", async () => {
      stubMicrophone()
      const { result } = renderHook(() => useMicrophonePermission())

      await act(async () => {
         await result.current.request()
      })
      expect(result.current.state).toBe("granted")

      const taken = result.current.takeStream()
      expect(taken).not.toBeNull()
      // 渡したあとは保持していない。停止は受け取った側の責任
      expect(result.current.takeStream()).toBeNull()
   })

   it("手放したあとは許可済みと言わない", async () => {
      // Permissions API が無い環境（Firefox / Safari）では、手放した時点で分からなくなる
      stubMicrophone()
      const { result } = renderHook(() => useMicrophonePermission())

      await act(async () => {
         await result.current.request()
      })
      expect(result.current.state).toBe("granted")

      await act(async () => {
         result.current.release()
      })

      // ここで「許可済み」のままにすると、録音開始時に不意にダイアログが出る
      expect(result.current.state).toBe("unknown")
   })

   it("録音せずに閉じたらマイクを止める", async () => {
      const { stop } = stubMicrophone()
      const { result } = renderHook(() => useMicrophonePermission())

      await act(async () => {
         await result.current.request()
      })
      act(() => {
         result.current.release()
      })

      expect(stop).toHaveBeenCalledOnce()
   })

   it("画面から消えたらマイクを止める", async () => {
      const { stop } = stubMicrophone()
      const { result, unmount } = renderHook(() => useMicrophonePermission())

      await act(async () => {
         await result.current.request()
      })
      unmount()

      expect(stop).toHaveBeenCalledOnce()
   })
})
