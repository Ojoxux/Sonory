/**
 * ErrorDisplay コンポーネントのプロパティ
 */
export type ErrorDisplayProps = {
   /** エラーメッセージ */
   error?: Error | null
   /** アップロードエラーメッセージ */
   uploadError?: string | null
   /** ピン作成エラーメッセージ */
   pinCreationError?: string | null
}
