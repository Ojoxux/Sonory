import type { AudioData } from "@/store/types"

/**
 * AI分析結果の型定義
 */
export type AnalysisResult = {
   /** ラベル */
   label: string
   /** 信頼度 (0-1) */
   confidence: number
}

/**
 * バックエンドAI分析結果の型定義
 */
export type BackendAnalysisResult = {
   environment?: {
      description?: string
      primary_type?: string
   }
}

/**
 * AnalysisResultsView コンポーネントのプロパティ型
 *
 * @description
 * AI分析結果表示画面のプロパティ
 */
export type AnalysisResultsViewProps = {
   /** シートの開閉状態 */
   isOpen: boolean
   /** 音声データ */
   audioData: AudioData
   /** AI分析結果 */
   results: AnalysisResult[]
   /** エラーメッセージ（オプション） */
   error?: Error | null
   /** アップロードエラーメッセージ（オプション） */
   uploadError?: string | null
   /** ピン作成エラーメッセージ（オプション） */
   pinCreationError?: string | null
   /** フォールバック結果が使用されたか */
   fallbackUsed?: boolean
   /** バックエンドAI分析結果（オプション） */
   backendAnalysisResult?: BackendAnalysisResult | null
   /** ピン配置ボタンのクリックハンドラー */
   onPlacePin: () => void
   /** 閉じるボタンのクリックハンドラー */
   onClose: () => void
   /** ピン作成ステータス */
   pinCreationStatus?: "idle" | "creating" | "success" | "error"
   /** 現在位置が存在するか */
   hasPosition: boolean
   /** 波形プレイヤーの準備完了時のコールバック */
   onWaveformReady?: () => void
   /** 波形プレイヤーの再生完了時のコールバック */
   onWaveformFinish?: () => void
}
