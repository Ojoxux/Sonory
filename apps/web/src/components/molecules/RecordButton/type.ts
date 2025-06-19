/**
 * RecordButtonコンポーネントのプロパティ型定義
 */
export interface RecordButtonProps {
  /** 録音の状態 */
  status: 'idle' | 'recording' | 'processing' | 'completed'
  /** クリック時のハンドラー */
  onClick: () => void
  /** ボタンの無効化状態 */
  disabled?: boolean
}
