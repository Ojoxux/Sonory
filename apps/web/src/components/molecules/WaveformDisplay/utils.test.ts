import { describe, expect, it } from "vitest"
import { MAX_DB, MIN_DB, SLOT_MS } from "./constants"
import { barCount, barValues, sampleLevel, slotCount } from "./utils"

/** 指定した実効値になる矩形のサンプルを作る */
const samplesWithRms = (rms: number): Float32Array =>
   Float32Array.from({ length: 64 }, (_, i) => (i % 2 === 0 ? rms : -rms))

const dbToRms = (db: number): number => 10 ** (db / 20)

describe("sampleLevel", () => {
   it("無音は 0 になる", () => {
      expect(sampleLevel(new Float32Array(64))).toBe(0)
   })

   it("下限より小さい音は 0、上限より大きい音は 1 に丸める", () => {
      expect(sampleLevel(samplesWithRms(dbToRms(MIN_DB - 20)))).toBe(0)
      expect(sampleLevel(samplesWithRms(dbToRms(MAX_DB + 10)))).toBe(1)
   })

   it("下限と上限の中間はおよそ 0.5 になる", () => {
      const level = sampleLevel(samplesWithRms(dbToRms((MIN_DB + MAX_DB) / 2)))
      expect(level).toBeCloseTo(0.5, 5)
   })

   it("音が大きいほど値も大きい", () => {
      const quiet = sampleLevel(samplesWithRms(dbToRms(-50)))
      const loud = sampleLevel(samplesWithRms(dbToRms(-20)))
      expect(loud).toBeGreaterThan(quiet)
   })

   it("空の入力でも落ちない", () => {
      expect(sampleLevel(new Float32Array(0))).toBe(0)
   })
})

describe("slotCount", () => {
   it("録音時間を区間の数に直す", () => {
      expect(slotCount(10)).toBe(10_000 / SLOT_MS)
   })
})

describe("barValues", () => {
   it("バーの数だけ返す", () => {
      expect(barValues([0.5], 7, 100)).toHaveLength(7)
   })

   it("まだ録音していないバーは undefined になる", () => {
      // 100区間を10本で描くので、1本目だけが録音済みの区間を含む
      const values = barValues([0.4, 0.8], 10, 100)
      expect(values[0]).toBe(0.8)
      expect(values.slice(1)).toEqual(Array(9).fill(undefined))
   })

   it("1本が受け持つ区間のうち最大の音量を採る", () => {
      expect(barValues([0.1, 0.9, 0.3, 0.2], 2, 4)).toEqual([0.9, 0.3])
   })

   it("区間よりバーが多くても、すべてのバーが値を持つ", () => {
      const values = barValues([0.2, 0.6], 4, 2)
      expect(values).toEqual([0.2, 0.2, 0.6, 0.6])
   })

   it("録音済みの区間だけが埋まる（時間と位置が一致する）", () => {
      // 全100区間のうち半分だけ録音した状態
      const levels = Array.from({ length: 50 }, () => 0.5)
      const values = barValues(levels, 10, 100)
      expect(values.filter((value) => value !== undefined)).toHaveLength(5)
      expect(values.slice(5)).toEqual(Array(5).fill(undefined))
   })
})

describe("barCount", () => {
   it("幅に収まる本数を返す", () => {
      expect(barCount(60)).toBe(10)
   })

   it("幅が 0 でも 1 以上を返す", () => {
      expect(barCount(0)).toBe(1)
   })
})
