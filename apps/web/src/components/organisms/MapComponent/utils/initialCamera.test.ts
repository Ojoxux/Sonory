import { describe, expect, it } from "vitest"
import { getInitialCamera } from "./initialCamera"

describe("getInitialCamera", () => {
   it("保存された位置が無ければ日本全体", () => {
      expect(getInitialCamera(null).zoom).toBe(4.5)
   })

   it("保存された位置があればそこから開く", () => {
      const camera = getInitialCamera(
         JSON.stringify({ latitude: 37.9, longitude: 139.0, timestamp: 0 }),
      )
      expect(camera.center).toEqual([139.0, 37.9])
      expect(camera.zoom).toBe(16)
   })

   it("壊れた値は日本全体にする", () => {
      expect(getInitialCamera("{not json").zoom).toBe(4.5)
      expect(getInitialCamera(JSON.stringify({ latitude: "x" })).zoom).toBe(4.5)
   })
})
