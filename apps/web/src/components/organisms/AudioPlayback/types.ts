import type { AudioData } from '../../../store/types'

/**
 * 位置情報の型定義
 */
export type LocationData = {
  /** 緯度 */
  latitude: number
  /** 経度 */
  longitude: number
}

/**
 * AudioPlaybackコンポーネントのプロパティ型
 */
export type AudioPlaybackProps = {
  /** 再生する音声データ */
  audioData: AudioData | null
  /** 閉じるボタンが押されたときのコールバック */
  onClose: () => void
  /** クラス名 */
  className?: string
  /** 現在の位置情報（マップピン表示用） */
  currentPosition?: LocationData | null
}
