import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { useRecordingInterface } from "./useRecordingInterface"

function fakeStream(): MediaStream {
   const track = { readyState: "live", stop: vi.fn() }
   return {
      getAudioTracks: () => [track],
      getTracks: () => [track],
   } as unknown as MediaStream
}

/** 許可ダイアログのように、応答があるまで解決しない getUserMedia */
function stubPendingMicrophone(): {
   allow: () => void
   deny: () => void
} {
   let settle: { allow: () => void; deny: () => void } = {
      allow: () => {},
      deny: () => {},
   }
   const getUserMedia = vi.fn(
      () =>
         new Promise<MediaStream>((resolve, reject) => {
            settle = {
               allow: () => resolve(fakeStream()),
               deny: () => {
                  const error = new Error("denied")
                  error.name = "NotAllowedError"
                  reject(error)
               },
            }
         }),
   )
   vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } })

   class FakeMediaRecorder {
      static isTypeSupported = () => true
      state = "inactive"
      mimeType = "audio/webm"
      start() {
         this.state = "recording"
      }
      stop() {
         this.state = "inactive"
      }
   }
   vi.stubGlobal("MediaRecorder", FakeMediaRecorder)

   // 波形が音量を読むために使う
   class FakeAudioContext {
      createMediaStreamSource() {
         return { connect: vi.fn(), disconnect: vi.fn() }
      }
      createAnalyser() {
         return {
            fftSize: 1024,
            getFloatTimeDomainData: vi.fn(),
         }
      }
      resume() {
         return Promise.resolve()
      }
      close() {
         return Promise.resolve()
      }
   }
   vi.stubGlobal("AudioContext", FakeAudioContext)

   return {
      allow: () => settle.allow(),
      deny: () => settle.deny(),
   }
}

afterEach(() => {
   vi.unstubAllGlobals()
})

describe("useRecordingInterface", () => {
   it("マイクが開くまで画面を録音中にしない", async () => {
      const microphone = stubPendingMicrophone()
      const { result } = renderHook(() => useRecordingInterface())

      act(() => {
         void result.current.handleStartRecording()
      })

      // 許可ダイアログに答える前は、まだ録音していない
      expect(result.current.status).toBe("idle")

      await act(async () => {
         microphone.allow()
      })

      await waitFor(() => expect(result.current.status).toBe("recording"))
   })

   it("拒否されたら録音中にならない", async () => {
      const microphone = stubPendingMicrophone()
      const { result } = renderHook(() => useRecordingInterface())

      act(() => {
         void result.current.handleStartRecording()
      })
      await act(async () => {
         microphone.deny()
      })

      expect(result.current.status).toBe("idle")
   })
})
