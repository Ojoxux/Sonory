import type { PanInfo } from "framer-motion"
import type { MutableRefObject, ReactNode } from "react"

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
    * ドラッグ制約用のref
    */
   constraintsRef: MutableRefObject<HTMLDivElement | null>

   /**
    * ドラッグ終了時のコールバック
    */
   onDragEnd: (
      _event: MouseEvent | TouchEvent | PointerEvent,
      info: PanInfo,
   ) => void

   /**
    * 展開/折りたたみ切り替え時のコールバック
    */
   onToggleExpand: () => void
}
