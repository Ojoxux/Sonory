import { describe, expect, it } from "vitest"
import {
   convertAnalysisResult,
   generateClassificationResults,
} from "./analysis"

describe("generateClassificationResults", () => {
   it("結果が空でない", () => {
      const results = generateClassificationResults()
      expect(results.length).toBeGreaterThan(0)
   })

   it("結果は信頼度の降順", () => {
      const results = generateClassificationResults()
      for (let i = 1; i < results.length; i++) {
         expect(results[i - 1].confidence).toBeGreaterThanOrEqual(
            results[i].confidence,
         )
      }
   })

   it("各結果にlabelとconfidenceがある", () => {
      const results = generateClassificationResults()
      for (const result of results) {
         expect(result.label).toBeTruthy()
         expect(typeof result.confidence).toBe("number")
      }
   })
})

describe("convertAnalysisResult", () => {
   it("classificationsをInferenceResult形式に変換", () => {
      const results = convertAnalysisResult({
         classifications: [
            { label: "鳥の声", confidence: 0.9 },
            { label: "風の音", confidence: 0.5 },
         ],
      })
      expect(results).toHaveLength(2)
      expect(results[0].label).toBe("鳥の声")
      expect(results[0].confidence).toBe(0.9)
   })

   it("空のclassificationsはエラー", () => {
      expect(() => convertAnalysisResult({ classifications: [] })).toThrow(
         "分析結果が空でした",
      )
   })

   it("最大5件に制限", () => {
      const results = convertAnalysisResult({
         classifications: Array.from({ length: 10 }, (_, i) => ({
            label: `label${i}`,
            confidence: 1 - i * 0.1,
         })),
      })
      expect(results).toHaveLength(5)
   })
})
