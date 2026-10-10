import { describe, expect, it } from "vitest"
import { getLightPreset, isDarkHour, type LightPreset } from "./daylight"

const ALL_HOURS = Array.from({ length: 24 }, (_, hour) => hour)

describe("getLightPreset", () => {
   it.each([
      [0, "night"],
      [3, "night"],
      [4, "dawn"],
      [7, "dawn"],
      [8, "day"],
      [16, "day"],
      [17, "dusk"],
      [21, "dusk"],
      [22, "night"],
      [23, "night"],
   ] as [number, LightPreset][])("%i時は %s", (hour, preset) => {
      expect(getLightPreset(hour)).toBe(preset)
   })

   it("4つのプリセットがすべて使われる（到達しない分岐を作らない）", () => {
      const used = new Set(ALL_HOURS.map(getLightPreset))
      expect([...used].sort()).toEqual(["dawn", "day", "dusk", "night"])
   })
})

describe("isDarkHour", () => {
   it("昼だけが明るい", () => {
      const dark = ALL_HOURS.filter(isDarkHour)
      // 17時から翌8時まで。地図が dusk / night / dawn のあいだは暗い
      expect(dark).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 17, 18, 19, 20, 21, 22, 23])
   })
})
