import { describe, expect, it } from "vitest"
import { getWeatherCondition } from "./weather"

describe("getWeatherCondition", () => {
   it("天気コード0は「晴れ」", () => {
      expect(getWeatherCondition(0)).toBe("晴れ")
   })

   it("天気コード3は「曇り」", () => {
      expect(getWeatherCondition(3)).toBe("曇り")
   })

   it("天気コード55は「大雨」", () => {
      expect(getWeatherCondition(55)).toBe("大雨")
   })

   it("天気コード95は「雷雨」", () => {
      expect(getWeatherCondition(95)).toBe("雷雨")
   })

   it("未知のコードは「不明」", () => {
      expect(getWeatherCondition(999)).toBe("不明")
   })
})
