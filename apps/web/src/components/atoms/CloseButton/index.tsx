/**
 * 閉じるボタンコンポーネント
 */

import type { ReactElement } from "react"
import { memo } from "react"
import { MdClose } from "react-icons/md"

export interface CloseButtonProps {
   /** クリック時の処理 */
   onClick: () => void
   /** アクセシビリティラベル */
   ariaLabel?: string
}

/**
 * 閉じるボタンコンポーネント
 *
 * @param onClick - クリック時の処理
 * @param ariaLabel - アクセシビリティラベル
 * @returns 閉じるボタン
 */
export const CloseButton = memo(function CloseButton({
   onClick,
   ariaLabel = "閉じる",
}: CloseButtonProps): ReactElement {
   return (
      <button
         type="button"
         onClick={onClick}
         className="flex-shrink-0 p-2 text-gray-400 transition-colors hover:text-white"
         aria-label={ariaLabel}
      >
         <MdClose className="h-4 w-4" />
      </button>
   )
})
