'use client'

import type { IconButtonProps } from './type'

/**
 * アイコンボタンコンポーネント
 *
 * @description
 * アイコンを表示するボタンのAtomコンポーネント
 * アクセシビリティとインタラクションを考慮した実装
 *
 * @param icon アイコン
 * @param ariaLabel アクセシビリティラベル
 * @param onClick クリックハンドラー
 * @param className クラス名
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
         type="button"
         aria-label={ariaLabel}
         onClick={onClick}
         className={`hover:-translate-y-px flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200 ease-in-out hover:scale-105 active:translate-y-0 active:scale-[1.02] ${className}
      `}
      >
         {icon}
      </button>
   )
}
