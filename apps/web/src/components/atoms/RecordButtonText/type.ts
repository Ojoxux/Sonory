/**
 * RecordButtonTextコンポーネントのプロパティ型定義
 */
export interface RecordButtonTextProps {
  /** 録音の状態 */
  status: 'idle' | 'recording' | 'processing' | 'completed'
}
