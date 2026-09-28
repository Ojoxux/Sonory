import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { SLOT_MS } from "@/components/molecules/WaveformDisplay/constants"
import { useMicrophoneLevels } from "./useMicrophoneLevels"

const MAX_DURATION = 10

/** 一定の振幅を返す AnalyserNode の代わり */
function stubAudioContext(amplitude: { value: number }) {
   const disconnect = vi.fn()
   const close = vi.fn()

   class FakeAudioContext {
      createMediaStreamSource() {
         return { connect: vi.fn(), disconnect }
      }
      createAnalyser() {
         return {
            fftSize: 1024,
            getFloatTimeDomainData(target: Float32Array) {
               target.fill(amplitude.value)
            },
         }
      }
      resume() {
         return Promise.resolve()
      }
      close() {
         close()
         return Promise.resolve()
      }
   }

   vi.stubGlobal("AudioContext", FakeAudioContext)
   return { disconnect, close }
}

const stream = {} as MediaStream

// 区間の確定は境目を跨いだ最初のフレーム（最大16msの遅れ）なので、半区間ぶん余分に進める
const advanceSlots = (count: number): void => {
   vi.advanceTimersByTime(count * SLOT_MS + SLOT_MS / 2)
}

describe("useMicrophoneLevels", () => {
   beforeEach(() => {
      vi.useFakeTimers({ toFake: ["performance", "requestAnimationFrame"] })
   })

   afterEach(() => {
      vi.useRealTimers()
      vi.unstubAllGlobals()
   })

   it("ストリームが無いあいだは何も集めない", () => {
      stubAudioContext({ value: 0.5 })
      const { result } = renderHook(() =>
         useMicrophoneLevels(null, MAX_DURATION),
      )
      expect(result.current).toEqual([])
   })

   it("経過時間ぶんの区間が、実際の音量で埋まる", () => {
      stubAudioContext({ value: 0.5 })
      const { result } = renderHook(() =>
         useMicrophoneLevels(stream, MAX_DURATION),
      )

      act(() => {
         advanceSlots(4)
      })

      expect(result.current).toHaveLength(4)
      // 0.5 の振幅は -6dB 相当なので、上限に張り付く
      expect(result.current.every((level) => level === 1)).toBe(true)
   })

   it("静かな音と大きい音が、その順に並ぶ", () => {
      const amplitude = { value: 0.003 }
      stubAudioContext(amplitude)
      const { result } = renderHook(() =>
         useMicrophoneLevels(stream, MAX_DURATION),
      )

      act(() => {
         advanceSlots(1)
      })
      amplitude.value = 0.05
      act(() => {
         vi.advanceTimersByTime(SLOT_MS)
      })

      const [quiet, loud] = result.current
      expect(quiet).toBeDefined()
      expect(loud).toBeDefined()
      expect(loud).toBeGreaterThan(quiet as number)
   })

   it("録音時間を超えて区間が増えない", () => {
      stubAudioContext({ value: 0.5 })
      const { result } = renderHook(() =>
         useMicrophoneLevels(stream, MAX_DURATION),
      )

      act(() => {
         vi.advanceTimersByTime((MAX_DURATION + 5) * 1000)
      })

      expect(result.current).toHaveLength((MAX_DURATION * 1000) / SLOT_MS)
   })

   it("停止しても結果を残し、音声のノードだけ片付ける", () => {
      const { disconnect, close } = stubAudioContext({ value: 0.5 })
      const { result, rerender } = renderHook(
         ({ current }: { current: MediaStream | null }) =>
            useMicrophoneLevels(current, MAX_DURATION),
         { initialProps: { current: stream as MediaStream | null } },
      )

      act(() => {
         advanceSlots(3)
      })
      rerender({ current: null })

      expect(result.current).toHaveLength(3)
      expect(disconnect).toHaveBeenCalledOnce()
      expect(close).toHaveBeenCalledOnce()
   })
})
