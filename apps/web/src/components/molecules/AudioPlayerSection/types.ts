import type { AudioData } from "@/store/types"

/**
 * Au1dioPlayerSection コンポーネントのProps
 */
export type AudioPlayerSectionProps = {
   /** 音声データ */
   audioData: AudioData | null
}
