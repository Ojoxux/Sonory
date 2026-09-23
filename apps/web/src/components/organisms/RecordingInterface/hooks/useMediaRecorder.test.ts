import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { useMediaRecorder } from "./useMediaRecorder"

/** 生きている音声トラックを持つストリームの代わり */
function fakeStream(readyState: MediaStreamTrackState = "live"): MediaStream {
   const track = { readyState, stop: vi.fn() }
   return {
      getAudioTracks: () => [track],
      getTracks: () => [track],
   } as unknown as MediaStream
}

function stubBrowser(): { getUserMedia: ReturnType<typeof vi.fn> } {
   const getUserMedia = vi.fn(async () => fakeStream())
   vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } })

   class FakeMediaRecorder {
      static isTypeSupported = () => true
      state = "inactive"
      mimeType = "audio/webm"
      ondataavailable: unknown = null
      onstop: unknown = null
      onerror: unknown = null
      start() {
         this.state = "recording"
      }
      stop() {
         this.state = "inactive"
      }
   }
   vi.stubGlobal("MediaRecorder", FakeMediaRecorder)
   return { getUserMedia }
}

afterEach(() => {
   vi.unstubAllGlobals()
})

describe("useMediaRecorder", () => {
   it("確認画面で開いたストリームを渡すと、ブラウザに問い合わせ直さない", async () => {
      const { getUserMedia } = stubBrowser()
      const granted = fakeStream()
      const { result } = renderHook(() => useMediaRecorder())

      await act(async () => {
         await result.current.startRecording(granted)
      })

      // 開き直すと Firefox が許可ダイアログをもう一度出す
      expect(getUserMedia).not.toHaveBeenCalled()
      expect(result.current.stream).toBe(granted)
   })

   it("ストリームが無ければ自分で開く", async () => {
      const { getUserMedia } = stubBrowser()
      const { result } = renderHook(() => useMediaRecorder())

      await act(async () => {
         await result.current.startRecording(null)
      })

      expect(getUserMedia).toHaveBeenCalledOnce()
   })

   it("終了したストリームを渡されたら開き直す", async () => {
      const { getUserMedia } = stubBrowser()
      const { result } = renderHook(() => useMediaRecorder())

      await act(async () => {
         await result.current.startRecording(fakeStream("ended"))
      })

      expect(getUserMedia).toHaveBeenCalledOnce()
   })
})
