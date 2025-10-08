import type { AudioData } from "@/store/types"

/**
 * AudioReviewView コンポーネントのプロパティ型
 *
 * @description
 * 録音確認画面のプロパティ
 */
export type AudioReviewViewProps = {
   /** 再生する音声データ */
   audioData: AudioData
   /** 録音日時のフォーマット済み文字列 */
   formattedDate: string
   /** 続けるボタンのクリックハンドラー */
   onContinue: () => void
   /** キャンセルボタンのクリックハンドラー */
   onCancel: () => void
   /** 波形プレイヤーの準備完了時のコールバック */
   onWaveformReady?: () => void
   /** 波形プレイヤーの再生完了時のコールバック */
   onWaveformFinish?: () => void
}
