/**
 * Sonoryアプリケーションのグローバル状態管理のための型定義
 */

/**
 * 録音状態を表す型
 */
export type RecordingStatus = "idle" | "recording" | "paused" | "completed"

/**
 * アップロード状態を表す型
 */
export type UploadStatus = "idle" | "uploading" | "success" | "error"

/**
 * 分析状態を表す型
 */
export type AnalysisStatus =
   | "idle"
   | "analyzing"
   | "success"
   | "error"
   | "fallback"

/**
 * 音声データを表す型
 */
export type AudioData = {
   /** 音声データのBlob */
   blob: Blob
   /** 音声データのURL */
   url?: string
   /** 録音日時 */
   recordedAt: Date
   /** 音声データのID */
   id: string
   /** 音声の長さ（秒） */
   duration?: number
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
 * Python YAMNet分析結果の型定義
 */
export type PythonAnalysisResult = {
   classifications: Array<{
      label: string
      confidence: number
   }>
   environment?: {
      primary_type: string
      type_scores: Record<string, number>
      description: string
   }
   performance_metrics?: {
      yamnet_inference_time: number
      total_time: number
      processing_ratio: number
   }
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
   /** アップロード状態 */
   uploadStatus: UploadStatus
   /** アップロード進捗（0-100） */
   uploadProgress: number
   /** アップロードエラー */
   uploadError: string | null
   /** アップロード済み音声URL */
   uploadedAudioUrl: string | null
   /** アップロード済み音声ID */
   uploadedAudioId: string | null
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
   /** 音声アップロード */
   uploadAudioToStorage: (
      audioBlob: Blob,
      metadata: {
         duration: number
         location?: { lat: number; lng: number; accuracy?: number }
      },
   ) => Promise<{ url: string; id: string }>
   /** アップロード状態設定 */
   setUploadStatus: (status: UploadStatus) => void
   /** アップロード進捗設定 */
   setUploadProgress: (progress: number) => void
   /** アップロードエラー設定 */
   setUploadError: (error: string | null) => void
   /** アップロード状態クリア */
   clearUploadState: () => void
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
   /** 分析状態 */
   analysisStatus: AnalysisStatus
   /** バックエンド分析結果 */
   backendAnalysisResult: PythonAnalysisResult | null
   /** フォールバック使用フラグ */
   fallbackUsed: boolean
   /** 分析エラー */
   analysisError: string | null
   /** 最後に分析した音声ID */
   lastAnalyzedAudioId: string | null
   /** 推論開始 */
   startInference: (audioData: AudioData) => Promise<void>
   /** 推論結果のクリア */
   clearResults: () => void
   /** 推論結果の設定 */
   setResults: (results: InferenceResult[]) => void
   /** 推論エラーの設定 */
   setError: (error: Error | null) => void
   /** バックエンドで音声分析 */
   analyzeAudioWithBackend: (
      audioId: string,
      audioUrl: string,
   ) => Promise<InferenceResult[]>
   /** 分析状態設定 */
   setAnalysisStatus: (status: AnalysisStatus) => void
   /** バックエンド分析結果設定 */
   setBackendAnalysisResult: (result: PythonAnalysisResult) => void
   /** フォールバック使用設定 */
   setFallbackUsed: (used: boolean) => void
   /** 分析状態クリア */
   clearAnalysisState: () => void
}
