/**
 * RecordButtonContentコンポーネントのプロパティ型定義
 */
export interface RecordButtonContentProps {
   /** 録音の状態 */
   status: 'idle' | 'recording' | 'processing' | 'completed'
}
