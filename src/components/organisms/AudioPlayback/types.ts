import type { AudioData } from '../../../store/types'

/**
 * AudioPlaybackコンポーネントのプロパティ型
 */
export type AudioPlaybackProps = {
  /** 再生する音声データ */
  audioData: AudioData | null
  /** 閉じるボタンが押されたときのコールバック */
  onClose: () => void
  /** ダウンロードボタンが押されたときのコールバック */
  onDownload?: (audioData: AudioData) => void
  /** クラス名 */
  className?: string
}
