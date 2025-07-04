/**
 * インストールボタンコンポーネント
 */

import { memo } from "react"
import type { ReactElement } from "react"

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
         type="button"
         onClick={onClick}
         disabled={disabled}
         className="flex-1 rounded-full bg-white px-3 py-2 font-medium text-black text-xs transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
         {children}
      </button>
   )
})
