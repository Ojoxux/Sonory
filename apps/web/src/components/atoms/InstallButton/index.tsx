/**
 * インストールボタンコンポーネント
 */

import type { ReactElement } from "react"
import { memo } from "react"

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
         className="flex-1 touch-manipulation rounded-full bg-white px-3 py-2 font-medium text-black text-xs transition duration-press ease-out hover:bg-neutral-100 not-disabled:active:scale-97 disabled:cursor-not-allowed disabled:opacity-50"
      >
         {children}
      </button>
   )
})
