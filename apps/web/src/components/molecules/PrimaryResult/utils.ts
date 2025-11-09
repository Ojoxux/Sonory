/**
 * 信頼度をパーセンテージでフォーマット
 *
 * @param confidence - 信頼度 (0-1)
 * @returns フォーマット済み文字列（例: "85%"）
 */
export function formatConfidence(confidence: number): string {
   return `${Math.round(confidence * 100)}%`
}
