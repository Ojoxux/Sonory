import type { MicrophonePermissionState } from "@/utils/microphone"

/** 状態ごとの補足文言 */
export const MIC_PERMISSION_DESCRIPTIONS: Record<
   MicrophonePermissionState,
   string
> = {
   unknown: "タップするとブラウザの許可ダイアログが開きます",
   requesting: "ブラウザの許可ダイアログに応答してください",
   granted: "許可済みです。録音を開始できます",
   denied: "ブロックされています。ブラウザの設定から許可してください",
}
