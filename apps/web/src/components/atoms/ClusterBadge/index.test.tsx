import { render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { ClusterBadge } from "./index"

describe("ClusterBadge", () => {
   it("描画した直後から見える", () => {
      const { container, getByRole } = render(
         <ClusterBadge count={11} onClick={vi.fn()} />,
      )

      expect(
         getByRole("button", { name: "11個のピンが集まったクラスタ" }),
      ).toBeDefined()

      // 地図のマーカーは document に繋がっていない要素へ別の React ルートから描かれる。
      // 入りを JS のアニメーションに任せると、不透明度 0 のまま止まって見えなくなる
      const hidden = [
         ...container.querySelectorAll<HTMLElement>("[style]"),
      ].filter(
         (element) =>
            element.style.opacity !== "" && Number(element.style.opacity) === 0,
      )
      expect(hidden).toHaveLength(0)
   })

   it("件数に応じて大きさと色が変わる", () => {
      const badge = (count: number): HTMLElement => {
         const { container, unmount } = render(
            <ClusterBadge count={count} onClick={vi.fn()} />,
         )
         const element = container.querySelector("button")
         if (!element) throw new Error("ボタンが無い")
         const clone = element.cloneNode(true) as HTMLElement
         unmount()
         return clone
      }

      expect(badge(3).className).toContain("w-10")
      expect(badge(25).className).toContain("w-14")
      expect(badge(25).textContent).toBe("25")
   })

   it("99件を超えたら 99+ と出す", () => {
      const { getByRole } = render(
         <ClusterBadge count={120} onClick={vi.fn()} />,
      )
      expect(getByRole("button").textContent).toBe("99+")
   })
})
