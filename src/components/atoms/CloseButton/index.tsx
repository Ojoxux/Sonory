/**
 * 閉じるボタンコンポーネント
 */

import { memo } from 'react'
import type { ReactElement } from 'react'
import { MdClose } from 'react-icons/md'

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
  ariaLabel = '閉じる',
}: CloseButtonProps): ReactElement {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 text-gray-400 hover:text-white transition-colors p-2"
      aria-label={ariaLabel}
    >
      <MdClose className="w-4 h-4" />
    </button>
  )
})
