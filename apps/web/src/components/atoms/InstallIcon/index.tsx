/**
 * インストールアイコンコンポーネント
 */

import { memo } from "react";
import type { ReactElement } from "react";
import { MdInstallMobile } from "react-icons/md";

export interface InstallIconProps {
	/** 展開状態かどうか */
	isExpanded: boolean;
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
		<div
			className={`
        flex-shrink-0 w-8 h-8 bg-white rounded-full
        flex items-center justify-center
        transition-all duration-300
      `}
		>
			<MdInstallMobile
				className={`
          w-4 h-4 text-black
          transition-transform duration-300
          ${isExpanded ? "scale-110" : "scale-100"}
        `}
			/>
		</div>
	);
});
