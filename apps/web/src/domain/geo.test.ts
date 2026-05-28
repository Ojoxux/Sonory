import { describe, expect, it } from "vitest"
import {
   calculateDistanceKm,
   calculateDistanceMeters,
   generateTimeTag,
} from "./geo"

describe("calculateDistanceKm", () => {
   it("同一地点の距離は0", () => {
      expect(calculateDistanceKm(35.6762, 139.6503, 35.6762, 139.6503)).toBe(0)
   })

   it("東京タワーとスカイツリー間は約8km", () => {
      const distance = calculateDistanceKm(
         35.6586,
         139.7454, // 東京タワー
         35.7101,
         139.8107, // スカイツリー
      )
      expect(distance).toBeGreaterThan(7)
      expect(distance).toBeLessThan(10)
   })

   it("東京からニューヨークは約10,000km", () => {
      const distance = calculateDistanceKm(
         35.6762,
         139.6503, // 東京
         40.7128,
         -74.006, // ニューヨーク
      )
      expect(distance).toBeGreaterThan(10000)
      expect(distance).toBeLessThan(11000)
   })
})

describe("calculateDistanceMeters", () => {
   it("km * 1000 と同じ結果", () => {
      const km = calculateDistanceKm(35.6586, 139.7454, 35.7101, 139.8107)
      const meters = calculateDistanceMeters(
         35.6586,
         139.7454,
         35.7101,
         139.8107,
      )
      expect(meters).toBeCloseTo(km * 1000, 5)
   })
})

describe("generateTimeTag", () => {
   it("朝（6:00-11:59）", () => {
      expect(generateTimeTag(new Date("2024-01-01T06:00:00"))).toBe("朝")
      expect(generateTimeTag(new Date("2024-01-01T11:59:00"))).toBe("朝")
   })

   it("昼（12:00-17:59）", () => {
      expect(generateTimeTag(new Date("2024-01-01T12:00:00"))).toBe("昼")
      expect(generateTimeTag(new Date("2024-01-01T17:59:00"))).toBe("昼")
   })

   it("夕（18:00-20:59）", () => {
      expect(generateTimeTag(new Date("2024-01-01T18:00:00"))).toBe("夕")
      expect(generateTimeTag(new Date("2024-01-01T20:59:00"))).toBe("夕")
   })

   it("夜（21:00-5:59）", () => {
      expect(generateTimeTag(new Date("2024-01-01T21:00:00"))).toBe("夜")
      expect(generateTimeTag(new Date("2024-01-01T23:59:00"))).toBe("夜")
      expect(generateTimeTag(new Date("2024-01-01T00:00:00"))).toBe("夜")
      expect(generateTimeTag(new Date("2024-01-01T05:59:00"))).toBe("夜")
   })
})
