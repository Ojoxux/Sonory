"use client"

import type { IconButtonProps } from "./types"

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
   className = "",
}: IconButtonProps) {
   return (
      <button
         type="button"
         aria-label={ariaLabel}
         onClick={onClick}
         className={`flex h-12 w-12 touch-manipulation items-center justify-center rounded-full transition duration-press ease-out active:scale-97 ${className}`}
      >
         {icon}
      </button>
   )
}
