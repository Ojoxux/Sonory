import type { AudioData } from "@/store/types"

/**
 * Au1dioPlayerSection コンポーネントのProps
 */
export type AudioPlayerSectionProps = {
   /** 音声データ */
   audioData: AudioData | null
   /** 波形プレイヤーの準備完了時のコールバック */
   onWaveformReady?: () => void
   /** 波形プレイヤーの再生完了時のコールバック */
   onWaveformFinish?: () => void
}
