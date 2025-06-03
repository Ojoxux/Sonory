import type { AudioData } from '../../../store/types'

/**
 * WaveformPlayerコンポーネントのプロパティ型
 */
export type WaveformPlayerProps = {
  /** 再生する音声データ */
  audioData: AudioData | null
  /** 波形の高さ（ピクセル） */
  height?: number
  /** 波形の色 */
  waveColor?: string
  /** 再生プログレスの色 */
  progressColor?: string
  /** クラス名 */
  className?: string
  /** 初期化完了時のコールバック */
  onReady?: () => void
  /** 再生完了時のコールバック */
  onFinish?: () => void
}

/**
 * 波形データの型定義
 */
export type WaveformData = {
  /** 波形の振幅データ（0-1の範囲） */
  peaks: number[]
  /** 音声の総時間（秒） */
  duration: number
}

/**
 * 音声プレイヤーの再生状態
 */
export type PlaybackState = {
  /** 再生中かどうか */
  isPlaying: boolean
  /** 読み込み中かどうか */
  isLoading: boolean
  /** 初期化済みかどうか */
  isInitialized: boolean
  /** 現在の再生時間（秒） */
  currentTime: number
  /** 総再生時間（秒） */
  duration: number
  /** エラー状態 */
  error: Error | null
}

/**
 * 波形描画の設定オプション
 */
export type WaveformConfig = {
  /** 波形の高さ */
  height: number
  /** 波形の色 */
  waveColor: string
  /** プログレスの色 */
  progressColor: string
  /** 波形の解像度（サンプル数） */
  samples: number
  /** バーの最小幅 */
  minBarWidth: number
}

/**
 * Canvas描画のパラメータ
 */
export type CanvasDrawParams = {
  /** Canvasコンテキスト */
  ctx: CanvasRenderingContext2D
  /** Canvas幅 */
  width: number
  /** Canvas高さ */
  height: number
  /** 波形データ */
  peaks: number[]
  /** 再生プログレス（0-1） */
  progress: number
  /** 波形の色 */
  waveColor: string
  /** プログレスの色 */
  progressColor: string
}
