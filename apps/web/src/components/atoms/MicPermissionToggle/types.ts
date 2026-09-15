import type { MicrophonePermissionState } from "@/utils/microphone"

/**
 * マイク許可トグルの型定義
 *
 * @param state マイク権限の状態
 * @param onRequest 許可要求時のコールバック
 * @param isClosing 閉じるアニメーション中かどうか
 * @param className 追加のCSSクラス
 */
export type MicPermissionToggleProps = {
   state: MicrophonePermissionState
   onRequest: () => void
   isClosing: boolean
   className?: string
}
