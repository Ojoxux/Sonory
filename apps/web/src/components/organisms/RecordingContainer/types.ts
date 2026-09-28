import type { ReactNode } from "react"

/**
 * RecordingContainerコンポーネントのProps型定義
 */
export interface RecordingContainerProps {
   /**
    * 子要素
    */
   children: ReactNode

   /**
    * 展開されているかどうか
    */
   isExpanded: boolean

   /**
    * ドラッグやハンドルの押下で展開状態が変わったときのコールバック
    */
   onExpandedChange: (isExpanded: boolean) => void
}
