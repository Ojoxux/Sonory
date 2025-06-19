/**
 * インストールボタンコンポーネント
 */

import { memo } from 'react'
import type { ReactElement } from 'react'

export interface InstallButtonProps {
   /** クリック時の処理 */
   onClick: () => Promise<void>
   /** ボタンテキスト */
   children: string
   /** 無効状態かどうか */
   disabled?: boolean
}

/**
 * インストールボタンコンポーネント
 *
 * @param onClick - クリック時の処理
 * @param children - ボタンテキスト
 * @param disabled - 無効状態かどうか
 * @returns インストールボタン
 */
export const InstallButton = memo(function InstallButton({
   onClick,
   children,
   disabled = false,
}: InstallButtonProps): ReactElement {
   return (
      <button
         onClick={onClick}
         disabled={disabled}
         className="flex-1 bg-white text-black text-xs font-medium px-3 py-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
         {children}
      </button>
   )
})
