import type { SoundPin } from "@/store/useSoundPinStore"

/**
 * 音声読み込み状態の型定義
 */
export type AudioLoadingStatus = "idle" | "loading" | "ready" | "error"

/**
 * 再生状態の型定義
 */
export type PlaybackState = "idle" | "playing" | "paused" | "ended"

/**
 * PinAudioPlayerコンポーネントのプロパティ型
 */
export interface PinAudioPlayerProps {
   /** 再生する音声ピン */
   pin: SoundPin
   /** 閉じるボタンが押されたときのコールバック */
   onClose: () => void
}

/**
 * 音声プレイヤーのフック戻り値型
 */
export interface UsePinAudioPlayerReturn {
   audioLoadingStatus: AudioLoadingStatus
   playbackState: PlaybackState
   audioLoadError: string | null
   currentTime: number
   duration: number
   isMounted: boolean
   progressBarRef: React.RefObject<HTMLDivElement | null>
   formatRecordedAt: (date: Date) => string
   formatTime: (seconds: number) => string
   togglePlayback: () => Promise<void>
   handleSeek: (event: React.MouseEvent<HTMLDivElement>) => void
   handleClose: () => void
   progressPercentage: number
   isOtherResultsOpen: boolean
   toggleOtherResults: () => void
   formatConfidence: (confidence: number) => string
}
