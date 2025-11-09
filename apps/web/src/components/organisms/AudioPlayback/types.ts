import type { AudioData } from "../../../store/types"

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
 * AudioPlaybackコンポーネントのProps型
 *
 * @description
 * 録音完了後の音声処理オーケストレーターコンポーネントのProps
 * 3つの画面状態（録音確認、AI分析中、分析結果）を管理する
 */
export type AudioPlaybackProps = {
   /** 再生する音声データ */
   audioData: AudioData | null
   /** 閉じるボタンが押されたときのコールバック */
   onClose: () => void
   /** 現在の位置情報（マップピン表示用） */
   currentPosition?: LocationData | null
}
