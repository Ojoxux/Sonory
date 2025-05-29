'use client'

import type { IconButtonProps } from './type'

/**
 * アイコンボタンコンポーネント
 *
 * @description
 * アイコンを表示するボタンのAtomコンポーネント
 * アクセシビリティとインタラクションを考慮した実装
 *
 * @example
 * ```tsx
 * import { MdSettings } from 'react-icons/md'
 *
 * <IconButton
 *   icon={<MdSettings className="w-5 h-5" />}
 *   ariaLabel="設定"
 *   onClick={() => console.log('設定ボタンがクリックされました')}
 * />
 * ```
 */
export function IconButton({
  icon,
  ariaLabel,
  onClick,
  className = '',
}: IconButtonProps) {
  return (
    <button
      aria-label={ariaLabel}
      onClick={onClick}
      className={`
        w-12 h-12 rounded-full
        transition-all duration-200 ease-in-out
        hover:-translate-y-px hover:scale-105
        active:translate-y-0 active:scale-[1.02]
        flex items-center justify-center
        ${className}
      `}
    >
      {icon}
    </button>
  )
}
