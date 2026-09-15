import type { MutableRefObject } from "react"
import type { MicrophonePermissionState } from "@/utils/microphone"

/**
 * RecordingInstructionsコンポーネントのProps型定義
 */
export interface RecordingInstructionsProps {
   /**
    * 説明項目の配列
    */
   instructionItems: string[]

   /**
    * 閉じるアニメーション中かどうか
    */
   isClosing: boolean

   /**
    * 同意済みかどうか
    */
   isAgreed: boolean

   /**
    * 確認完了画面を表示するかどうか
    */
   showConfirmationComplete: boolean

   /**
    * マイク権限の状態
    */
   microphonePermission: MicrophonePermissionState

   /**
    * 現在位置が取得できているかどうか
    */
   hasPosition: boolean

   /**
    * マイク許可トグル押下時のコールバック
    */
   onRequestMicrophonePermission: () => void

   /**
    * 同意ボタンクリック時のコールバック
    */
   onAgree: () => void

   /**
    * 録音開始時のコールバック
    */
   onStartRecording: () => void

   /**
    * 外部クリック検知用のref
    */
   instructionsRef: MutableRefObject<HTMLDivElement | null>
}
