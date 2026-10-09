/**
 * インストールアイコンコンポーネント
 */

import type { ReactElement } from "react"
import { memo } from "react"
import { Download } from "lucide-react"

export interface InstallIconProps {
   /** 展開状態かどうか */
   isExpanded: boolean
}

/**
 * インストールアイコンコンポーネント
 *
 * @param isExpanded - 展開状態かどうか
 * @returns インストールアイコン
 */
export const InstallIcon = memo(function InstallIcon({
   isExpanded,
}: InstallIconProps): ReactElement {
   return (
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white">
         <Download
            aria-hidden="true"
            className={`h-4 w-4 text-black transition-transform duration-menu ease-out ${
               isExpanded ? "scale-110" : "scale-100"
            }`}
         />
      </div>
   )
})
