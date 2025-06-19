/**
 * Sonoryアプリケーションのグローバル状態管理のための型定義
 */

/**
 * 録音状態を表す型
 */
export type RecordingStatus = 'idle' | 'recording' | 'paused' | 'completed'

/**
 * 音声データを表す型
 */
export type AudioData = {
  /** 音声データのBlob */
  blob: Blob
  /** 音声データのURL */
  url: string
  /** 録音日時 */
  recordedAt: Date
  /** 音声データのID */
  id: string
}

/**
 * AI推論結果を表す型
 */
export type InferenceResult = {
  /** 推論結果のラベル */
  label: string
  /** 推論結果の確信度 (0-1) */
  confidence: number
}

/**
 * 録音ストアの状態を表す型
 */
export type RecorderState = {
  /** 現在の録音状態 */
  status: RecordingStatus
  /** 録音データ */
  audioData: AudioData | null
  /** 録音の経過時間（ミリ秒） */
  elapsedTime: number
  /** 録音開始 */
  startRecording: () => void
  /** 録音停止 */
  stopRecording: () => void
  /** 録音一時停止 */
  pauseRecording: () => void
  /** 録音再開 */
  resumeRecording: () => void
  /** 録音データのリセット */
  resetRecording: () => void
  /** 録音時間の更新 */
  updateElapsedTime: (time: number) => void
  /** 録音データの設定 */
  setAudioData: (data: AudioData) => void
}

/**
 * AI推論ストアの状態を表す型
 */
export type InferenceState = {
  /** 推論結果 */
  results: InferenceResult[]
  /** 推論中かどうか */
  isInferring: boolean
  /** 推論エラー */
  error: Error | null
  /** 推論開始 */
  startInference: (audioData: AudioData) => Promise<void>
  /** 推論結果のクリア */
  clearResults: () => void
  /** 推論結果の設定 */
  setResults: (results: InferenceResult[]) => void
  /** 推論エラーの設定 */
  setError: (error: Error | null) => void
}
