import { render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { RecordingInstructions } from "./index"

const props = {
   instructionItems: ["項目A", "項目B"],
   isAgreed: false,
   showConfirmationComplete: false,
   microphonePermission: "granted" as const,
   hasPosition: true,
   onRequestMicrophonePermission: vi.fn(),
   onAgree: vi.fn(),
   onStartRecording: vi.fn(),
   instructionsRef: { current: null },
}

/**
 * 中身のうち、不透明度をインラインで 0 にされている要素
 *
 * @description
 * カード自体は motion の入場で 0 から始まるので除く。中身がここに入ると、
 * アニメーションが走らなかったときに永久に見えなくなる
 */
const hiddenContent = (container: HTMLElement): HTMLElement[] => {
   const card = container.firstElementChild
   return [...container.querySelectorAll<HTMLElement>("[style]")].filter(
      (element) =>
         element !== card &&
         element.style.opacity !== "" &&
         Number(element.style.opacity) === 0,
   )
}

describe("RecordingInstructions", () => {
   it("確認事項の画面は、描画した直後から中身が見える", () => {
      const { container, getByText } = render(
         <RecordingInstructions {...props} />,
      )

      expect(getByText("録音前の確認")).toBeDefined()
      expect(getByText("項目A")).toBeDefined()
      expect(hiddenContent(container)).toHaveLength(0)
   })

   it("スライダーの画面は、アニメーションが走らなくても中身が見える", () => {
      const { container, getByText } = render(
         <RecordingInstructions {...props} showConfirmationComplete={true} />,
      )

      expect(getByText("録音開始")).toBeDefined()
      expect(getByText("さあ、録音を始めましょう！")).toBeDefined()
      // 中身の段階表示は CSS が受け持つ。JS が止まっても隠れたままにならない
      expect(hiddenContent(container)).toHaveLength(0)
   })
})
